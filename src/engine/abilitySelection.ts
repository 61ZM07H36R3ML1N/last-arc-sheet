import type { AbilityAcquisition, AbilitySlot } from '../types/abilities';
import type { AbilityRule, EligibilityContext } from './abilityEligibility';
import { evaluateAbilityEligibility } from './abilityEligibility';
import { validateAcquisitionSlots } from './abilityProgression';

/** Single atomic operation: validate, then consume a slot. Never mutate input. */
export function acquireAbility(slot: AbilitySlot, rule: AbilityRule, context: EligibilityContext): AbilityAcquisition[] {
  if (context.slot.id !== slot.id) throw new Error('Eligibility context does not match slot');
  const existing = context.acquired;
  if (existing.some(item => item.slotId === slot.id)) throw new Error('Selection slot already spent');
  const eligibility = evaluateAbilityEligibility(rule, context);
  if (!eligibility.eligible) throw new Error([...eligibility.reasons, ...eligibility.unresolved].join('; '));
  const acquisition: AbilityAcquisition = {
    id: `acq:${slot.id}`, slotId: slot.id, abilityId: rule.id, abilityName: rule.name,
    kind: rule.kind, source: slot.source, characterLevel: slot.characterLevel,
    classId: slot.classId, classLevel: slot.classLevel, talentTreeId: rule.talentTreeId,
    sourcebookId: rule.sourcebookId, selectedOptions: {},
    acquisitionOrder: Math.max(0, ...existing.map(item => item.acquisitionOrder)) + 1,
    provenance: 'recorded',
  };
  const next = [...existing, acquisition];
  const errors = validateAcquisitionSlots([slot], next.filter(item => item.slotId === slot.id));
  if (errors.length) throw new Error(errors.join('; '));
  return next;
}
