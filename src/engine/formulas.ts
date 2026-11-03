/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CharacterSheet, AttributeKey,  CharacterAttributes} from '../types';

// Attribute Modifier: Math.floor((score - 10) / 2)
export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

// Total Character Level
export function getTotalLevel(sheet: CharacterSheet): number {
  return sheet.classes.reduce((sum, c) => sum + c.level, 0) || 1;
}

// Exploding Dice Roller (Indefinite recursion on max face)
export interface DiceRollResult {
  rolls: number[];
  explosions: number[];
  total: number;
  isCrit: boolean;
}

export function rollExplodingDie(sides: number): { rolls: number[]; total: number } {
  const rolls: number[] = [];
  let currentRoll: number;
  
  do {
    currentRoll = Math.floor(Math.random() * sides) + 1;
    rolls.push(currentRoll);
  } while (currentRoll === sides);

  const total = rolls.reduce((acc, curr) => acc + curr, 0);
  return { rolls, total };
}

// Calculate Defenses
export function calculateDefenses(sheet: CharacterSheet) {
  const totalLevel = getTotalLevel(sheet);
  const agiMod = getModifier(sheet.baseAttributes.agi);
  const vitMod = getModifier(sheet.baseAttributes.vit);
  const mndMod = getModifier(sheet.baseAttributes.mnd);

  // Class defense bonuses (take highest across multiclasses)
  let classRef = 0;
  let classFort = 0;
  let classWill = 0;

  sheet.classes.forEach((c) => {
    if (c.name === 'Bard') { classRef = Math.max(classRef, 2); classWill = Math.max(classWill, 1); }
    if (c.name === 'Initiate') { classFort = Math.max(classFort, 1); classWill = Math.max(classWill, 2); }
    if (c.name === 'Mage') { classRef = Math.max(classRef, 1); classWill = Math.max(classWill, 2); }
    if (c.name === 'Ranger') { classFort = Math.max(classFort, 2); classRef = Math.max(classRef, 1); }
    if (c.name === 'Rogue') { classFort = Math.max(classFort, 1); classRef = Math.max(classRef, 2); }
    if (c.name === 'Warrior') { classFort = Math.max(classFort, 2); classWill = Math.max(classWill, 1); }
  });

  const armorRef = sheet.equipped.armor?.reflexBonus || 0;

  // Max Agility Bonus Cap from armor
  const effectiveAgiMod = sheet.equipped.armor?.maxAgiBonus !== undefined
    ? Math.min(agiMod, sheet.equipped.armor.maxAgiBonus)
    : agiMod;

  const reflex = 10 + totalLevel + effectiveAgiMod + classRef + armorRef;
  const fortitude = 10 + totalLevel + vitMod + classFort;
  const will = 10 + totalLevel + mndMod + classWill;
  const breakThreshold = fortitude; // For Medium/Small

  return { reflex, fortitude, will, breakThreshold };
}