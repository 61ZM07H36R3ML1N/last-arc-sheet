import type { CharacterSheet, Equipment, EquipmentSlot, DamageType } from '../types';
import type { ZodiacSign } from '../data/zodiac';
import { calculateDefenses, getTotalLevel } from './formulas';

export interface FoundryActorJSON {
  name: string;
  type: string;
  system: {
    attributes?: Record<string, { value: number }>;
    health?: { value: number; max: number };
    mana?: { value: number; max: number };
    defenses?: {
      reflex: number;
      fortitude: number;
      will: number;
      breakThreshold: number;
    };
    breakGauge?: { value: number };
    details?: {
      race: string;
      ethos: string;
      zodiacSign?: string;
      level: number;
      classes: string;
      notes: string;
    };
  };
  items: Array<{
    name: string;
    type: string;
    system: Record<string, unknown>;
  }>;
  flags?: Record<string, unknown>;
}

/**
 * Transforms a Last Arc character sheet into a standard Foundry VTT Actor JSON document.
 */
export function exportToFoundryActor(sheet: CharacterSheet): FoundryActorJSON {
  const defenses = calculateDefenses(sheet);
  const totalLevel = getTotalLevel(sheet);

  return {
    name: sheet.name,
    type: 'character',
    system: {
      attributes: {
        str: { value: sheet.baseAttributes.str },
        vit: { value: sheet.baseAttributes.vit },
        agi: { value: sheet.baseAttributes.agi },
        int: { value: sheet.baseAttributes.int },
        mnd: { value: sheet.baseAttributes.mnd },
        chr: { value: sheet.baseAttributes.chr }
      },
      health: { value: sheet.currentHp, max: sheet.currentHp },
      mana: { value: sheet.currentMp, max: sheet.currentMp },
      defenses: {
        reflex: defenses.reflex,
        fortitude: defenses.fortitude,
        will: defenses.will,
        breakThreshold: defenses.breakThreshold
      },
      breakGauge: { value: sheet.breakStep },
      details: {
        race: sheet.race,
        ethos: sheet.ethos,
        zodiacSign: sheet.zodiacSign || 'Aries',
        level: totalLevel,
        classes: sheet.classes.map((c) => `${c.name} ${c.level}`).join(' / '),
        notes: sheet.notes || ''
      }
    },
    items: [
      ...sheet.trainedSkills.map((s) => ({
        name: s,
        type: 'skill',
        system: { trained: true }
      })),
      ...sheet.technicks.map((t) => ({
        name: t,
        type: 'technick',
        system: {}
      })),
      ...sheet.talents.map((tal) => ({
        name: tal,
        type: 'talent',
        system: {}
      }))
    ],
    flags: {
  lastArc: {
    schemaVersion: 1,
    classes: sheet.classes.map((c) => ({ ...c })),
    trainedSkills: [...sheet.trainedSkills],
    focusedSkills: [...sheet.focusedSkills],
    technicks: [...sheet.technicks],
    talents: [...sheet.talents],
    heroPoints: sheet.heroPoints,
    gold: sheet.gold,
    equipped: structuredClone(sheet.equipped)
  }
}
  };
}

function finiteNumberOr(
  value: unknown,
  fallback: number
): number {
  return typeof value === 'number' &&
    Number.isFinite(value)
    ? value
    : fallback;
}

function nonNegativeNumberOr(
  value: unknown,
  fallback: number
): number {
  return typeof value === 'number' &&
    Number.isFinite(value) &&
    value >= 0
    ? value
    : fallback;
}

function nonNegativeIntegerOr(
  value: unknown,
  fallback: number
): number {
  return typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0
    ? value
    : fallback;
}

function validStringArrayOr(
  value: unknown,
  fallback: string[]
): string[] {
  return Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === 'string' &&
        item.trim().length > 0
    )
    ? [...value]
    : fallback;
}

function validClassesOr(
  value: unknown,
  fallback: CharacterSheet['classes']
): CharacterSheet['classes'] {
  if (
    !Array.isArray(value) ||
    !value.every(
      (entry) =>
        isRecord(entry) &&
        typeof entry.name === 'string' &&
        entry.name.trim().length > 0 &&
        typeof entry.level === 'number' &&
        Number.isSafeInteger(entry.level) &&
        entry.level > 0
    )
  ) {
    return fallback;
  }

  return value.map((entry) => ({
    name: entry.name,
    level: entry.level,
  })) as CharacterSheet['classes'];
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  );
}

const equipmentSlots = [
  'mainHand',
  'offHand',
  'armor',
  'mask',
  'tome',
  'instrument',
  'accessory',
] as const satisfies readonly EquipmentSlot[];

const damageTypes = [
  'blunt',
  'piercing',
  'slashing',
  'cold',
  'dark',
  'electric',
  'fire',
  'holy',
  'unaspected',
] as const satisfies readonly DamageType[];

const slotMapping = {
  mainHand: 'mainHand',
  offHand: 'offHand',
  armor: 'armor',
  mask: 'mask',
  tome: 'tome',
  instrument: 'instrument',
  accessory1: 'accessory',
  accessory2: 'accessory',
} as const satisfies Record<
  keyof CharacterSheet['equipped'],
  EquipmentSlot
>;

