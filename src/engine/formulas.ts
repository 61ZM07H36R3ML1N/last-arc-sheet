/* eslint-disable @typescript-eslint/no-unused-vars */
import type { CharacterSheet } from '../types';

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

export function rollExplodingDie(
  sides: number
): { rolls: number[]; total: number } {
  // Reject invalid dice configurations.
  if (!Number.isSafeInteger(sides) || sides < 2) {
    throw new RangeError(
      'Dice must have an integer number of sides >= 2'
    );
  }

  const rolls: number[] = [];
  let currentRoll: number;

  do {
    currentRoll = Math.floor(Math.random() * sides) + 1;
    rolls.push(currentRoll);
  } while (currentRoll === sides);

  const total = rolls.reduce(
    (acc, curr) => acc + curr,
    0
  );

  return { rolls, total };
}

// Calculate Defenses
export function calculateDefenses(sheet: CharacterSheet) {
  const totalLevel = getTotalLevel(sheet);
  const halfLevel = Math.floor(totalLevel / 2);

  const agiMod = getModifier(sheet.baseAttributes.agi);
  const vitMod = getModifier(sheet.baseAttributes.vit);
  const mndMod = getModifier(sheet.baseAttributes.mnd);
  const chrMod = getModifier(sheet.baseAttributes.chr);

  // Atlas Technick: Dynamism lets Charisma replace Mind for Will Defence
  const willAttrMod = sheet.technicks?.includes('Dynamism') 
    ? Math.max(mndMod, chrMod) 
    : mndMod;

  // Class defense bonuses (take highest across multiclasses)
  let classRef = 0;
  let classFort = 0;
  let classWill = 0;

  sheet.classes.forEach((c) => {
    // Base Classes
    if (c.name === 'Bard') { classRef = Math.max(classRef, 2); classWill = Math.max(classWill, 1); }
    if (c.name === 'Initiate') { classFort = Math.max(classFort, 1); classWill = Math.max(classWill, 2); }
    if (c.name === 'Mage') { classRef = Math.max(classRef, 1); classWill = Math.max(classWill, 2); }
    if (c.name === 'Ranger') { classFort = Math.max(classFort, 2); classRef = Math.max(classRef, 1); }
    if (c.name === 'Rogue') { classFort = Math.max(classFort, 1); classRef = Math.max(classRef, 2); }
    if (c.name === 'Warrior') { classFort = Math.max(classFort, 2); classWill = Math.max(classWill, 1); }

    // Atlas Advanced Classes
    if (c.name === 'Aeronaut') { classRef = Math.max(classRef, 4); classFort = Math.max(classFort, 2); }
    if (c.name === 'Astrologian') { classWill = Math.max(classWill, 4); classRef = Math.max(classRef, 2); }
    if (c.name === 'Condottiere') { classFort = Math.max(classFort, 4); classWill = Math.max(classWill, 2); }
    if (c.name === 'Magnate') { classRef = Math.max(classRef, 4); classWill = Math.max(classWill, 2); }
    if (c.name === 'Mstovari') { classFort = Math.max(classFort, 4); classWill = Math.max(classWill, 2); }
    if (c.name === 'Scholar') { classRef = Math.max(classRef, 3); classWill = Math.max(classWill, 3); }
  });

  // Racial traits and size bonuses
  let racialDef = 0;
  let racialWill = 0;
  let racialRef = 0;

  if (sheet.race === 'Dark Dwarf') {
    racialDef += 1; // Hardy: +1 to all defences
  }
  if (['Black Goblin', 'Blood Orc'].includes(sheet.race)) {
    racialWill += 2; // Iron Will: +2 Will Defence
  }
  if (['Black Goblin', 'Hobgoblin'].includes(sheet.race)) {
    racialRef += 1; // Small Size: +1 Ref Defence
  }

  const armorRef = sheet.equipped.armor?.reflexBonus || 0;

  // Max Agility Bonus Cap from armor
  const effectiveAgiMod = sheet.equipped.armor?.maxAgiBonus !== undefined
    ? Math.min(agiMod, sheet.equipped.armor.maxAgiBonus)
    : agiMod;

  const reflex = 10 + halfLevel + effectiveAgiMod + classRef + armorRef + racialDef + racialRef;
  const fortitude = 10 + halfLevel + vitMod + classFort + racialDef;
  const will = 10 + halfLevel + willAttrMod + classWill + racialDef + racialWill;

  // Break Threshold: Base Fortitude + 5 if Threshold Up technick is taken
  const breakThreshold = fortitude + (sheet.technicks?.includes('Threshold Up') ? 5 : 0);

  return { reflex, fortitude, will, breakThreshold };
}