import { describe, expect, it } from 'vitest';
import type { CharacterSheet } from '../types';
import { advanceCharacter } from './characterProgression';

function sheet(overrides: Partial<CharacterSheet> = {}): CharacterSheet {
  return {
    id: 'hero-1', name: 'Hero', race: 'Human', ethos: 'Neutral', zodiacSign: 'Aries',
    classes: [{ name: 'Warrior', level: 7 }],
    baseAttributes: { str: 10, vit: 12, agi: 10, int: 10, mnd: 12, chr: 10 },
    currentHp: 40, tempHp: 2, currentMp: 10, tempMp: 3,
    breakStep: 1, heroPoints: 2, gold: 125, notes: 'Important',
    trainedSkills: [], focusedSkills: [], technicks: [], talents: [],
    equipped: {}, inventory: [], ...overrides,
  };
}

const scholarRequirements = {
  trainedSkills: ['Lore (Arcane)', 'Spellcraft'],
  technicks: ['Arcane Study', 'Linguist'],
  talents: ['Educated', 'Loremaster'],
};

describe('character advancement', () => {
  it('advances an existing base class and preserves the original', () => {
    const original = sheet();
    const before = JSON.stringify(original);
    const result = advanceCharacter(original, { classId: 'warrior' });
    expect(result.character.classes).toEqual([{ name: 'Warrior', level: 8 }]);
    expect(result).toMatchObject({ previousLevel: 7, newLevel: 8, classLevel: 8, hpGained: 7, mpGained: 3 });
    expect(JSON.stringify(original)).toBe(before);
  });

  it('adds an eligible advanced class instead of replacing Warrior', () => {
    const result = advanceCharacter(sheet(scholarRequirements), { classId: 'scholar' });
    expect(result.character.classes).toEqual([
      { name: 'Warrior', level: 7 }, { name: 'Scholar', level: 1 },
    ]);
    expect(result.character.currentHp).toBe(46);
    expect(result.character.currentMp).toBe(14);
    expect(result.character.gold).toBe(125);
    expect(result.character.talents).toEqual(scholarRequirements.talents);
  });

  it('advances an already acquired advanced class without rechecking entry prerequisites', () => {
    const result = advanceCharacter(sheet({ classes: [
      { name: 'Warrior', level: 7 }, { name: 'Scholar', level: 1 },
    ] }), { classId: 'scholar' });
    expect(result.character.classes[1]).toEqual({ name: 'Scholar', level: 2 });
    expect(result.newLevel).toBe(9);
  });

  it('rejects missing advanced class prerequisites without mutating the sheet', () => {
    const original = sheet();
    const before = JSON.stringify(original);
    expect(() => advanceCharacter(original, { classId: 'scholar' }))
      .toThrow('Cannot enter Scholar');
    expect(JSON.stringify(original)).toBe(before);
  });

  it('requires GM confirmation for special entry conditions', () => {
    const original = sheet({
      trainedSkills: ['Pilot'], technicks: ['Naval Combat'], talents: ['Helmsman'],
    });
    expect(() => advanceCharacter(original, { classId: 'aeronaut' })).toThrow('GM confirmation');
    expect(advanceCharacter(original, { classId: 'aeronaut', gmApproved: true })
      .character.classes[1]).toEqual({ name: 'Aeronaut', level: 1 });
  });

  it('rejects invalid classes and the level cap', () => {
    expect(() => advanceCharacter(sheet(), { classId: 'missing' })).toThrow('Unknown class');
    expect(() => advanceCharacter(sheet({ classes: [{ name: 'Warrior', level: 20 }] }),
      { classId: 'warrior' })).toThrow('between levels 1 and 19');
  });

  it('preserves combat state and never grants starting Technicks or gold', () => {
    const original = sheet({ classes: [{ name: 'Mage', level: 7 }] });
    const result = advanceCharacter(original, { classId: 'ranger' });
    expect(result.character.classes).toEqual([
      { name: 'Mage', level: 7 }, { name: 'Ranger', level: 1 },
    ]);
    expect(result.character.breakStep).toBe(1);
    expect(result.character.tempHp).toBe(2);
    expect(result.character.tempMp).toBe(3);
    expect(result.character.technicks).toEqual([]);
    expect(result.character.gold).toBe(125);
  });
});
