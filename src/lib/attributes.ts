import type { AttributeKey, CharacterSheet } from '../types';

export type Attributes = Record<AttributeKey, number>;

const RACIAL_ADJUSTMENTS: Record<string, Partial<Attributes>> = {
  'Human': {},
  'Dwarf': { vit: 2, mnd: 2, chr: -2 },
  'Highland Dwarf': { chr: 2, vit: 2, int: -2 },
  'Dark Elf': { agi: 2, chr: 2, vit: -2 },
  'High Elf': { int: 2, mnd: 2, vit: -2 },
  'Wood Elf': { agi: 2, mnd: 2, vit: -2 },
  'Gawro': { str: 2, vit: 2, agi: -2 },
  'Gnome': { int: 2, mnd: 2, str: -2 },
  'Tinker Gnome': { agi: 2, int: 2, vit: -2 },
  'Goblin': { agi: 2, vit: 2, chr: -2 },
  'Grassrunner': { agi: 2, mnd: 2, vit: -2 },
  'Halfling': { agi: 2, chr: 2, str: -2 },
  'Half-Elf': {},
  'Nasha': { agi: 2, mnd: 2, int: -2 },
  'Orc': { str: 2, vit: 2, int: -2 },
};

const ATTRIBUTE_KEYS: AttributeKey[] = [
  'str', 'vit', 'agi', 'int', 'mnd', 'chr',
];

export function calculateAttributes(
  sheet: CharacterSheet,
  flexibleRacialAttribute?: AttributeKey,
): Attributes {
  const adjustments = RACIAL_ADJUSTMENTS[sheet.race] ?? {};

  const result = { ...sheet.baseAttributes };

  for (const key of ATTRIBUTE_KEYS) {
    result[key] += adjustments[key] ?? 0;
  }

  if (
    (sheet.race === 'Human' || sheet.race === 'Half-Elf') &&
    flexibleRacialAttribute
  ) {
    result[flexibleRacialAttribute] += 2;
  }

  return result;
}