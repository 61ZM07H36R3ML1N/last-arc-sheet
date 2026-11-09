import { CLASSES } from '../data';
import type { CharacterSheet } from '../types';
import { getModifier } from './formulas';
import { checkAdvancedClassEligibility } from './classRequirements';

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

/** Pure level advancement. Does not automatically grant talents, skills or Technicks. */
export function advanceCharacter(
  sheet: CharacterSheet,
  choices: AdvancementChoices,
): AdvancementResult {
  const allClasses = CLASSES.flat();
  const selected = allClasses.find((entry) => entry.id === choices.classId);
  if (!selected) throw new Error(`Unknown class: ${choices.classId}`);

  if (!sheet.classes.length || sheet.classes.some((entry) =>
    !Number.isSafeInteger(entry.level) || entry.level < 1 ||
    !allClasses.some((known) => known.name === entry.name)
  )) {
    throw new Error('Character has invalid existing class progression.');
  }

  const previousLevel = sheet.classes.reduce((sum, entry) => sum + entry.level, 0);
  if (!Number.isSafeInteger(previousLevel) || previousLevel < 1 || previousLevel >= 20) {
    throw new Error('Character must be between levels 1 and 19 to advance.');
  }

  const matching = sheet.classes.filter((entry) => entry.name === selected.name);
  if (matching.length > 1) throw new Error(`Duplicate class entries: ${selected.name}`);

  // Only check entry requirements when entering a new Advanced Class.
  if (selected.type === 'advanced' && matching.length === 0) {
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
  let classLevel: number;
  if (index >= 0) {
    nextClasses[index] = { ...nextClasses[index], level: nextClasses[index].level + 1 };
    classLevel = nextClasses[index].level;
  } else {
    nextClasses.push({ name: selected.name, level: 1 });
    classLevel = 1;
  }

  return {
    character: {
      ...sheet,
      classes: nextClasses,
      baseAttributes: { ...sheet.baseAttributes },
      trainedSkills: [...sheet.trainedSkills],
      focusedSkills: [...sheet.focusedSkills],
      technicks: [...sheet.technicks],
      talents: [...sheet.talents],
      inventory: sheet.inventory.map((item) => ({ ...item })),
      equipped: Object.fromEntries(Object.entries(sheet.equipped).map(([slot, item]) =>
        [slot, item ? { ...item } : item])) as CharacterSheet['equipped'],
      // Existing sheet stores current pools, not explicit maximum HP/MP.
      // Apply the level gain without healing prior damage.
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
