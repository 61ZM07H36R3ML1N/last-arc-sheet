import { describe, expect, it } from 'vitest';
import type { CharacterSheet } from '../types';

import {
  resolveWeaponProficiency,
  getWeaponProficiencyPenalty,
  UNPROFICIENT_WEAPON_PENALTY,
} from './weaponProficiency';

function makeSheet(
  technicks: string[] = [],
): Pick<CharacterSheet, 'technicks'> {
  return { technicks };
}

describe('Weapon proficiency resolution', () => {
  it('recognizes proficiency in swords', () => {
    const result = resolveWeaponProficiency(
      makeSheet(['Weapon Proficiency (Swords)']),
      'swords',
    );

    expect(result.proficient).toBe(true);
    expect(result.penalty).toBe(0);
    expect(result.source).toBe(
      'Weapon Proficiency (Swords)',
    );
  });

  it('applies -5 when proficiency is missing', () => {
    const result = resolveWeaponProficiency(
      makeSheet(),
      'swords',
    );

    expect(result.proficient).toBe(false);
    expect(result.penalty).toBe(-5);
    expect(result.source).toBeNull();
  });

  it('does not confuse different weapon groups', () => {
    const result = resolveWeaponProficiency(
      makeSheet(['Weapon Proficiency (Knives)']),
      'swords',
    );

    expect(result.proficient).toBe(false);
    expect(result.penalty).toBe(-5);
  });

  it('supports multiple proficiency technicks', () => {
    const result = resolveWeaponProficiency(
      makeSheet([
        'Weapon Proficiency (Knives)',
        'Weapon Proficiency (Bows)',
        'Weapon Proficiency (Swords)',
      ]),
      'bows',
    );

    expect(result.proficient).toBe(true);
    expect(result.penalty).toBe(0);
  });

  it('ignores capitalization and surrounding whitespace', () => {
    const result = resolveWeaponProficiency(
      makeSheet([
        '  weapon proficiency (  SWORDS  )  ',
      ]),
      ' Swords ',
    );

    expect(result.proficient).toBe(true);
  });

  it('does not mistake skill focus for proficiency', () => {
    const result = resolveWeaponProficiency(
      makeSheet(['Skill Focus (1-Handed)']),
      'swords',
    );

    expect(result.proficient).toBe(false);
    expect(result.penalty).toBe(-5);
  });

  it('does not mistake a bare technick for group proficiency', () => {
    const result = resolveWeaponProficiency(
      makeSheet(['Weapon Proficiency']),
      'swords',
    );

    expect(result.proficient).toBe(false);
  });

  it('rejects an empty weapon category', () => {
    expect(() =>
      resolveWeaponProficiency(
        makeSheet(),
        '   ',
      ),
    ).toThrow('Weapon category cannot be empty.');
  });

  it('exposes the penalty through the convenience function', () => {
    expect(
      getWeaponProficiencyPenalty(
        makeSheet(),
        'axes',
      ),
    ).toBe(UNPROFICIENT_WEAPON_PENALTY);

    expect(
      getWeaponProficiencyPenalty(
        makeSheet([
          'Weapon Proficiency (Axes)',
        ]),
        'axes',
      ),
    ).toBe(0);
  });
});