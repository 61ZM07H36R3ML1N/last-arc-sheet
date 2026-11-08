import type { CharacterSheet } from '../types';

export const UNPROFICIENT_WEAPON_PENALTY = -5;

export interface WeaponProficiencyResult {
  proficient: boolean;
  weaponCategory: string;
  penalty: number;
  source: string | null;
}

function normalizeWeaponGroup(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function parseWeaponProficiency(
  technick: string,
): string | null {
  const match = /^Weapon Proficiency\s*\(([^)]+)\)$/i.exec(
    technick.trim(),
  );

  if (!match) {
    return null;
  }

  return normalizeWeaponGroup(match[1]);
}

export function resolveWeaponProficiency(
  sheet: Pick<CharacterSheet, 'technicks'>,
  weaponCategory: string,
): WeaponProficiencyResult {
  const normalizedCategory = normalizeWeaponGroup(
    weaponCategory,
  );

  if (!normalizedCategory) {
    throw new Error('Weapon category cannot be empty.');
  }

  for (const technick of sheet.technicks) {
    const proficiencyGroup = parseWeaponProficiency(technick);

    if (proficiencyGroup === normalizedCategory) {
      return {
        proficient: true,
        weaponCategory: normalizedCategory,
        penalty: 0,
        source: technick,
      };
    }
  }

  return {
    proficient: false,
    weaponCategory: normalizedCategory,
    penalty: UNPROFICIENT_WEAPON_PENALTY,
    source: null,
  };
}

export function getWeaponProficiencyPenalty(
  sheet: Pick<CharacterSheet, 'technicks'>,
  weaponCategory: string,
): number {
  return resolveWeaponProficiency(
    sheet,
    weaponCategory,
  ).penalty;
}