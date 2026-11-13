export type AbilityKind = 'technick' | 'talent';
export type AbilitySource = 'general-technick' | 'class-starting-technick' | 'class-bonus-technick' | 'class-talent' | 'other';

export interface ClassLevelEvent {
  /** Overall character level reached by this event. */
  characterLevel: number;
  classId: string;
  /** Level in the chosen class after this event. */
  classLevel: number;
}

export interface AbilitySlot {
  id: string;
  characterLevel: number;
  classId: string;
  classLevel: number;
  kind: AbilityKind;
  source: Exclude<AbilitySource, 'other'>;
}

export interface AbilityAcquisition {
  id: string;
  slotId?: string;
  abilityId: string;
  /** Display name retained for compatibility with legacy character exports. */
  abilityName: string;
  kind: AbilityKind;
  source: AbilitySource;
  characterLevel: number | null;
  classId: string | null;
  classLevel: number | null;
  talentTreeId?: string;
  sourcebookId?: string;
  selectedOptions: Record<string, string>;
  acquisitionOrder: number;
  /** Unknown means the historical acquisition level cannot be established. */
  provenance: 'recorded' | 'legacy-unknown';
}

export interface AbilityProgressionState {
  schemaVersion: 1;
  levelHistory: ClassLevelEvent[];
  acquisitions: AbilityAcquisition[];
  /** Legacy imports can be preserved without inventing their level history. */
  needsReconciliation: boolean;
}