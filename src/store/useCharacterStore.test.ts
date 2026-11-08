import { describe, expect, it } from 'vitest';

import { CLASSES } from '../data';
import { resolveWeaponProficiency } from '../engine/weaponProficiency';
import { getDefaultCharacter } from './useCharacterStore';

describe('Default character initialization', () => {
  const warrior = CLASSES.flat().find(
    (entry) => entry.id === 'warrior',
  );

  it('has a Warrior definition in the class catalog', () => {
    expect(warrior).toBeDefined();
  });

  it('initializes Kress as a level 1 Warrior', () => {
    const sheet = getDefaultCharacter();

    expect(sheet.name).toBe('Kress');
    expect(sheet.classes).toEqual([
      { name: 'Warrior', level: 1 },
    ]);
  });

  it('includes every starting Warrior Technick', () => {
    const sheet = getDefaultCharacter();

    expect(warrior).toBeDefined();

    for (const technick of warrior!.startingTechnicks) {
      expect(sheet.technicks).toContain(technick);
    }
  });

  it('preserves the existing Power Attack Technick', () => {
    const sheet = getDefaultCharacter();

    expect(sheet.technicks).toContain('Power Attack');
  });

  it('does not duplicate starting Technicks', () => {
    const sheet = getDefaultCharacter();

    expect(new Set(sheet.technicks).size).toBe(
      sheet.technicks.length,
    );
  });

  it.each([
    'axes',
    'bludgeons',
    'knives',
    'polearms',
    'swords',
  ])('is proficient with %s', (category) => {
    const sheet = getDefaultCharacter();

    const result = resolveWeaponProficiency(
      sheet,
      category,
    );

    expect(result.proficient).toBe(true);
    expect(result.penalty).toBe(0);
  });

  it.each([
    'bows',
    'crossbows',
    'staves',
  ])('does not automatically grant %s proficiency', (category) => {
    const sheet = getDefaultCharacter();

    const result = resolveWeaponProficiency(
      sheet,
      category,
    );

    expect(result.proficient).toBe(false);
    expect(result.penalty).toBe(-5);
  });

  it('returns independent character objects', () => {
    const first = getDefaultCharacter();
    const second = getDefaultCharacter();

    first.technicks.push(
      'Weapon Proficiency (bows)',
    );
    first.baseAttributes.str = 8;
    first.classes[0].level = 10;

    expect(second.technicks).not.toContain(
      'Weapon Proficiency (bows)',
    );
    expect(second.baseAttributes.str).toBe(16);
    expect(second.classes[0].level).toBe(1);
  });

  it('preserves the initial character resources', () => {
    const sheet = getDefaultCharacter();

    expect(sheet.currentHp).toBe(32);
    expect(sheet.currentMp).toBe(6);
    expect(sheet.breakStep).toBe(0);
    expect(sheet.heroPoints).toBe(1);
  });
});