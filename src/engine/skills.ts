import type { AttributeKey, CharacterSheet } from '../types';
import { SKILLS, ARMORS } from '../data';
import { getModifier, getTotalLevel } from './formulas';

export interface SkillCalculation {
  name: string;
  attribute: AttributeKey;
  halfLevel: number;
  attributeModifier: number;
  trainingBonus: number;
  focusBonus: number;
  armorPenalty: number;
  total: number;
  canRoll: boolean;
}

export function calculateSkill(
  sheet: CharacterSheet,
  skillName: string,
): SkillCalculation {
  const skill = SKILLS.find(
    (entry) => entry.name === skillName,
  );

  if (!skill) {
    throw new Error(`Unknown skill: ${skillName}`);
  }

  const attribute = skill.attribute as AttributeKey;

  const isTrained = sheet.trainedSkills.some(
    (name) => name.toLowerCase() === skillName.toLowerCase(),
  );

  const isFocused = sheet.focusedSkills.some(
    (name) => name.toLowerCase() === skillName.toLowerCase(),
  );

  const equippedArmor = sheet.equipped.armor;

  const catalogArmor = ARMORS.find(
    (armor) => armor.id === equippedArmor?.id,
  );

  const rawArmorPenalty =
    equippedArmor?.checkPenalty ??
    catalogArmor?.checkPenalty ??
    0;

  const armorPenalty =
    skill.armorPenalty
      ? Math.min(0, rawArmorPenalty)
      : 0;

  const halfLevel = Math.floor(getTotalLevel(sheet) / 2);

  const attributeModifier = getModifier(
    sheet.baseAttributes[attribute],
  );

  const trainingBonus = isTrained ? 5 : 0;
  const focusBonus = isFocused ? 5 : 0;

  return {
    name: skillName,
    attribute,
    halfLevel,
    attributeModifier,
    trainingBonus,
    focusBonus,
    armorPenalty,
    total:
      halfLevel +
      attributeModifier +
      trainingBonus +
      focusBonus +
      armorPenalty,
    canRoll: !('trainedOnly' in skill) || !skill.trainedOnly || isTrained,
  };
}