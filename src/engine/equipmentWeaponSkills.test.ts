import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../data';
import type { CharacterSheet, Equipment } from '../types';
import { resolveEquippedWeaponSkills } from './equipmentWeaponSkills';

const sheet = {
  race: 'Human',
} as CharacterSheet;

function equippedWeapon(
  category?: string,
  size?: string,
): Equipment {
  const weapon = WEAPONS.find(
    item =>
      (category === undefined || item.category === category) &&
      (size === undefined || item.size === size),
  );

  if (!weapon) {
    throw new Error(
      `Missing fixture: ${category ?? 'any'} / ${size ?? 'any'}`,
    );
  }

  return {
    id: weapon.id,
    name: weapon.name,
    slot: 'mainHand',
    bulk: weapon.bulk,
    damageDice: weapon.damage,
    damageType: weapon.damageType,
    atkBonus: weapon.atkBonus,
  };
}

it('resolves a Small melee weapon', () => {
  const weapon = WEAPONS.find(
    item =>
      item.size === 'Small' &&
      !['bows', 'crossbows', 'staves'].includes(item.category),
  );

  if (!weapon) {
    throw new Error('Missing Small melee weapon fixture');
  }

  const result = resolveEquippedWeaponSkills(sheet, {
    id: weapon.id,
    name: weapon.name,
    slot: 'mainHand',
    bulk: weapon.bulk,
    damageDice: weapon.damage,
    damageType: weapon.damageType,
    atkBonus: weapon.atkBonus,
  });

  expect(result.status).toBe('ready');
  expect(result.skills).toEqual([
    'Light Weapon',
    '1-Handed',
  ]);
});

describe('Equipment weapon skill resolution', () => {
  it('resolves a Medium melee weapon', () => {
    const weapon = equippedWeapon('swords', 'Medium');
    const result = resolveEquippedWeaponSkills(sheet, weapon);

    expect(result.status).toBe('ready');
    expect(result.skills).toEqual(['1-Handed']);
  });

  it('resolves a Large melee weapon', () => {
    const weapon = equippedWeapon('axes', 'Large');
    const result = resolveEquippedWeaponSkills(sheet, weapon);

    expect(result.status).toBe('ready');
    expect(result.skills).toEqual(['2-Handed']);
  });

  it('rejects a weapon two sizes larger', () => {
    const weapon = equippedWeapon('axes', 'Large');

    const result = resolveEquippedWeaponSkills(
      sheet,
      weapon,
      'Small',
    );

    expect(result.status).toBe('too-large');
    expect(result.canWield).toBe(false);
  });

  it('resolves bows to Ranged', () => {
    const result = resolveEquippedWeaponSkills(
      sheet,
      equippedWeapon('bows'),
    );

    expect(result.skills).toEqual(['Ranged']);
  });

  it('resolves crossbows to Ranged', () => {
    const result = resolveEquippedWeaponSkills(
      sheet,
      equippedWeapon('crossbows'),
    );

    expect(result.skills).toEqual(['Ranged']);
  });

  it('resolves staves to Spellcraft', () => {
    const result = resolveEquippedWeaponSkills(
      sheet,
      equippedWeapon('staves'),
    );

    expect(result.skills).toEqual(['Spellcraft']);
  });

  it('returns unresolved for unknown equipment', () => {
    const unknown: Equipment = {
      id: 'unknown_weapon',
      name: 'Unknown Weapon',
      slot: 'mainHand',
      bulk: 1,
    };

    const result = resolveEquippedWeaponSkills(
      sheet,
      unknown,
    );

    expect(result.status).toBe('unresolved');
    expect(result.skills).toEqual([]);
  });
});