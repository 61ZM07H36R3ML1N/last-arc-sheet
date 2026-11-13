import { CLASSES, RACES } from '../data';
import { getModifier } from './formulas';
import type { AttributeKey, CharacterSheet } from '../types';
import type { AbilityAcquisition, AbilityProgressionState } from '../types/abilities';

export type BaseClass = (typeof CLASSES)[number];

export const BASE_CLASSES = CLASSES.flat().filter(
  (entry) => entry.type !== 'advanced'
);

type Attributes = CharacterSheet['baseAttributes'];

const ATTRIBUTE_KEYS: AttributeKey[] = [
  'str', 'vit', 'agi', 'int', 'mnd', 'chr',
];

export interface CharacterCreationOptions {
  id: string;
  name: string;
  race: string;
  ethos: string;
  zodiacSign: CharacterSheet['zodiacSign'];
  classId: string;
  level: number;
  baseAttributes: Attributes;
  racialAttributeChoice?: AttributeKey;
  attributeIncreases?: Partial<Record<AttributeKey, number>>;
  trainedSkills?: string[];
}

export type CharacterEditChanges = Partial<
  Pick<
    CharacterSheet,
    | 'name'
    | 'race'
    | 'ethos'
    | 'zodiacSign'
    | 'baseAttributes'
    | 'trainedSkills'
    | 'focusedSkills'
    | 'notes'
    | 'racialAttributeChoice'
    | 'attributeIncreases'
  >
> & {
  classId?: string;
  level?: number;
};

function validateLevel(level: number): void {
  if (!Number.isInteger(level) || level < 1 || level > 20) {
    throw new Error(
      'Character level must be an integer between 1 and 20.'
    );
  }
}

function getBaseClass(id: string) {
  const found = BASE_CLASSES.find((entry) => entry.id === id);

  if (!found) {
    throw new Error(`Unknown base class: ${id}`);
  }

  return found;
}

function getRace(name: string) {
  const found = RACES.find(
    (entry) => entry.name.toLowerCase() === name.toLowerCase()
  );

  if (!found) {
    throw new Error(`Unknown race: ${name}`);
  }

  return found;
}

/**
 * Calculates effective attributes without modifying base scores.
 */
export function calculateEffectiveAttributes(
  sheet: Pick<
    CharacterSheet,
    | 'race'
    | 'baseAttributes'
    | 'racialAttributeChoice'
    | 'attributeIncreases'
  >
): Attributes {
  const race = getRace(sheet.race);
  const adjustments = race.attributeAdjustments;
  const increases = sheet.attributeIncreases ?? {};

  if (adjustments.any && !sheet.racialAttributeChoice) {
    throw new Error(
      'A racial attribute choice is required for this race.'
    );
  }

  const result = { ...sheet.baseAttributes };

  for (const key of ATTRIBUTE_KEYS) {
    const racialBonus = adjustments[key] ?? 0;

    const flexibleBonus =
      sheet.racialAttributeChoice === key
        ? (adjustments.any ?? 0)
        : 0;

    const levelBonus = increases[key] ?? 0;

    const value =
      sheet.baseAttributes[key] +
      racialBonus +
      flexibleBonus +
      levelBonus;

    const cap = race.attributeCaps[key] ?? 20;

    if (value > cap) {
      throw new Error(
        `${key.toUpperCase()} exceeds the racial cap of ${cap}.`
      );
    }

    result[key] = value;
  }

  return result;
}

/**
 * Calculates initial HP/MP from class and effective attributes.
 */
function calculateStartingResources(
  classId: string,
  level: number,
  attributes: Attributes
) {
  const selectedClass = getBaseClass(classId);

  const vitMod = getModifier(attributes.vit);
  const mndMod = getModifier(attributes.mnd);

  const hp =
    selectedClass.startingHp +
    vitMod +
    (level - 1) * (selectedClass.hpPerLevel + vitMod);

  const mp =
    selectedClass.startingMp +
    mndMod +
    (level - 1) * (selectedClass.mpPerLevel + mndMod);

  return {
    hp: Math.max(1, hp),
    mp: Math.max(0, mp),
  };
}

export function getHeroPointMaximum(level: number): number {
  validateLevel(level);
  return Math.min(4, 1 + Math.floor((level - 1) / 5));
}

/**
 * Creates a new character at any level from 1 to 20.
 */
