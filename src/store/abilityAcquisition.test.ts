import { beforeEach, describe, expect, it } from 'vitest';
import { getEnabledSourcebooks, SOURCEBOOK_IDS } from '../data/sourcebooks';
import { getDefaultCharacter, useCharacterStore } from './useCharacterStore';
import type { CharacterSheet } from '../types';

function verifiedWarrior(): CharacterSheet {
  const sheet = getDefaultCharacter();
  return {
    ...sheet,
    technicks: [],
    talents: [],
    abilityProgression: {
      schemaVersion: 1 as const,
      levelHistory: [{ characterLevel: 1, classId: 'warrior', classLevel: 1 }],
      acquisitions: [],
      needsReconciliation: false,
    },
  };
}

const slotId = 'level-1-general-technick';

describe('advancement ability acquisition', () => {
  beforeEach(() => {
    useCharacterStore.getState().importSheet(verifiedWarrior());
  });

  it('uses the canonical Corebook sourcebook ID', () => {
    expect(getEnabledSourcebooks().has(SOURCEBOOK_IDS.CORE)).toBe(true);
    expect(getEnabledSourcebooks().has(SOURCEBOOK_IDS.ATLAS_DTR)).toBe(false);
  });

  it('atomically records an eligible Corebook Technick', () => {
    useCharacterStore.getState().acquireAbility(slotId, 'technick:precise-shot');
    const sheet = useCharacterStore.getState().sheet;
    expect(sheet.technicks).toContain('Precise Shot');
    expect(sheet.abilityProgression?.acquisitions).toEqual([
      expect.objectContaining({
        slotId,
        abilityId: 'technick:precise-shot',
        characterLevel: 1,
        classId: 'warrior',
        classLevel: 1,
        provenance: 'recorded',
      }),
    ]);
  });

  it('rejects spending an already used slot without changing the ledger', () => {
    useCharacterStore.getState().acquireAbility(slotId, 'technick:precise-shot');
    const before = useCharacterStore.getState().sheet;
    expect(() => useCharacterStore.getState().acquireAbility(slotId, 'technick:threshold-up'))
      .toThrow(/already spent/i);
    expect(useCharacterStore.getState().sheet).toBe(before);
  });

  it('rejects Atlas abilities when the sourcebook is disabled', () => {
    const before = useCharacterStore.getState().sheet;
    expect(() => useCharacterStore.getState().acquireAbility(slotId, 'technick:cannoneer'))
      .toThrow(/sourcebook.*disabled/i);
    expect(useCharacterStore.getState().sheet).toBe(before);
  });

  it('fails closed when historical attribute scores are missing', () => {
    const before = useCharacterStore.getState().sheet;
    expect(() => useCharacterStore.getState().acquireAbility(slotId, 'technick:mighty-strikes'))
      .toThrow(/attribute history unavailable/i);
    expect(useCharacterStore.getState().sheet).toBe(before);
  });

  it('rejects unknown ability IDs without changing the sheet', () => {
    const before = useCharacterStore.getState().sheet;
    expect(() => useCharacterStore.getState().acquireAbility(slotId, 'technick:not-real'))
      .toThrow(/unknown ability/i);
    expect(useCharacterStore.getState().sheet).toBe(before);
  });

  it('blocks unreconciled legacy characters', () => {
    useCharacterStore.getState().importSheet({
      ...verifiedWarrior(),
      abilityProgression: {
        schemaVersion: 1,
        levelHistory: [{ characterLevel: 1, classId: 'warrior', classLevel: 1 }],
        acquisitions: [],
        needsReconciliation: true,
      },
    });
    expect(() => useCharacterStore.getState().acquireAbility(slotId, 'technick:precise-shot'))
      .toThrow(/reconcile/i);
  });

  it('rejects abilities whose prerequisites were not acquired at an earlier level', () => {
    const before = useCharacterStore.getState().sheet;
    expect(() => useCharacterStore.getState().acquireAbility(slotId, 'technick:cleave'))
      .toThrow(/requires mighty strikes|attribute history unavailable/i);
    expect(useCharacterStore.getState().sheet).toBe(before);
  });

  it('rejects nonexistent slots', () => {
    expect(() => useCharacterStore.getState().acquireAbility('level-99-general-technick', 'technick:precise-shot'))
      .toThrow(/unknown progression slot/i);
  });
});
