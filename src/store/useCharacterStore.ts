import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { CharacterSheet } from '../types';
import type { ZodiacSign } from '../data/zodiac';

import { CLASSES } from '../data';

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
 * Calculate the total character level across all classes.
 *
 * Example:
 * Warrior 7 + Scholar 2 = Character Level 9
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

const defaultClass = getDefaultClass();

// ============================================================
// Default Character
// ============================================================

export function getDefaultCharacter(): CharacterSheet {
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

    technicks: Array.from(
      new Set([
        ...defaultClass.startingTechnicks,
        'Power Attack',
      ]),
    ),

    talents: ['Provoke'],

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

      /**
       * Restore daily Hero Points based on total level.
       *
       * Multiclass levels are included automatically.
       */
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
          sheet: newSheet,
        }),

      // ------------------------------------------------------
      // Character Advancement
      // ------------------------------------------------------

      /**
       * Save a character advancement using the authoritative
       * progression engine.
       *
       * The modal provides:
       * - Expected character ID
       * - Expected character level
       * - Advancement choices
       *
       * The store:
       * 1. Reads the latest character state.
       * 2. Checks that the character has not changed identity
       *    or level since the preview.
       * 3. Revalidates advancement rules.
       * 4. Applies the updated character sheet.
       * 5. Lets Zustand persist the update.
       *
       * Invalid advancement throws before committing.
       */
      saveAdvancement: (
        expectedCharacterId,
        expectedLevel,
        choices,
      ) =>
        set((state) => {
          const current = state.sheet;

          const currentLevel = getCharacterLevel(current);

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

          // Enforce the character level cap.
          if (currentLevel >= MAX_CHARACTER_LEVEL) {
            throw new Error(
              'Character has reached the maximum level.',
            );
          }

          // Revalidate against the latest character sheet.
          const result = advanceCharacter(
            current,
            choices,
          );

          // Commit the validated advancement.
          return {
            sheet: result.character,
          };
        }),
    }),

    // --------------------------------------------------------
    // Persistence Configuration
    // --------------------------------------------------------

    {
      name: STORAGE_KEY,
    },
  ),
);