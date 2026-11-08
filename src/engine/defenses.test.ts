import { describe, expect, it } from 'vitest';
import type { CharacterSheet } from '../types';

import {
  calculateDefenses,
  calculateDefensesWithBreak,
} from './formulas';

function makeSheet(): CharacterSheet {
  return {
    id: 'defense-test',
    name: 'Defense Test',
    race: 'Human',
    ethos: 'Pure Good',
    zodiacSign: 'Aries',
    classes: [{ name: 'Warrior', level: 1 }],
    baseAttributes: {
      str: 10,
      vit: 14,
      agi: 12,
      int: 10,
      mnd: 10,
      chr: 10,
    },
    currentHp: 30,
    tempHp: 0,
    currentMp: 6,
    tempMp: 0,
    breakStep: 0,
    heroPoints: 0,
    gold: 0,
    notes: '',
    trainedSkills: [],
    focusedSkills: [],
    technicks: [],
    talents: [],
    equipped: {},
    inventory: [],
  };
}

describe('Break-adjusted defenses', () => {
  it.each([
    [0, 11, 14, 11],
    [1, 10, 13, 10],
    [2, 9, 12, 9],
    [3, 6, 9, 6],
    [4, 1, 4, 1],
  ])(
    'applies Break step %i to defenses',
    (step, reflex, fortitude, will) => {
      const sheet = makeSheet();
      sheet.breakStep = step;

      const result =
        calculateDefensesWithBreak(sheet);

      expect(result.reflex).toBe(reflex);
      expect(result.fortitude).toBe(fortitude);
      expect(result.will).toBe(will);
    },
  );

  it('preserves the original defense calculations', () => {
    const sheet = makeSheet();
    sheet.breakStep = 3;

    const base = calculateDefenses(sheet);

    expect(base.reflex).toBe(11);
    expect(base.fortitude).toBe(14);
    expect(base.will).toBe(11);
  });

  it('does not change Break Threshold', () => {
    const sheet = makeSheet();
    sheet.breakStep = 4;

    const base = calculateDefenses(sheet);
    const adjusted = calculateDefensesWithBreak(sheet);

    expect(adjusted.breakThreshold).toBe(
      base.breakThreshold,
    );
  });

  it('reports incapacitation at step 5', () => {
    const sheet = makeSheet();
    sheet.breakStep = 5;

    expect(
      calculateDefensesWithBreak(sheet).canAct,
    ).toBe(false);
  });
});