import { CLASSES } from '../data';
import type { CharacterSheet } from '../types';

interface AdvancedRequirements {
  level: number;
  skills?: string[];
  technicks?: string[];
  talents?: string[];
  special?: string;
}

interface AdvancedClass {
  id: string;
  name: string;
  type: 'advanced';
  requirements: AdvancedRequirements;
}

export interface ClassEligibility {
  eligible: boolean;
  missing: string[];
  requiresGMApproval: boolean;
}

/** Confirmation is specific to this advancement attempt; it is not persisted. */
export interface EligibilityOptions {
  gmApproved?: boolean;
}

const normalize = (value: string): string => value.trim().toLocaleLowerCase('en-US');
const owns = (values: readonly string[], required: string): boolean =>
  values.some((value) => normalize(value) === normalize(required));

function isAdvancedClass(value: unknown): value is AdvancedClass {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Partial<AdvancedClass>;
  return entry.type === 'advanced' &&
    typeof entry.id === 'string' &&
    typeof entry.name === 'string' &&
    typeof entry.requirements?.level === 'number';
}

export function checkAdvancedClassEligibility(
  sheet: CharacterSheet,
  classId: string,
  options: EligibilityOptions = {},
): ClassEligibility {
  const selectedClass = (CLASSES.flat() as unknown[]).find(
    (entry): entry is AdvancedClass =>
      isAdvancedClass(entry) && entry.id === classId,
  );

  if (!selectedClass) {
    return {
      eligible: false,
      missing: [`Unknown advanced class: ${classId}`],
      requiresGMApproval: false,
    };
  }

  const requirements = selectedClass.requirements;
  const missing: string[] = [];
  const totalLevel = sheet.classes.reduce((sum, entry) => sum + entry.level, 0);

  if (!Number.isInteger(totalLevel) || totalLevel < requirements.level) {
    missing.push(`Requires character level ${requirements.level}`);
  }

  for (const skill of requirements.skills ?? []) {
    if (!owns(sheet.trainedSkills, skill)) missing.push(`Requires trained skill: ${skill}`);
  }
  for (const technick of requirements.technicks ?? []) {
    if (!owns(sheet.technicks, technick)) missing.push(`Requires Technick: ${technick}`);
  }
  for (const talent of requirements.talents ?? []) {
    if (!owns(sheet.talents, talent)) missing.push(`Requires talent: ${talent}`);
  }

  const requiresGMApproval = Boolean(requirements.special?.trim());
  if (requiresGMApproval && options.gmApproved !== true) {
    missing.push(`GM confirmation required: ${requirements.special}`);
  }

  return { eligible: missing.length === 0, missing, requiresGMApproval };
}
