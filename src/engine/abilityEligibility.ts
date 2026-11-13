import type { AbilityAcquisition, AbilitySlot } from '../types/abilities';
import technicks from '../data/technicks.registry.json';
import talents from '../data/talents.registry.json';

/** Draft registry transcribed from existing app data. Not yet a complete audited Corebook registry. */
export interface AbilityRule {
  id: string;
  name: string;
  kind: 'technick' | 'talent';
  sourcebookId: string;
  prerequisiteText: string;
  description: string;
  repeatable: boolean;
  classId?: string;
  talentTreeId?: string;
}
export const abilityRegistry: readonly AbilityRule[] = [...technicks, ...talents] as AbilityRule[];

export interface EligibilityContext {
  slot: AbilitySlot;
  enabledSourcebooks: ReadonlySet<string>;
  acquired: readonly AbilityAcquisition[];
  /** Effective attribute scores at the slot's level, not today's scores. */
  attributesAtLevel?: Partial<Record<'str' | 'vit' | 'agi' | 'int' | 'mnd' | 'chr', number>>;
  trainedSkillsAtLevel?: readonly string[];
  /** All abilities held when this slot was earned, including class starting grants. */
  knownAbilitiesAtLevel?: readonly string[];
}
export interface EligibilityResult { eligible: boolean; reasons: string[]; unresolved: string[] }
const attributes: Record<string, 'str' | 'vit' | 'agi' | 'int' | 'mnd' | 'chr'> = {
  strength: 'str', vitality: 'vit', agility: 'agi', intelligence: 'int', mind: 'mnd', charisma: 'chr',
};
const normalize = (value: string) => value.trim().toLowerCase();

/** Fail closed when a prerequisite cannot be interpreted without guessing. */
export function evaluateAbilityEligibility(rule: AbilityRule, context: EligibilityContext): EligibilityResult {
  const reasons: string[] = [];
  const unresolved: string[] = [];
  const { slot } = context;
  if (rule.kind !== slot.kind) reasons.push('Selection slot has the wrong ability type');
  if (!context.enabledSourcebooks.has(rule.sourcebookId)) reasons.push(`Sourcebook ${rule.sourcebookId} is disabled`);
  if (rule.classId && normalize(rule.classId) !== normalize(slot.classId)) reasons.push(`Requires ${rule.classId} class`);
  if (slot.source === 'class-bonus-technick') {
    // Class-specific bonus lists are not fully normalized yet. Do not allow arbitrary general technicks.
    unresolved.push('Class Bonus Technick list has not yet been verified for this class');
  }
  if (!rule.repeatable && context.acquired.some(a => a.abilityId === rule.id || (a.kind === rule.kind && normalize(a.abilityName) === normalize(rule.name)))) {
    reasons.push('Already acquired');
  }
  const prereq = rule.prerequisiteText.trim();
  if (prereq && normalize(prereq) !== 'none') {
    // OR clauses are evaluated separately; comma-delimited terms within each clause are AND requirements.
    const branches = prereq.split(/\s+or\s+/i);
    const branchResults = branches.map(branch => {
      const missing: string[] = [];
      const unknown: string[] = [];
      for (const raw of branch.split(',')) {
        const term = raw.trim();
        if (!term) continue;
        const attribute = term.match(/^(Strength|Vitality|Agility|Intelligence|Mind|Charisma)\s+(\d+)$/i);
        const trained = term.match(/^Trained in (.+)$/i);
        const level = term.match(/^Level\s+(\d+)$/i);
        if (attribute) {
          const key = attributes[normalize(attribute[1])];
          const score = context.attributesAtLevel?.[key];
          if (score === undefined) unknown.push(`Attribute history unavailable: ${term}`);
          else if (score < Number(attribute[2])) missing.push(`Requires ${term}`);
        } else if (trained) {
          if (!context.trainedSkillsAtLevel) unknown.push(`Training history unavailable: ${term}`);
          else if (!context.trainedSkillsAtLevel.some(skill => normalize(skill) === normalize(trained[1]))) missing.push(`Requires ${term}`);
        } else if (level) {
          if (slot.characterLevel < Number(level[1])) missing.push(`Requires ${term}`);
        } else if (context.knownAbilitiesAtLevel?.some(name => normalize(name) === normalize(term))) {
          // Explicit ability prerequisite met.
        } else if (context.knownAbilitiesAtLevel) {
          missing.push(`Requires ${term}`);
        } else {
          unknown.push(`Ability history or unsupported prerequisite: ${term}`);
        }
      }
      return { missing, unknown };
    });
    if (!branchResults.some(result => !result.missing.length && !result.unknown.length)) {
      const best = [...branchResults].sort((a, b) => a.missing.length + a.unknown.length - b.missing.length - b.unknown.length)[0];
      reasons.push(...best.missing);
      unresolved.push(...best.unknown);
    }
  }
  return { eligible: reasons.length === 0 && unresolved.length === 0, reasons, unresolved };
}

export function availableAbilities(context: EligibilityContext) {
  return abilityRegistry.filter(rule => rule.kind === context.slot.kind).map(rule => ({
    rule,
    ...evaluateAbilityEligibility(rule, context),
  }));
}
