import { CLASSES } from '../data';
import { getModifier } from './formulas';
import type { CharacterSheet } from '../types';

export type BaseClass = (typeof CLASSES)[number];
export const BASE_CLASSES = CLASSES.flat().filter((entry) => entry.type !== 'advanced');

export interface CharacterCreationOptions {
  id: string;
  name: string;
  race: string;
  ethos: string;
  zodiacSign: CharacterSheet['zodiacSign'];
  classId: string;
  level: number;
  baseAttributes: CharacterSheet['baseAttributes'];
  trainedSkills?: string[];
}

export type CharacterEditChanges = Partial<Pick<CharacterSheet,
  'name' | 'race' | 'ethos' | 'zodiacSign' | 'baseAttributes' |
  'trainedSkills' | 'focusedSkills' | 'notes'
>>;

function validateLevel(level: number): void {
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new Error('Character level must be an integer between 1 and 20.');
  }
}

function getBaseClass(id: string) {
  const found = BASE_CLASSES.find((entry) => entry.id === id);
  if (!found) throw new Error(`Unknown base class: ${id}`);
  return found;
}

export function createCharacter(options: CharacterCreationOptions): CharacterSheet {
  validateLevel(options.level);
  if (!options.id.trim()) throw new Error('Character ID is required.');
  const selectedClass = getBaseClass(options.classId);
  const vitMod = getModifier(options.baseAttributes.vit);
  const mndMod = getModifier(options.baseAttributes.mnd);
  const level = options.level;
  const hp = selectedClass.startingHp + vitMod +
    (level - 1) * (selectedClass.hpPerLevel + vitMod);
  const mp = selectedClass.startingMp + mndMod +
    (level - 1) * (selectedClass.mpPerLevel + mndMod);
  return {
    id: options.id,
    name: options.name.trim() || 'Hero',
    race: options.race,
    ethos: options.ethos,
    zodiacSign: options.zodiacSign,
    classes: [{ name: selectedClass.name, level }],
    baseAttributes: { ...options.baseAttributes },
    currentHp: Math.max(1, hp),
    tempHp: 0,
    currentMp: Math.max(0, mp),
    tempMp: 0,
    breakStep: 0,
    heroPoints: Math.min(4, Math.floor(1 + level / 5)),
    gold: selectedClass.startingGold ?? 0,
    notes: '',
    trainedSkills: [...new Set(options.trainedSkills ?? [])],
    focusedSkills: [],
    technicks: [...new Set(selectedClass.startingTechnicks)],
    talents: [],
    equipped: {},
    inventory: [],
  };
}

/** Does not support class changes or level changes. Those require an explicit progression workflow. */
export function editCharacter(
  existing: CharacterSheet,
  changes: CharacterEditChanges,
): CharacterSheet {
  const forbidden = ['classes', 'technicks', 'talents', 'inventory', 'equipped',
    'currentHp', 'currentMp', 'tempHp', 'tempMp', 'breakStep', 'gold', 'heroPoints', 'id'];
  for (const key of forbidden) {
    if (Object.prototype.hasOwnProperty.call(changes, key)) {
      throw new Error(`Cannot edit ${key} through character profile editing.`);
    }
  }
  const result: CharacterSheet = {
    ...existing,
    ...changes,
    baseAttributes: { ...(changes.baseAttributes ?? existing.baseAttributes) },
    trainedSkills: [...(changes.trainedSkills ?? existing.trainedSkills)],
    focusedSkills: [...(changes.focusedSkills ?? existing.focusedSkills)],
    classes: existing.classes.map((entry) => ({ ...entry })),
    technicks: [...existing.technicks],
    talents: [...existing.talents],
    inventory: existing.inventory.map((item) => ({ ...item })),
    equipped: Object.fromEntries(Object.entries(existing.equipped).map(([slot, item]) =>
      [slot, item ? { ...item } : item])) as CharacterSheet['equipped'],
  };
  if (changes.name !== undefined) result.name = changes.name.trim() || 'Hero';
  return result;
}
