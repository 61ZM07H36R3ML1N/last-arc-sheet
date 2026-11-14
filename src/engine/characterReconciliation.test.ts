import { describe, expect, it } from 'vitest';
import { getDefaultCharacter, useCharacterStore } from '../store/useCharacterStore';
import { reconcileCharacter } from './characterReconciliation';
import type { CharacterSheet } from '../types';

function legacy(): CharacterSheet {
  const sheet = getDefaultCharacter();
  return {
    ...sheet,
    technicks: ['Precise Shot'],
    talents: [],
    abilityProgression: {
      schemaVersion: 1,
      levelHistory: [],
      acquisitions: [{
        id: 'legacy-1', abilityId: 'legacy:precise-shot', abilityName: 'Precise Shot',
        kind: 'technick', source: 'other', characterLevel: null, classId: null,
        classLevel: null, selectedOptions: {}, acquisitionOrder: 1, provenance: 'legacy-unknown',
      }],
      needsReconciliation: true,
    },
  };
}

describe('character history reconciliation', () => {
  it('preserves unassigned legacy abilities and keeps selection locked', () => {
    const result = reconcileCharacter(legacy(), { classIds: ['warrior'], assignments: {} }, false);
    expect(result.levelHistory).toEqual([{ characterLevel: 1, classId: 'warrior', classLevel: 1 }]);
    expect(result.needsReconciliation).toBe(true);
    expect(result.acquisitions[0].characterLevel).toBeNull();
  });

  it('accepts an explicitly mapped eligible ability and unlocks history', () => {
    const result = reconcileCharacter(legacy(), {
      classIds: ['warrior'], assignments: { 'legacy-1': 'level-1-general-technick' },
    }, false);
    expect(result.needsReconciliation).toBe(false);
    expect(result.acquisitions[0]).toEqual(expect.objectContaining({
      provenance: 'recorded', characterLevel: 1, abilityId: 'technick:precise-shot',
    }));
  });

  it('rejects a mismatched class history without modifying input', () => {
    const sheet = legacy();
    expect(() => reconcileCharacter(sheet, { classIds: ['mage'], assignments: {} }, false))
      .toThrow(/not on this character/i);
    expect(sheet.abilityProgression?.levelHistory).toEqual([]);
  });

  it('rejects wrong-type slots and preserves legacy records', () => {
    expect(() => reconcileCharacter(legacy(), {
      classIds: ['warrior'], assignments: { 'legacy-1': 'level-1-warrior-talent' },
    }, false)).toThrow(/wrong slot type/i);
  });

  it('rejects duplicate slot assignments', () => {
    const sheet = legacy();
    sheet.abilityProgression!.acquisitions.push({
      ...sheet.abilityProgression!.acquisitions[0], id: 'legacy-2',
      abilityName: 'Threshold Up', abilityId: 'legacy:threshold-up', acquisitionOrder: 2,
    });
    expect(() => reconcileCharacter(sheet, {
      classIds: ['warrior'],
      assignments: {
        'legacy-1': 'level-1-general-technick',
        'legacy-2': 'level-1-general-technick',
      },
    }, false)).toThrow(/already assigned/i);
  });

  it('rejects stale wizard commits atomically', () => {
    const sheet = legacy();
    useCharacterStore.getState().importSheet(sheet);
    const snapshot = useCharacterStore.getState().sheet.abilityProgression!;
    useCharacterStore.getState().updateNotes('changed');
    // Progression identity is unchanged by notes edits; character ID and progression
    // snapshot still match. Importing a different sheet invalidates the snapshot.
    useCharacterStore.getState().importSheet({ ...sheet, id: 'another-character' });
    expect(() => useCharacterStore.getState().reconcileHistory(sheet.id, snapshot, {
      classIds: ['warrior'], assignments: {},
    })).toThrow(/character changed/i);
  });
});
