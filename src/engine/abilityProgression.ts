import type { AbilityAcquisition, AbilityProgressionState, AbilitySlot, ClassLevelEvent } from '../types/abilities';

/** Validates a fully recorded level history; partial histories are not treated as complete. */
export function validateLevelHistory(history: readonly ClassLevelEvent[]): string[] {
  const issues: string[] = [];
  const counts = new Map<string, number>();
  history.forEach((event, index) => {
    const expectedLevel = index + 1;
    if (event.characterLevel !== expectedLevel) issues.push(`Event ${index + 1}: expected character level ${expectedLevel}`);
    if (!event.classId.trim()) issues.push(`Event ${index + 1}: missing class ID`);
    const expectedClassLevel = (counts.get(event.classId) ?? 0) + 1;
    if (event.classLevel !== expectedClassLevel) issues.push(`Event ${index + 1}: expected ${event.classId} level ${expectedClassLevel}`);
    counts.set(event.classId, expectedClassLevel);
  });
  if (history.length > 20) issues.push('Character progression exceeds level 20');
  return issues;
}

/**
 * Produces selection opportunities, not automatic ability grants.
 * Starting class technicks are tracked separately: their exact quantities and
 * eligibility depend on the class definitions and character creation rules.
 */
export function generateAbilitySlots(history: readonly ClassLevelEvent[]): AbilitySlot[] {
  const issues = validateLevelHistory(history);
  if (issues.length) throw new Error(`Invalid level history: ${issues.join('; ')}`);
  const slots: AbilitySlot[] = [];
  for (const event of history) {
    const { characterLevel, classId, classLevel } = event;
    if (characterLevel % 2 === 1) {
      slots.push({ id: `level-${characterLevel}-general-technick`, characterLevel, classId, classLevel, kind: 'technick', source: 'general-technick' });
    }
    if (classLevel % 2 === 0) {
      slots.push({ id: `level-${characterLevel}-${classId}-bonus-technick`, characterLevel, classId, classLevel, kind: 'technick', source: 'class-bonus-technick' });
    } else {
      slots.push({ id: `level-${characterLevel}-${classId}-talent`, characterLevel, classId, classLevel, kind: 'talent', source: 'class-talent' });
    }
  }
  return slots;
}

/** Import old name-only selections without fabricating acquisition dates or classes. */
export function importLegacyAbilities(technicks: readonly string[], talents: readonly string[]): AbilityProgressionState {
  let order = 0;
  const make = (names: readonly string[], kind: AbilityAcquisition['kind']): AbilityAcquisition[] =>
    names.map((name) => ({
      id: `legacy-${kind}-${++order}`,
      abilityId: `legacy:${kind}:${name.trim().toLowerCase()}`,
      abilityName: name,
      kind,
      source: 'other',
      characterLevel: null,
      classId: null,
      classLevel: null,
      selectedOptions: {},
      acquisitionOrder: order,
      provenance: 'legacy-unknown',
    }));
  const acquisitions = [...make(technicks, 'technick'), ...make(talents, 'talent')];
  return { schemaVersion: 1, levelHistory: [], acquisitions, needsReconciliation: acquisitions.length > 0 };
}

/** Prevents one earned selection slot from being spent twice. */
export function validateAcquisitionSlots(slots: readonly AbilitySlot[], acquisitions: readonly AbilityAcquisition[]): string[] {
  const issues: string[] = [];
  const byId = new Map(slots.map((slot) => [slot.id, slot]));
  const spent = new Set<string>();
  for (const acquisition of acquisitions) {
    if (!acquisition.slotId) continue;
    const slot = byId.get(acquisition.slotId);
    if (!slot) { issues.push(`Unknown slot ${acquisition.slotId}`); continue; }
    if (spent.has(slot.id)) issues.push(`Slot ${slot.id} was used more than once`);
    spent.add(slot.id);
    if (slot.kind !== acquisition.kind || slot.source !== acquisition.source || slot.characterLevel !== acquisition.characterLevel || slot.classId !== acquisition.classId || slot.classLevel !== acquisition.classLevel) {
      issues.push(`Acquisition ${acquisition.id} does not match slot ${slot.id}`);
    }
  }
  return issues;
}
