import { ZODIAC_SIGNS, type ZodiacSign } from '../data/zodiac';
import { getModifier } from './formulas';
import type { CharacterSheet } from '../types';

export type ResonanceType = 'compatible' | 'incompatible' | 'neutral';

export interface ZodiacResonanceResult {
  targetSign: ZodiacSign;
  resonance: ResonanceType;
  beneficHpBonus: number;
  maleficMpBonus: number;
  description: string;
}

/**
 * Calculates Astrologian star sign resonance between caster and target.
 */
export function calculateZodiacResonance(
  casterSign: ZodiacSign,
  targetSign: ZodiacSign,
  sheet: CharacterSheet
): ZodiacResonanceResult {
  const info = ZODIAC_SIGNS[casterSign];
  const mndMod = getModifier(sheet.baseAttributes.mnd);
  const astroLevel = sheet.classes.find((c) => c.name.toLowerCase() === 'astrologian')?.level || 1;

  let resonance: ResonanceType = 'neutral';
  if (info.compatible.includes(targetSign)) {
    resonance = 'compatible';
  } else if (info.incompatible.includes(targetSign)) {
    resonance = 'incompatible';
  }

  // Benefic scales HP recovery; Malefic scales MP recovery/drain
  const beneficHpBonus = Math.max(1, astroLevel * 2 + mndMod);
  const maleficMpBonus = Math.max(1, Math.floor(astroLevel / 2) + Math.max(1, mndMod));

  let description = 'Neutral Sign: Standard spell effect.';
  if (resonance === 'compatible') {
    description = `Benefic Resonance: Casts heal or grant +${beneficHpBonus} bonus HP recovery.`;
  } else if (resonance === 'incompatible') {
    description = `Malefic Resonance: Hostile arcana pierces and restores +${maleficMpBonus} MP to the caster.`;
  }

  return {
    targetSign,
    resonance,
    beneficHpBonus,
    maleficMpBonus,
    description
  };
}

export interface TabulaRasaThreshold {
  baseChance: number;
  tomeBonus: number;
  effectiveChance: number;
  activeTomeName?: string;
  eurekaThreshold: number; // Roll <= this triggers Eureka MP recovery
}

/**
 * Evaluates Scholar Tabula Rasa success odds based on equipped Tomes & Armor.
 */
export function getTabulaRasaStats(sheet: CharacterSheet): TabulaRasaThreshold {
  let effectiveChance = 60; // Baseline 60%
  let activeTomeName: string | undefined;

  const equippedTome = sheet.equipped.tome;
  if (equippedTome) {
    activeTomeName = equippedTome.name;
    const tomeId = equippedTome.id.toLowerCase();
    if (tomeId.includes('book_of_elements') || tomeId.includes('book_of_secrets')) {
      effectiveChance = 65;
    } else if (tomeId.includes('ars_notoria') || tomeId.includes('draconomicon')) {
      effectiveChance = 70;
    } else if (tomeId.includes('archidoxis')) {
      effectiveChance = 80;
    }
  }

  // Savant's Gown boosts Eureka trigger from <= 20 to <= 25
  const isWearingSavantGown = sheet.equipped.armor?.id.toLowerCase().includes('savant');
  const eurekaThreshold = isWearingSavantGown ? 25 : 20;

  return {
    baseChance: 60,
    tomeBonus: effectiveChance - 60,
    effectiveChance,
    activeTomeName,
    eurekaThreshold
  };
}