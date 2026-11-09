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

export type CharacterEditChanges = Partial<
Pick<
CharacterSheet,
  |'name' 
  | 'race' 
  | 'ethos' 
  | 'zodiacSign' 
  | 'baseAttributes' 
  | 'trainedSkills' 
  | 'focusedSkills' 
  | 'notes'
  >
  > & {
    classId?: string;
  };

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
/**
 * Safely edits an existing character's profile and primary class.
 *
 * Class changes preserve the primary class level, additional
 * classes, resources, equipment, inventory, and learned abilities.
 *
 * Race changes update ancestry identity only. Existing attributes
 * are preserved because pre-racial attribute scores are not
 * separately stored in CharacterSheet.
 *
 * This is not a character rebuild or respec operation.
 */
export function editCharacter(
  existing: CharacterSheet,
  changes: CharacterEditChanges,
): CharacterSheet {
  const forbidden = [
    'classes',
    'technicks',
    'talents',
    'inventory',
    'equipped',
    'currentHp',
    'currentMp',
    'tempHp',
    'tempMp',
    'breakStep',
    'gold',
    'heroPoints',
    'id',
  ];

  for (const key of forbidden) {
    if (Object.prototype.hasOwnProperty.call(changes, key)) {
      throw new Error(
        `Cannot edit ${key} through character profile editing.`
      );
    }
  }

  // Validate the requested class before modifying anything.
  const selectedClass =
    changes.classId !== undefined
      ? getBaseClass(changes.classId)
      : null;

  if (selectedClass && existing.classes.length === 0) {
    throw new Error(
      'Cannot change the base class of a character without a class.'
    );
  }

  // classId is an editor command, not a CharacterSheet field.
  const { classId: _classId, ...profileChanges } = changes;
  void _classId;

  const result: CharacterSheet = {
    ...existing,
    ...profileChanges,

    baseAttributes: {
      ...(changes.baseAttributes ?? existing.baseAttributes),
    },

    trainedSkills: [
      ...(changes.trainedSkills ?? existing.trainedSkills),
    ],

    focusedSkills: [
      ...(changes.focusedSkills ?? existing.focusedSkills),
    ],

    classes: existing.classes.map((entry) => ({ ...entry })),

    technicks: [...existing.technicks],
    talents: [...existing.talents],

    inventory: existing.inventory.map((item) => ({
      ...item,
    })),

    equipped: Object.fromEntries(
      Object.entries(existing.equipped).map(
        ([slot, item]) => [
          slot,
          item ? { ...item } : item,
        ]
      )
    ) as CharacterSheet['equipped'],
  };

  if (changes.name !== undefined) {
    result.name = changes.name.trim() || 'Hero';
  }

  // Change only the primary class identity.
  // Preserve its level and any additional class entries.
  if (selectedClass) {
    result.classes[0] = {
      ...result.classes[0],
      name: selectedClass.name,
    };
  }

  return result;
}