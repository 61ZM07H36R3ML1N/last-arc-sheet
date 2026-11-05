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
        heroPoints: sheet.heroPoints,
        gold: sheet.gold
      }
    }
  };
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

  return {
    ...fallbackSheet,
    name: actor?.name || fallbackSheet.name,
    race: details?.race || fallbackSheet.race,
    ethos: details?.ethos || fallbackSheet.ethos,
    zodiacSign: (details?.zodiacSign as ZodiacSign) || fallbackSheet.zodiacSign || 'Aries',
    currentHp: sys.health?.value ?? fallbackSheet.currentHp,
    currentMp: sys.mana?.value ?? fallbackSheet.currentMp,
    breakStep: sys.breakGauge?.value ?? 0,
    notes: details?.notes || fallbackSheet.notes || '',
    baseAttributes: {
      str: attrs.str?.value ?? fallbackSheet.baseAttributes.str,
      vit: attrs.vit?.value ?? fallbackSheet.baseAttributes.vit,
      agi: attrs.agi?.value ?? fallbackSheet.baseAttributes.agi,
      int: attrs.int?.value ?? fallbackSheet.baseAttributes.int,
      mnd: attrs.mnd?.value ?? fallbackSheet.baseAttributes.mnd,
      chr: attrs.chr?.value ?? fallbackSheet.baseAttributes.chr
    }
  };
}