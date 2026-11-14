import type { AbilityAcquisition, AbilitySlot } from '../types/abilities';
import type { EligibilityContext } from './abilityEligibility';
import { getEnabledSourcebooks } from '../data/sourcebooks';

/**
 * Construct identical eligibility facts for the UI and the authoritative store.
 * Historical attributes and trained skills are intentionally omitted until
 * trustworthy per-level snapshots are available.
 *
 * Recorded acquisitions at the same level are not assumed to precede a slot.
 */
export function getAbilityEligibilityContext(
  slot: AbilitySlot,
  acquired: readonly AbilityAcquisition[],
  atlasEnabled = false,
): EligibilityContext {
  return {
    slot,
    acquired,
    enabledSourcebooks: getEnabledSourcebooks(atlasEnabled),
    knownAbilitiesAtLevel: acquired
      .filter((item) =>
        item.provenance === 'recorded' &&
        item.characterLevel !== null &&
        item.characterLevel < slot.characterLevel,
      )
      .map((item) => item.abilityName),
  };
}
