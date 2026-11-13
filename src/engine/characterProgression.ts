import { CLASSES } from '../data';
import type { CharacterSheet } from '../types';
import type { AbilityProgressionState, ClassLevelEvent } from '../types/abilities';
import { getModifier } from './formulas';
import { checkAdvancedClassEligibility } from './classRequirements';
import { importLegacyAbilities, validateAcquisitionSlots, validateLevelHistory, generateAbilitySlots } from './abilityProgression';

export interface AdvancementChoices {
  classId: string;
  /** GM confirmation for campaign-specific Advanced Class requirements. */
  gmApproved?: boolean;
}

export interface AdvancementResult {
  character: CharacterSheet;
  previousLevel: number;
  newLevel: number;
  className: string;
  classLevel: number;
  hpGained: number;
  mpGained: number;
}

/**
 * Verify a complete history against current class totals.
 * A partial or absent history is NOT reconstructed from class totals.
 */
function hasVerifiedHistory(sheet: CharacterSheet, progression: AbilityProgressionState): boolean {
  const history = progression.levelHistory;
  const totalLevel = sheet.classes.reduce((sum, entry) => sum + entry.level, 0);
  if (history.length !== totalLevel) return false;
  const issues = validateLevelHistory(history);
  if (issues.length) throw new Error(`Invalid level history: ${issues.join('; ')}`);

  const expected = new Map<string, number>();
  for (const entry of sheet.classes) {
    const definition = CLASSES.flat().find((item) => item.name === entry.name);
    if (!definition) throw new Error(`Unknown class: ${entry.name}`);
    expected.set(definition.id, entry.level);
  }
  const actual = new Map<string, number>();
  for (const event of history) actual.set(event.classId, event.classLevel);
  if (actual.size !== expected.size || [...expected].some(([id, level]) => actual.get(id) !== level)) {
    throw new Error('Recorded level history does not match current class levels.');
  }
  const slotIssues = validateAcquisitionSlots(generateAbilitySlots(history), progression.acquisitions);
  if (slotIssues.length) throw new Error(`Invalid ability acquisitions: ${slotIssues.join('; ')}`);
  return true;
}

/**
 * Pure level advancement. Creates a history event only when prior history
 * is complete and verified. Never grants or chooses Technicks/Talents.
 */
export function advanceCharacter(sheet: CharacterSheet, choices: AdvancementChoices): AdvancementResult {
  const allClasses = CLASSES.flat();
  const selected = allClasses.find((entry) => entry.id === choices.classId);
  if (!selected) throw new Error(`Unknown class: ${choices.classId}`);

  const seen = new Set<string>();
  if (!sheet.classes.length || sheet.classes.some((entry) => {
    const known = allClasses.find((item) => item.name === entry.name);
    if (!known || !Number.isSafeInteger(entry.level) || entry.level < 1 || seen.has(known.id)) return true;
    seen.add(known.id);
    return false;
  })) {
    throw new Error('Character has invalid or duplicate class progression.');
  }

  const previousLevel = sheet.classes.reduce((sum, entry) => sum + entry.level, 0);
  if (!Number.isSafeInteger(previousLevel) || previousLevel < 1 || previousLevel >= 20) {
    throw new Error('Character must be between levels 1 and 19 to advance.');
  }

  const progression = sheet.abilityProgression ?? importLegacyAbilities(sheet.technicks, sheet.talents);
  const verifiedHistory = hasVerifiedHistory(sheet, progression);
  // A nonempty but incomplete history cannot be safely extended or repaired automatically.
  // Keep it unchanged and flagged for reconciliation.

  const matching = sheet.classes.find((entry) => entry.name === selected.name);
  if (selected.type === 'advanced' && !matching) {
    const eligibility = checkAdvancedClassEligibility(sheet, selected.id, {
      gmApproved: choices.gmApproved,
    });
    if (!eligibility.eligible) {
      throw new Error(`Cannot enter ${selected.name}: ${eligibility.missing.join('; ')}`);
    }
  }

  const hpGained = Math.max(1, selected.hpPerLevel + getModifier(sheet.baseAttributes.vit));
  const mpGained = Math.max(0, selected.mpPerLevel + getModifier(sheet.baseAttributes.mnd));
  const nextClasses = sheet.classes.map((entry) => ({ ...entry }));
  const index = nextClasses.findIndex((entry) => entry.name === selected.name);
  const classLevel = index >= 0 ? nextClasses[index].level + 1 : 1;
  if (index >= 0) nextClasses[index] = { ...nextClasses[index], level: classLevel };
  else nextClasses.push({ name: selected.name, level: classLevel });

  const event: ClassLevelEvent = {
    characterLevel: previousLevel + 1,
    classId: selected.id,
    classLevel,
  };
  const nextProgression: AbilityProgressionState = verifiedHistory
    ? {
        ...progression,
        levelHistory: [...progression.levelHistory, event],
      }
    : {
        ...progression,
        needsReconciliation: true,
      };

  return {
    character: {
      ...sheet,
      classes: nextClasses,
      abilityProgression: nextProgression,
      baseAttributes: { ...sheet.baseAttributes },
      trainedSkills: [...sheet.trainedSkills],
      focusedSkills: [...sheet.focusedSkills],
      technicks: [...sheet.technicks],
      talents: [...sheet.talents],
      inventory: sheet.inventory.map((item) => ({ ...item })),
      equipped: Object.fromEntries(Object.entries(sheet.equipped).map(([slot, item]) =>
        [slot, item ? { ...item } : item])) as CharacterSheet['equipped'],
      currentHp: sheet.currentHp + hpGained,
      currentMp: sheet.currentMp + mpGained,
    },
    previousLevel,
    newLevel: previousLevel + 1,
    className: selected.name,
    classLevel,
    hpGained,
    mpGained,
  };
}
