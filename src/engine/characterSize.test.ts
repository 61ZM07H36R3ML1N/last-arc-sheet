import { describe, expect, it } from 'vitest';
import {
  getSizeRank,
  resolveCharacterSize,
} from './characterSize';
import { resolveMeleeWeaponSkills } from './weaponSkills';

describe('Character size integration', () => {
  it('resolves a Human as Medium', () => {
    expect(resolveCharacterSize('Human')).toBe('Medium');
  });

  it('supports race IDs', () => {
    expect(resolveCharacterSize('human')).toBe('Medium');
  });

  it('supports temporary size overrides', () => {
    expect(resolveCharacterSize('Human', 'Small'))
      .toBe('Small');
  });

  it('rejects unknown races', () => {
    expect(() => resolveCharacterSize('Unknown'))
      .toThrow('Unknown character race');
  });

  it('resolves a Medium character with a Small weapon', () => {
    const result = resolveMeleeWeaponSkills(
      getSizeRank(resolveCharacterSize('Human')),
      getSizeRank('Small'),
    );

    expect(result.canWield).toBe(true);
    expect(result.skills).toEqual([
      'Light Weapon',
      '1-Handed',
    ]);
  });

  it('rejects a Large weapon for a Small character', () => {
    const result = resolveMeleeWeaponSkills(
      getSizeRank('Small'),
      getSizeRank('Large'),
    );

    expect(result.canWield).toBe(false);
  });
});