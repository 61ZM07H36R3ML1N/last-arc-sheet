import { describe, expect, it } from 'vitest';
import type { CharacterSheet } from '../types';
import { rollExplodingDamageDie } from './combat'

import {
  calculateAttackModifier,
  calculateDamageModifier,
  parseDamageExpression,
  rollWeaponAttack,
  rollWeaponDamage,
  type CombatWeapon,
} from './combat';

const warhammer: CombatWeapon = {
  name: 'Warhammer',
  damageDice: '2d8+1',
  atkBonus: 1,
  damageType: 'blunt',
};

const wand: CombatWeapon = {
  name: "Wizard's Wand",
  damageDice: '3d4',
  atkBonus: 0,
  damageType: 'fire',
};

// Minimal fixture for calculations that only read
// attributes and talents.
function makeSheet(
  str = 16,
  int = 14,
  talents: string[] = [],
): CharacterSheet {
  return {
    id: 'combat-test-character',
    name: 'Combat Test Character',
    race: 'Human',
    ethos: 'Pure Good',
    zodiacSign: 'Aries',
    classes: [{ name: 'Warrior', level: 1 }],
    baseAttributes: {
      str,
      vit: 10,
      agi: 10,
      int,
      mnd: 10,
      chr: 10,
    },
    currentHp: 30,
    tempHp: 0,
    currentMp: 6,
    tempMp: 0,
    breakStep: 0,
    heroPoints: 1,
    gold: 1000,
    notes: '',
    trainedSkills: [],
    focusedSkills: [],
    technicks: [],
    talents,
    equipped: {},
    inventory: [],
  };
}

describe('Combat damage expressions', () => {
  it('parses damage dice with a positive bonus', () => {
    expect(parseDamageExpression('2d8+1')).toEqual({
      count: 2,
      sides: 8,
      flatBonus: 1,
    });
  });

  it('parses negative damage bonuses', () => {
    expect(parseDamageExpression('2d6-1').flatBonus).toBe(-1);
  });

  it('parses expressions without flat bonuses', () => {
    expect(parseDamageExpression('3d4')).toEqual({
      count: 3,
      sides: 4,
      flatBonus: 0,
    });
  });

  it('rejects invalid damage expressions', () => {
    expect(() => parseDamageExpression('invalid')).toThrow();
    expect(() => parseDamageExpression('0d6')).toThrow();
    expect(() => parseDamageExpression('2d1')).toThrow();
  });
});

describe('Weapon attack calculations', () => {
  it('includes the selected skill and weapon bonus', () => {
    expect(
      calculateAttackModifier(warhammer, {
        skill: '1-Handed',
        skillBonus: 7,
      }),
    ).toBe(8);
  });

  it('does not double-count Strength', () => {
    const result = rollWeaponAttack(
      warhammer,
      {
        skill: '1-Handed',
        skillBonus: 7,
      },
      () => 0.45,
    );

    expect(result.rolls).toEqual([10]);
    expect(result.total).toBe(18);
  });

  it('supports Spellcraft attack rolls', () => {
    const result = rollWeaponAttack(
      wand,
      {
        skill: 'Spellcraft',
        skillBonus: 6,
      },
      () => 0.45,
    );

    expect(result.total).toBe(16);
  });

  it('applies situational and Break penalties', () => {
    expect(
      calculateAttackModifier(warhammer, {
        skill: '2-Handed',
        skillBonus: 7,
        situationalBonus: 2,
        breakPenalty: -5,
      }),
    ).toBe(5);
  });
});

describe('Weapon damage calculations', () => {
  it('adds Strength to eligible physical damage', () => {
    const sheet = makeSheet(16);

    const result = rollWeaponDamage(
      sheet,
      warhammer,
      { attribute: 'str' },
      () => 0,
    );

    // 2d8 (1 + 1) + 1 weapon + 3 STR
    expect(result.total).toBe(6);
    expect(result.modifier).toBe(4);
  });

  it('supports negative Strength modifiers', () => {
    const sheet = makeSheet(8);

    expect(
      calculateDamageModifier(sheet, {
        attribute: 'str',
      }),
    ).toBe(-1);
  });

  it('does not automatically add STR to wand damage', () => {
    const sheet = makeSheet(18);

    const result = rollWeaponDamage(
      sheet,
      wand,
      { attribute: 'none' },
      () => 0,
    );

    expect(result.total).toBe(3);
  });

  it('applies Wandwork when explicitly enabled', () => {
    const sheet = makeSheet(10, 16, ['Wandwork']);

    const result = rollWeaponDamage(
      sheet,
      wand,
      {
        attribute: 'none',
        applyWandwork: true,
      },
      () => 0,
    );

    // 3d4 minimum (3) + 3 INT
    expect(result.total).toBe(6);
  });

  it('does not apply Wandwork without the talent', () => {
    const sheet = makeSheet(10, 16);

    expect(
      calculateDamageModifier(sheet, {
        attribute: 'none',
        applyWandwork: true,
      }),
    ).toBe(0);
  });

  it('keeps attack bonus separate from damage', () => {
    const sheet = makeSheet(10);

    const result = rollWeaponDamage(
      sheet,
      warhammer,
      { attribute: 'none' },
      () => 0,
    );

    expect(result.total).toBe(3);
  });
});

describe('Exploding damage dice', () => {
  it('returns a normal roll without exploding', () => {
    const result = rollExplodingDamageDie(
      6,
      () => 0.5,
    );

    expect(result.rolls).toEqual([4]);
    expect(result.rolls.reduce((total, roll) => total + roll, 0)).toBe(4);
  });

  it('explodes when the maximum is rolled', () => {
    const values = [0.99, 0.5];
    let index = 0;

    const result = rollExplodingDamageDie(
      6,
      () => values[index++],
    );

    expect(result.rolls).toEqual([6, 4]);
  expect(result.rolls.reduce((total, roll) => total + roll, 0)).toBe(10);
  });

  it('supports chained explosions', () => {
    const values = [0.99, 0.99, 0.5];
    let index = 0;

    const result = rollExplodingDamageDie(
      6,
      () => values[index++],
    );

    expect(result.rolls).toEqual([6, 6, 4]);
  expect(result.rolls.reduce((total, roll) => total + roll, 0)).toBe(16);
  });

  it('rejects invalid die sizes', () => {
    expect(() =>
      rollExplodingDamageDie(1),
    ).toThrow('Invalid die size.');
  });

  it('rejects a random source that never stops exploding', () => {
    expect(() =>
      rollExplodingDamageDie(6, () => 0.99),
    ).toThrow('Exploding die exceeded maximum roll count.');
  });
});