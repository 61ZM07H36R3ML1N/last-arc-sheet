import { describe, expect, it } from 'vitest';
import type { CharacterSheet } from '../types';
import { checkAdvancedClassEligibility } from './classRequirements';

function makeSheet(overrides: Partial<CharacterSheet> = {}): CharacterSheet {
  return {
    id: 'eligibility-test', name: 'Test Hero', race: 'Human',
    ethos: 'Pure Good', zodiacSign: 'Aries',
    classes: [{ name: 'Warrior', level: 7 }],
    baseAttributes: { str: 10, vit: 10, agi: 10, int: 10, mnd: 10, chr: 10 },
    currentHp: 30, tempHp: 0, currentMp: 6, tempMp: 0,
    breakStep: 0, heroPoints: 1, gold: 1000, notes: '',
    trainedSkills: [], focusedSkills: [], technicks: [], talents: [],
    equipped: {}, inventory: [],
    ...overrides,
  };
}

const qualifying: Record<string, Pick<CharacterSheet, 'trainedSkills' | 'technicks' | 'talents'>> = {
  aeronaut: { trainedSkills: ['Pilot'], technicks: ['Naval Combat'], talents: ['Helmsman'] },
  astrologian: { trainedSkills: ['Lore (Social)', 'Ride'], technicks: ['Arcane Study'], talents: ['Synastry'] },
  condottiere: { trainedSkills: ['Lore (Social)', 'Ride'], technicks: ['Mounted Combat'], talents: ['Mounted Charge'] },
  magnate: { trainedSkills: ['Persuasion'], technicks: ['Skill Focus (persuasion)'], talents: ['Skilled Negotiator'] },
  mstovari: { trainedSkills: ['Deception', 'Stealth'], technicks: ['Skill Focus (deception)', 'Skill Focus (stealth)'], talents: ['Facade'] },
  scholar: { trainedSkills: ['Lore (Arcane)', 'Spellcraft'], technicks: ['Arcane Study', 'Linguist'], talents: ['Educated', 'Loremaster'] },
};

describe('Advanced Class prerequisite validation', () => {
  for (const [id, requirements] of Object.entries(qualifying)) {
    it(`accepts a fully qualified ${id} character`, () => {
      const result = checkAdvancedClassEligibility(makeSheet(requirements), id, { gmApproved: true });
      expect(result).toMatchObject({ eligible: true, missing: [] });
    });
    it(`rejects ${id} below level 7`, () => {
      const result = checkAdvancedClassEligibility(makeSheet({ ...requirements, classes: [{ name: 'Warrior', level: 6 }] }), id, { gmApproved: true });
      expect(result.eligible).toBe(false);
      expect(result.missing).toContain('Requires character level 7');
    });
  }

  it('rejects an unknown class and a base class', () => {
    expect(checkAdvancedClassEligibility(makeSheet(), 'not-a-class').eligible).toBe(false);
    expect(checkAdvancedClassEligibility(makeSheet(), 'warrior').eligible).toBe(false);
  });

  it('does not confuse generic Lore with Lore (arcane)', () => {
    const sheet = makeSheet({ ...qualifying.scholar, trainedSkills: ['Lore', 'Spellcraft'] });
    expect(checkAdvancedClassEligibility(sheet, 'scholar').missing)
      .toContain('Requires trained skill: Lore (arcane)');
  });

  it('matches capitalization and trims whitespace', () => {
    const sheet = makeSheet({ ...qualifying.scholar, trainedSkills: [' lore (ARCANE) ', 'Spellcraft'] });
    expect(checkAdvancedClassEligibility(sheet, 'scholar').eligible).toBe(true);
  });

  it('reports missing Technicks and talents separately', () => {
    const sheet = makeSheet({ ...qualifying.scholar, technicks: ['Arcane Study'], talents: ['Educated'] });
    expect(checkAdvancedClassEligibility(sheet, 'scholar').missing).toEqual([
      'Requires Technick: Linguist', 'Requires talent: Loremaster',
    ]);
  });

  it('requires GM confirmation for special conditions', () => {
    const sheet = makeSheet(qualifying.aeronaut);
    const result = checkAdvancedClassEligibility(sheet, 'aeronaut');
    expect(result.eligible).toBe(false);
    expect(result.requiresGMApproval).toBe(true);
    expect(result.missing.some((item) => item.startsWith('GM confirmation required:'))).toBe(true);
    expect(checkAdvancedClassEligibility(sheet, 'aeronaut', { gmApproved: true }).eligible).toBe(true);
  });

  it('does not mutate the character', () => {
    const sheet = makeSheet(qualifying.scholar);
    const before = JSON.stringify(sheet);
    checkAdvancedClassEligibility(sheet, 'scholar');
    expect(JSON.stringify(sheet)).toBe(before);
  });

  it('uses the sum of class levels', () => {
    const sheet = makeSheet({ ...qualifying.scholar, classes: [
      { name: 'Warrior', level: 4 }, { name: 'Mage', level: 3 },
    ] });
    expect(checkAdvancedClassEligibility(sheet, 'scholar').eligible).toBe(true);
  });
});
