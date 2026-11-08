import { describe, expect, it } from 'vitest';
import { resolveMeleeWeaponSkills } from './weaponSkills';

describe('resolveMeleeWeaponSkills', () => {
  it('uses Light Weapon for weapons 2 sizes smaller', () => {
    const result = resolveMeleeWeaponSkills(3, 1);

    expect(result.canWield).toBe(true);
    expect(result.skills).toEqual(['Light Weapon']);
  });

  it('offers both skills for weapons 1 size smaller', () => {
    const result = resolveMeleeWeaponSkills(3, 2);

    expect(result.skills).toEqual([
      'Light Weapon',
      '1-Handed',
    ]);
  });

  it('uses 1-Handed for same-size weapons', () => {
    const result = resolveMeleeWeaponSkills(3, 3);

    expect(result.skills).toEqual(['1-Handed']);
  });

  it('uses 2-Handed for weapons 1 size larger', () => {
    const result = resolveMeleeWeaponSkills(3, 4);

    expect(result.skills).toEqual(['2-Handed']);
  });

  it('rejects weapons 2 sizes larger', () => {
    const result = resolveMeleeWeaponSkills(3, 5);

    expect(result.canWield).toBe(false);
    expect(result.skills).toEqual([]);
  });

  it('rejects non-integer size ranks', () => {
    expect(() =>
      resolveMeleeWeaponSkills(2.5, 3),
    ).toThrow('Size ranks must be integers.');
  });
});