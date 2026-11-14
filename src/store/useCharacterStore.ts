import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { CharacterSheet } from '../types';
import type { ZodiacSign } from '../data/zodiac';
import type { AbilityProgressionState } from '../types/abilities';

import { CLASSES } from '../data';
import { getEnabledSourcebooks } from '../data/sourcebooks';

import {
  abilityRegistry,
  type EligibilityContext,
} from '../engine/abilityEligibility';

import {
  acquireAbility as validateAbilityAcquisition,
} from '../engine/abilitySelection';

import {
  generateAbilitySlots,
  importLegacyAbilities,
  validateLevelHistory,
  validateAcquisitionSlots,
} from '../engine/abilityProgression';

import {
  advanceCharacter,
  type AdvancementChoices,
} from '../engine/characterProgression';

// ============================================================
// Constants
// ============================================================

const DEFAULT_CLASS_ID = 'warrior';
const STORAGE_KEY = 'last-arc-character-storage';

const MAX_CHARACTER_LEVEL = 20;
const MAX_HERO_POINTS = 4;

// Adjust these IDs to match the sourcebook registry.
// Atlas content remains disabled until explicitly configured.
const DEFAULT_ENABLED_SOURCEBOOKS = getEnabledSourcebooks();

// ============================================================
// Helpers
// ============================================================

function getDefaultClass() {
  const found = CLASSES.flat().find(
    (entry) => entry.id === DEFAULT_CLASS_ID,
  );

  if (!found) {
    throw new Error(
      `Default character class not found: ${DEFAULT_CLASS_ID}`,
    );
  }

  return found;
}

/**
 * Calculate total character level across all classes.
 */
export function getCharacterLevel(
  sheet: CharacterSheet,
): number {
  return sheet.classes.reduce(
    (total, entry) => total + entry.level,
    0,
  );
}

/**
 * Calculate daily Hero Points based on character level.
 *
 * Levels  1-5:  1 Hero Point
 * Levels  6-10: 2 Hero Points
 * Levels 11-15: 3 Hero Points
 * Levels 16-20: 4 Hero Points
 */
export function getMaxHeroPoints(
  level: number,
): number {
  if (!Number.isFinite(level)) {
    throw new Error('Invalid character level.');
  }

  const safeLevel = Math.max(
    1,
    Math.min(MAX_CHARACTER_LEVEL, Math.floor(level)),
  );

  return Math.min(
    MAX_HERO_POINTS,
    1 + Math.floor((safeLevel - 1) / 5),
  );
}

/**
 * Preserve historical abilities without inventing when
 * or how they were acquired.
 */
function ensureAbilityProgression(
  sheet: CharacterSheet,
): AbilityProgressionState {
  return (
    sheet.abilityProgression ??
    importLegacyAbilities(
      sheet.technicks,
      sheet.talents,
    )
  );
}

/**
 * Ensure imported characters have progression metadata.
 *
 * Existing level histories are preserved unchanged.
 */
function normalizeCharacter(
  sheet: CharacterSheet,
): CharacterSheet {
  return {
    ...sheet,
    abilityProgression: ensureAbilityProgression(sheet),
  };
}

/**
 * Verify that recorded history describes the character's
 * current class levels.
 *
 * This does not reconstruct missing multiclass history.
 */
function validateCharacterHistory(
  sheet: CharacterSheet,
  progression: AbilityProgressionState,
): void {
  if (progression.needsReconciliation) {
    throw new Error('Reconcile legacy ability history before selecting abilities.');
  }

  const history = progression.levelHistory;
  const characterLevel = getCharacterLevel(sheet);

  if (history.length !== characterLevel) {
    throw new Error(
      'Complete level history is required before ' +
      'selecting abilities.',
    );
  }

  const issues = validateLevelHistory(history);

  if (issues.length > 0) {
    throw new Error(issues.join('; '));
  }

  const recordedLevels = new Map<string, number>();

  for (const event of history) {
    recordedLevels.set(
      event.classId,
      event.classLevel,
    );
  }

  const currentLevels = new Map<string, number>();

  for (const entry of sheet.classes) {
    const definition = CLASSES.flat().find(
      (candidate) =>
        candidate.name.toLowerCase() ===
        entry.name.toLowerCase(),
    );

    if (!definition) {
      throw new Error(
        `Unknown character class: ${entry.name}`,
      );
    }

    currentLevels.set(
      definition.id,
      (currentLevels.get(definition.id) ?? 0) +
        entry.level,
    );
  }

  for (const [classId, level] of currentLevels) {
    if (recordedLevels.get(classId) !== level) {
      throw new Error(
        `Level history does not match ${classId} ` +
        `class level ${level}.`,
      );
    }
  }

  for (const classId of recordedLevels.keys()) {
    if (!currentLevels.has(classId)) {
      throw new Error(
        `Level history contains an unexpected class: ${classId}`,
      );
    }
  }
}

