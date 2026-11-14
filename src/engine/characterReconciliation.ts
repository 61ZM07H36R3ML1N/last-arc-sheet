import type { CharacterSheet } from '../types';
import type { AbilityProgressionState, ClassLevelEvent } from '../types/abilities';
import { CLASSES } from '../data';
import { abilityRegistry, evaluateAbilityEligibility } from './abilityEligibility';
import { getAbilityEligibilityContext } from './abilityContext';
import { generateAbilitySlots, validateAcquisitionSlots, validateLevelHistory } from './abilityProgression';

export interface ReconciliationDraft {
  /** Class chosen at each character level, in chronological order. */
  classIds: string[];
  /** Explicit player-provided legacy acquisition ID -> earned slot ID. */
  assignments: Record<string, string>;
}

export function reconcileCharacter(
  sheet: CharacterSheet,
  draft: ReconciliationDraft,
  atlasEnabled: boolean,
): AbilityProgressionState {
  const original = sheet.abilityProgression;
  if (!original) throw new Error('Missing legacy progression records.');
  const definitions = CLASSES.flat();
  const current = new Map<string, number>();
  for (const entry of sheet.classes) {
    const definition = definitions.find(item => item.name.toLowerCase() === entry.name.toLowerCase());
    if (!definition) throw new Error(`Unknown class: ${entry.name}`);
    current.set(definition.id, (current.get(definition.id) ?? 0) + entry.level);
  }
  const total = [...current.values()].reduce((sum, count) => sum + count, 0);
  if (!total || total > 20 || draft.classIds.length !== total) {
    throw new Error('Provide exactly one class for every character level (maximum 20).');
  }
  const counts = new Map<string, number>();
  const history: ClassLevelEvent[] = draft.classIds.map((classId, index) => {
    if (!current.has(classId)) throw new Error(`Class ${classId} is not on this character.`);
    const classLevel = (counts.get(classId) ?? 0) + 1;
    counts.set(classId, classLevel);
    return { characterLevel: index + 1, classId, classLevel };
  });
  for (const [classId, level] of current) {
    if (counts.get(classId) !== level) throw new Error(`Class history does not match ${classId} level ${level}.`);
  }
  const historyIssues = validateLevelHistory(history);
  if (historyIssues.length) throw new Error(historyIssues.join('; '));
  const slots = generateAbilitySlots(history);
  const bySlot = new Map(slots.map(slot => [slot.id, slot]));
  const legacy = original.acquisitions.filter(item => item.provenance === 'legacy-unknown');
  const legacyIds = new Set(legacy.map(item => item.id));
  if (Object.keys(draft.assignments).some(id => !legacyIds.has(id))) {
    throw new Error('Assignments contain an unknown legacy acquisition.');
  }
  const existing = original.acquisitions.filter(item => item.provenance === 'recorded');
  const spent = new Set(existing.map(item => item.slotId).filter((id): id is string => Boolean(id)));
  const resolved = [...existing];
  // Process by earned level so prerequisites cannot be satisfied by future abilities.
  const selected = legacy.filter(item => draft.assignments[item.id]);
  selected.sort((a, b) => {
    const aLevel = bySlot.get(draft.assignments[a.id])?.characterLevel ?? Infinity;
    const bLevel = bySlot.get(draft.assignments[b.id])?.characterLevel ?? Infinity;
    return aLevel - bLevel;
  });
  for (const item of selected) {
    const slot = bySlot.get(draft.assignments[item.id]);
    if (!slot) throw new Error(`Invalid slot for ${item.abilityName}.`);
    if (spent.has(slot.id)) throw new Error(`Slot ${slot.id} is already assigned.`);
    if (slot.kind !== item.kind) throw new Error(`Wrong slot type for ${item.abilityName}.`);
    const rule = abilityRegistry.find(candidate =>
      candidate.kind === item.kind && candidate.name.toLowerCase() === item.abilityName.toLowerCase(),
    );
    if (!rule) throw new Error(`No verified registry entry for ${item.abilityName}; preserve it as unresolved.`);
    const context = getAbilityEligibilityContext(slot, resolved, atlasEnabled);
    // The current eligibility engine deliberately rejects unknown historical facts.
    const result = evaluateAbilityEligibility(rule, context);
    if (!result.eligible) throw new Error(`${item.abilityName}: ${[...result.reasons, ...result.unresolved].join('; ')}`);
    resolved.push({
      ...item, slotId: slot.id, abilityId: rule.id, source: slot.source,
      characterLevel: slot.characterLevel, classId: slot.classId,
      classLevel: slot.classLevel, sourcebookId: rule.sourcebookId,
      talentTreeId: rule.talentTreeId, provenance: 'recorded',
    });
    spent.add(slot.id);
  }
  const unresolved = legacy.filter(item => !draft.assignments[item.id]);
  const acquisitions = [...resolved, ...unresolved].sort((a, b) => a.acquisitionOrder - b.acquisitionOrder);
  const issues = validateAcquisitionSlots(slots, acquisitions);
  if (issues.length) throw new Error(issues.join('; '));
  return {
    schemaVersion: 1,
    levelHistory: history,
    acquisitions,
    needsReconciliation: unresolved.length > 0,
  };
}
