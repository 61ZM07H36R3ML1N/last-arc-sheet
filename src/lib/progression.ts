import type { CharacterSheet } from '../types';

export function getCharacterLevel(sheet: CharacterSheet): number {
  return sheet.classes.reduce(
    (total, characterClass) => total + characterClass.level,
    0,
  );
}

export function getHeroPointMaximum(level: number): number {
  return Math.min(4, 1 + Math.floor((level - 1) / 5));
}

export function getAttributeIncreaseCount(level: number): number {
  return Math.floor(level / 4) * 2;
}

export function getCharacterTechnickCount(level: number): number {
  return Math.ceil(level / 2);
}

export function getClassTechnickCount(sheet: CharacterSheet): number {
  return sheet.classes.reduce(
    (total, characterClass) =>
      total + Math.floor(characterClass.level / 2),
    0,
  );
}