export function createCharacter(
  options: CharacterCreationOptions
): CharacterSheet {
  validateLevel(options.level);

  if (!options.id.trim()) {
    throw new Error('Character ID is required.');
  }

  const selectedClass = getBaseClass(options.classId);

  const attributes = calculateEffectiveAttributes({
    race: options.race,
    baseAttributes: options.baseAttributes,
    racialAttributeChoice: options.racialAttributeChoice,
    attributeIncreases: options.attributeIncreases,
  });

  const resources = calculateStartingResources(
    options.classId,
    options.level,
    attributes
  );

  // A single-class creation choice provides a complete, explicit history.
  const levelHistory = Array.from({ length: options.level }, (_, index) => ({
    characterLevel: index + 1,
    classId: selectedClass.id,
    classLevel: index + 1,
  }));
  const startingTechnicks = [...new Set(selectedClass.startingTechnicks)];
  const acquisitions: AbilityAcquisition[] = startingTechnicks.map((name, index) => ({
    id: `starting:${selectedClass.id}:${index}`,
    abilityId: `starting:${selectedClass.id}:${index}`,
    abilityName: name,
    kind: 'technick',
    source: 'class-starting-technick',
    characterLevel: 1,
    classId: selectedClass.id,
    classLevel: 1,
    selectedOptions: {},
    acquisitionOrder: index + 1,
    provenance: 'recorded',
  }));
  const abilityProgression: AbilityProgressionState = {
    schemaVersion: 1,
    levelHistory,
    acquisitions,
    needsReconciliation: false,
  };

  return {
    id: options.id,
    name: options.name.trim() || 'Hero',
    race: options.race,
    ethos: options.ethos,
    zodiacSign: options.zodiacSign,

    abilityProgression,
    classes: [
      {
        name: selectedClass.name,
        level: options.level,
      },
    ],

    baseAttributes: { ...options.baseAttributes },
    racialAttributeChoice: options.racialAttributeChoice,
    attributeIncreases: {
      ...options.attributeIncreases,
    },

    currentHp: resources.hp,
    tempHp: 0,
    currentMp: resources.mp,
    tempMp: 0,

    breakStep: 0,
    heroPoints: getHeroPointMaximum(options.level),
    gold: selectedClass.startingGold ?? 0,
    notes: '',

    trainedSkills: [...new Set(options.trainedSkills ?? [])],
    focusedSkills: [],
    technicks: startingTechnicks,
    talents: [],

    equipped: {},
    inventory: [],
  };
}

/**
 * Edits an existing character.
 *
 * Preserves inventory, equipment, learned abilities,
 * additional classes, and current resource values.
 *
 * Level changes currently support single-class characters.
 */
export function editCharacter(
  existing: CharacterSheet,
  changes: CharacterEditChanges
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

  // Profile editing must never rewrite a character's advancement history.
  // Allow unchanged values for compatibility with existing editor callers.
  if (changes.level !== undefined) {
    validateLevel(changes.level);
    const currentLevel = existing.classes.reduce((sum, entry) => sum + entry.level, 0);
    if (changes.level !== currentLevel) {
      throw new Error('Change character level through the advancement workflow.');
    }
  }
  if (changes.classId !== undefined) {
    const requested = getBaseClass(changes.classId);
    if (existing.classes.length !== 1 || existing.classes[0].name !== requested.name) {
      throw new Error('Change character class through the advancement workflow.');
    }
  }

  const selectedClass =
    changes.classId !== undefined
      ? getBaseClass(changes.classId)
      : null;

  if (selectedClass && existing.classes.length === 0) {
    throw new Error(
      'Cannot change the base class of a character without a class.'
    );
  }

  if (changes.level !== undefined) {
    validateLevel(changes.level);

    if (existing.classes.length !== 1) {
      throw new Error(
        'Direct level editing currently supports single-class characters only.'
      );
    }
  }

  const {
    classId: _classId,
    level: _level,
    ...profileChanges
  } = changes;

  void _classId;
  void _level;

  const result: CharacterSheet = {
    ...existing,
    ...profileChanges,

    baseAttributes: {
      ...(changes.baseAttributes ?? existing.baseAttributes),
    },

    attributeIncreases: {
      ...(changes.attributeIncreases ?? existing.attributeIncreases),
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

    inventory: existing.inventory.map((item) => ({ ...item })),

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

  if (selectedClass) {
    result.classes[0] = {
      ...result.classes[0],
      name: selectedClass.name,
    };
  }

  if (changes.level !== undefined) {
    result.classes[0] = {
      ...result.classes[0],
      level: changes.level,
    };
  }

  // Validate the resulting attributes before saving.
  calculateEffectiveAttributes(result);

  return result;
}