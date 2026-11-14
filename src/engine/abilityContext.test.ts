import { describe, expect, it } from 'vitest';
import { getAbilityEligibilityContext } from './abilityContext';
import type { AbilityAcquisition, AbilitySlot } from '../types/abilities';
import { SOURCEBOOK_IDS } from '../data/sourcebooks';

const slot: AbilitySlot = {
  id: 'level-3-general-technick',
  characterLevel: 3,
  classId: 'warrior',
  classLevel: 3,
  kind: 'technick',
  source: 'general-technick',
};

function acquisition(level: number | null, provenance: AbilityAcquisition['provenance'], name: string): AbilityAcquisition {
  return {
    id: name,
    abilityId: name,
    abilityName: name,
    kind: 'technick',
    source: 'general-technick',
    characterLevel: level,
    classId: 'warrior',
    classLevel: level,
    selectedOptions: {},
    acquisitionOrder: 1,
    provenance,
  };
}

describe('historical ability eligibility context', () => {
  it('enables Corebook by default and requires explicit Atlas opt-in', () => {
    const defaultContext = getAbilityEligibilityContext(slot, []);
    expect(defaultContext.enabledSourcebooks.has(SOURCEBOOK_IDS.CORE)).toBe(true);
    expect(defaultContext.enabledSourcebooks.has(SOURCEBOOK_IDS.ATLAS_DTR)).toBe(false);
    expect(getAbilityEligibilityContext(slot, [], true).enabledSourcebooks.has(SOURCEBOOK_IDS.ATLAS_DTR)).toBe(true);
  });

  it('only trusts recorded abilities from earlier character levels', () => {
    const acquired = [
      acquisition(1, 'recorded', 'Earlier'),
      acquisition(3, 'recorded', 'Same level'),
      acquisition(4, 'recorded', 'Future'),
      acquisition(null, 'legacy-unknown', 'Unknown legacy'),
      acquisition(1, 'legacy-unknown', 'Unverified legacy'),
    ];
    const context = getAbilityEligibilityContext(slot, acquired);
    expect(context.knownAbilitiesAtLevel).toEqual(['Earlier']);
    expect(context.acquired).toBe(acquired);
  });

  it('does not infer historical attributes or skill training', () => {
    const context = getAbilityEligibilityContext(slot, []);
    expect(context.attributesAtLevel).toBeUndefined();
    expect(context.trainedSkillsAtLevel).toBeUndefined();
  });
});