// ============================================================
// Default Character
// ============================================================

const defaultClass = getDefaultClass();

export function getDefaultCharacter(): CharacterSheet {
  const technicks = Array.from(
    new Set([
      ...defaultClass.startingTechnicks,
      'Power Attack',
    ]),
  );

  const talents = ['Provoke'];

  return {
    id: 'char-1',
    name: 'Kress',
    race: 'Human',
    zodiacSign: 'Aries',
    ethos: 'Pure Good',

    classes: [
      {
        name: defaultClass.name,
        level: 1,
      },
    ],

    baseAttributes: {
      str: 16,
      vit: 14,
      agi: 12,
      int: 10,
      mnd: 10,
      chr: 8,
    },

    currentHp: 32,
    tempHp: 0,

    currentMp: 6,
    tempMp: 0,

    breakStep: 0,
    heroPoints: 1,

    gold: 1000,

    notes:
      'Campaign notes, quest logs, and NPC interactions...',

    trainedSkills: [
      'Athletics',
      '1-Handed',
      '2-Handed',
    ],

    focusedSkills: [],

    technicks,
    talents,

    abilityProgression: importLegacyAbilities(
      technicks,
      talents,
    ),

    equipped: {},
    inventory: [],
  };
}

// ============================================================
// Store Interface
// ============================================================

export interface CharacterStore {
  sheet: CharacterSheet;

  // Combat resources
  updateHp: (delta: number) => void;
  updateMp: (delta: number) => void;
  setBreakStep: (step: number) => void;

  // Hero Points
  useHeroPoint: () => void;
  resetHeroPoints: () => void;

  // Character information
  updateNotes: (notes: string) => void;
  setZodiacSign: (sign: ZodiacSign) => void;

  // Import / Export
  importSheet: (sheet: CharacterSheet) => void;

  // Ability acquisition
  acquireAbility: (
    slotId: string,
    abilityId: string,
  ) => void;


  
  // Character advancement
  saveAdvancement: (
    expectedCharacterId: string,
    expectedLevel: number,
    choices: AdvancementChoices,
  ) => void;
}