function isEquipment(
  value: unknown
): value is Equipment {
  if (!isRecord(value)) return false;

  if (
    typeof value.id !== 'string' ||
    !value.id.trim() ||
    typeof value.name !== 'string' ||
    !value.name.trim() ||
    !equipmentSlots.some(
      (slot) => slot === value.slot
    ) ||
    typeof value.bulk !== 'number' ||
    !Number.isFinite(value.bulk) ||
    value.bulk < 0
  ) {
    return false;
  }

  const numericFields = [
    'atkBonus',
    'reflexBonus',
    'dr',
    'maxAgiBonus',
    'checkPenalty',
    'performanceBonus',
  ];

  for (const field of numericFields) {
    const fieldValue = value[field];

    if (
      fieldValue !== undefined &&
      (typeof fieldValue !== 'number' ||
        !Number.isFinite(fieldValue))
    ) {
      return false;
    }
  }

  const stringFields = [
    'damageDice',
    'specialText',
    'availability',
  ];

  for (const field of stringFields) {
    const fieldValue = value[field];

    if (
      fieldValue !== undefined &&
      typeof fieldValue !== 'string'
    ) {
      return false;
    }
  }

  if (
    value.damageType !== undefined &&
    !damageTypes.some(
      (type) => type === value.damageType
    )
  ) {
    return false;
  }

  return true;
}

function isEquipped(
  value: unknown
): value is CharacterSheet['equipped'] {
  return (
    isRecord(value) &&
    Object.entries(value).every(([slot, equipment]) => {
      if (!(slot in slotMapping)) {
        return false;
      }

      if (equipment === null) {
        return true;
      }

      if (!isEquipment(equipment)) {
        return false;
      }

      const expectedSlot =
        slotMapping[slot as keyof typeof slotMapping];

      return equipment.slot === expectedSlot;
    })
  );
}

type ValidFoundryItem = {
  name: string;
  type: string;
  system: Record<string, unknown>;
};

function isValidFoundryItem(
  value: unknown
): value is ValidFoundryItem {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    typeof value.type === 'string' &&
    isRecord(value.system)
  );
}

/**
 * Parses and maps a Foundry VTT Actor export back into a Last Arc character sheet.
 */
export function importFromFoundryActor(
  foundryJson: unknown,
  fallbackSheet: CharacterSheet
): CharacterSheet {
  const actor =
    foundryJson && typeof foundryJson === 'object' && 'system' in foundryJson
      ? (foundryJson as Partial<FoundryActorJSON>)
      : undefined;

  const sys = actor?.system ?? {};
  const attrs = sys.attributes ?? {};
  const details = sys.details as FoundryActorJSON['system']['details'] | undefined;

  const flags = actor?.flags?.lastArc as
  | Partial<Pick<
      CharacterSheet,
      | 'classes'
      | 'trainedSkills'
      | 'focusedSkills'
      | 'technicks'
      | 'talents'
      | 'heroPoints'
      | 'gold'
      | 'equipped'
    >>
  | undefined;

const rawItems: unknown = actor?.items;

const validItems = Array.isArray(rawItems)
  ? rawItems.filter(isValidFoundryItem)
  : undefined;

// An empty array is intentional.
// A nonempty array containing no valid items is malformed.
const usableItems =
  Array.isArray(rawItems) &&
  validItems !== undefined &&
  (rawItems.length === 0 || validItems.length > 0)
    ? validItems
    : undefined;

const trainedSkills = usableItems
  ?.filter(
    (item) =>
      item.type === 'skill' &&
      item.system.trained === true
  )
  .map((item) => item.name);

const technicks = usableItems
  ?.filter((item) => item.type === 'technick')
  .map((item) => item.name);

const talents = usableItems
  ?.filter((item) => item.type === 'talent')
  .map((item) => item.name);

  return {
    ...fallbackSheet,
    name: actor?.name || fallbackSheet.name,
    race: details?.race || fallbackSheet.race,
    ethos: details?.ethos || fallbackSheet.ethos,
    zodiacSign: (details?.zodiacSign as ZodiacSign) || fallbackSheet.zodiacSign || 'Aries',
    currentHp: nonNegativeNumberOr(sys.health?.value,fallbackSheet.currentHp),
    currentMp: nonNegativeNumberOr(sys.mana?.value, fallbackSheet.currentMp),
    breakStep: nonNegativeNumberOr(sys.breakGauge?.value, fallbackSheet.breakStep),
    notes: details?.notes ?? fallbackSheet.notes ?? '',
    classes: validClassesOr(flags?.classes,fallbackSheet.classes),
    trainedSkills: trainedSkills ?? flags?.trainedSkills ?? fallbackSheet.trainedSkills,
    focusedSkills: validStringArrayOr(flags?.focusedSkills,fallbackSheet.focusedSkills),
    technicks: technicks ?? flags?.technicks ?? fallbackSheet.technicks,
    talents: talents ?? flags?.talents ?? fallbackSheet.talents,
    heroPoints: nonNegativeIntegerOr(flags?.heroPoints,fallbackSheet.heroPoints),
    gold: nonNegativeIntegerOr(flags?.gold,fallbackSheet.gold),
    equipped: isEquipped(flags?.equipped)
      ? structuredClone(flags.equipped)
      : structuredClone(fallbackSheet.equipped),
    baseAttributes: {
      str: finiteNumberOr(attrs.str?.value, fallbackSheet.baseAttributes.str),
      vit: finiteNumberOr(attrs.vit?.value, fallbackSheet.baseAttributes.vit),
      agi: finiteNumberOr(attrs.agi?.value, fallbackSheet.baseAttributes.agi),
      int: finiteNumberOr(attrs.int?.value, fallbackSheet.baseAttributes.int),
      mnd: finiteNumberOr(attrs.mnd?.value, fallbackSheet.baseAttributes.mnd),
      chr: finiteNumberOr(attrs.chr?.value, fallbackSheet.baseAttributes.chr)
    }
  };
}