import type { CharacterSheet } from '../types';
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

const items = actor?.items;

const trainedSkills = items
  ?.filter(
    (item) =>
      item.type === 'skill' &&
      item.system.trained === true
  )
  .map((item) => item.name);

const technicks = items
  ?.filter((item) => item.type === 'technick')
  .map((item) => item.name);

const talents = items
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
    classes: flags?.classes ?? fallbackSheet.classes,
    trainedSkills: trainedSkills ?? flags?.trainedSkills ?? fallbackSheet.trainedSkills,
    focusedSkills: flags?.focusedSkills ?? fallbackSheet.focusedSkills,
    technicks: technicks ?? flags?.technicks ?? fallbackSheet.technicks,
    talents: talents ?? flags?.talents ?? fallbackSheet.talents,
    heroPoints: flags?.heroPoints ?? fallbackSheet.heroPoints,
    gold: flags?.gold ?? fallbackSheet.gold,
    equipped: flags?.equipped !== undefined ? structuredClone(flags.equipped) : structuredClone(fallbackSheet.equipped),
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