// ============================================================
// Zustand Character Store
// ============================================================

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set) => ({
      // ------------------------------------------------------
      // Initial State
      // ------------------------------------------------------

      sheet: getDefaultCharacter(),

      // ------------------------------------------------------
      // HP Management
      // ------------------------------------------------------

      updateHp: (delta) =>
        set((state) => ({
          sheet: {
            ...state.sheet,
            currentHp: Math.max(
              0,
              state.sheet.currentHp + delta,
            ),
          },
        })),

      // ------------------------------------------------------
      // MP Management
      // ------------------------------------------------------

      updateMp: (delta) =>
        set((state) => ({
          sheet: {
            ...state.sheet,
            currentMp: Math.max(
              0,
              state.sheet.currentMp + delta,
            ),
          },
        })),

      // ------------------------------------------------------
      // Break Gauge
      // ------------------------------------------------------

      setBreakStep: (step) =>
        set((state) => ({
          sheet: {
            ...state.sheet,
            breakStep: Math.min(
              4,
              Math.max(0, step),
            ),
          },
        })),

      // ------------------------------------------------------
      // Hero Point Management
      // ------------------------------------------------------

      useHeroPoint: () =>
        set((state) => ({
          sheet: {
            ...state.sheet,
            heroPoints: Math.max(
              0,
              state.sheet.heroPoints - 1,
            ),
          },
        })),

      resetHeroPoints: () =>
        set((state) => {
          const level = getCharacterLevel(state.sheet);

          return {
            sheet: {
              ...state.sheet,
              heroPoints: getMaxHeroPoints(level),
            },
          };
        }),

      // ------------------------------------------------------
      // Notes
      // ------------------------------------------------------

      updateNotes: (notes) =>
        set((state) => ({
          sheet: {
            ...state.sheet,
            notes,
          },
        })),

      // ------------------------------------------------------
      // Zodiac Sign
      // ------------------------------------------------------

      setZodiacSign: (sign) =>
        set((state) => ({
          sheet: {
            ...state.sheet,
            zodiacSign: sign,
          },
        })),

      // ------------------------------------------------------
      // Character Import
      // ------------------------------------------------------

      importSheet: (newSheet) =>
        set({
          sheet: normalizeCharacter(newSheet),
        }),

      // ------------------------------------------------------
      // Atomic Ability Acquisition
      // ------------------------------------------------------

      acquireAbility: (slotId, abilityId) =>
        set((state) => {
          const current = state.sheet;

          // Read the latest progression state.
          const progression =
            ensureAbilityProgression(current);

          // Never invent multiclass advancement history.
          validateCharacterHistory(
            current,
            progression,
          );

          // Generate slots from authoritative history.
          const slots = generateAbilitySlots(
            progression.levelHistory,
          );

          const slot = slots.find(
            (entry) => entry.id === slotId,
          );

          if (!slot) {
            throw new Error(
              `Unknown progression slot: ${slotId}`,
            );
          }

          // Reject already-spent slots.
          if (
            progression.acquisitions.some(
              (entry) => entry.slotId === slotId,
            )
          ) {
            throw new Error(
              'This ability selection slot is already spent.',
            );
          }

          // Validate all previously recorded acquisitions.
          const existingIssues =
            validateAcquisitionSlots(
              slots,
              progression.acquisitions,
            );

          if (existingIssues.length > 0) {
            throw new Error(
              existingIssues.join('; '),
            );
          }

          // Resolve the ability from the registry.
          const rule = abilityRegistry.find(
            (entry) => entry.id === abilityId,
          );

          if (!rule) {
            throw new Error(
              `Unknown ability: ${abilityId}`,
            );
          }

          // Construct eligibility using recorded facts.
          //
          // Historical attributes, training, and ability
          // snapshots are intentionally omitted.
          //
          // Requirements that depend on unavailable
          // history must remain unresolved.
          const context: EligibilityContext = {
            slot,
            enabledSourcebooks:
              DEFAULT_ENABLED_SOURCEBOOKS,
            acquired: progression.acquisitions,
          };

          // Validate and create the acquisition.
          // This function must not mutate existing state.
          const acquisitions =
            validateAbilityAcquisition(
              slot,
              rule,
              context,
            );

          // Validate the complete resulting ledger.
          const acquisitionIssues =
            validateAcquisitionSlots(
              slots,
              acquisitions,
            );

          if (acquisitionIssues.length > 0) {
            throw new Error(
              acquisitionIssues.join('; '),
            );
          }

          // Maintain legacy name-based compatibility.
          //
          // Repeatable acquisitions remain distinct in
          // the authoritative progression ledger.
          const technicks =
            rule.kind === 'technick' &&
            !current.technicks.includes(rule.name)
              ? [
                  ...current.technicks,
                  rule.name,
                ]
              : current.technicks;

          const talents =
            rule.kind === 'talent' &&
            !current.talents.includes(rule.name)
              ? [
                  ...current.talents,
                  rule.name,
                ]
              : current.talents;

          // Single atomic state update.
          return {
            sheet: {
              ...current,

              abilityProgression: {
                ...progression,
                acquisitions,
              },

              technicks,
              talents,
            },
          };
        }),

      // ------------------------------------------------------
      // Character Advancement
      // ------------------------------------------------------

      saveAdvancement: (
        expectedCharacterId,
        expectedLevel,
        choices,
      ) =>
        set((state) => {
          const current = state.sheet;

          const currentLevel =
            getCharacterLevel(current);

          // Prevent stale advancement previews.
          if (
            current.id !== expectedCharacterId ||
            currentLevel !== expectedLevel
          ) {
            throw new Error(
              'Character changed since preview. ' +
              'Close advancement and try again.',
            );
          }

          // Enforce character level cap.
          if (
            currentLevel >= MAX_CHARACTER_LEVEL
          ) {
            throw new Error(
              'Character has reached the maximum level.',
            );
          }

          // Revalidate against latest character state.
          const result = advanceCharacter(
            current,
            choices,
          );

          // Preserve existing progression metadata
          // if advancement returns an older sheet shape.
          const progression =
            ensureAbilityProgression(current);

          const advanced = result.character;

          return {
            sheet: {
              ...advanced,
              abilityProgression:
                advanced.abilityProgression ??
                progression,
            },
          };
        }),
    }),

    // --------------------------------------------------------
    // Persistence Configuration
    // --------------------------------------------------------

    {
      name: STORAGE_KEY,

      // Upgrade persisted characters that predate
      // the ability progression schema.
      merge: (persistedState, currentState) => {
        const persisted = persistedState as
          | Partial<CharacterStore>
          | undefined;

        if (!persisted?.sheet) {
          return currentState;
        }

        return {
          ...currentState,
          ...persisted,
          sheet: normalizeCharacter(
            persisted.sheet,
          ),
        };
      },
    },
  ),
);