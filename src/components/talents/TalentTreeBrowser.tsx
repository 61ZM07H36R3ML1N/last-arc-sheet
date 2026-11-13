import { useMemo, useState } from 'react';
import type { AbilityAcquisition, AbilitySlot } from '../../types/abilities';
import { availableAbilities } from '../../engine/abilityEligibility';

interface Props {
  slot: AbilitySlot;
  acquired: readonly AbilityAcquisition[];
  enabledSourcebooks: ReadonlySet<string>;
  onSelect: (abilityId: string) => void;
  attributesAtLevel?: Partial<Record<'str'|'vit'|'agi'|'int'|'mnd'|'chr', number>>;
  trainedSkillsAtLevel?: readonly string[];
  knownAbilitiesAtLevel?: readonly string[];
}
export default function TalentTreeBrowser(props: Props) {
  const [tree, setTree] = useState('all');
  const choices = useMemo(() => availableAbilities({slot: props.slot, acquired: props.acquired,
    enabledSourcebooks: props.enabledSourcebooks, attributesAtLevel: props.attributesAtLevel,
    trainedSkillsAtLevel: props.trainedSkillsAtLevel, knownAbilitiesAtLevel: props.knownAbilitiesAtLevel,
  }), [props.slot, props.acquired, props.enabledSourcebooks, props.attributesAtLevel, props.trainedSkillsAtLevel, props.knownAbilitiesAtLevel]);
  const trees = [...new Set(choices.map(c => c.rule.talentTreeId).filter((v): v is string => Boolean(v)))];
  return <div className="space-y-3">
    <label className="block text-xs text-slate-300">Talent tree
      <select className="mt-1 w-full rounded border border-arc-border bg-arc-bg p-2" value={tree} onChange={e => setTree(e.target.value)}>
        <option value="all">All available trees</option>{trees.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
    </label>
    <div className="grid gap-2 sm:grid-cols-2">{choices.filter(c => tree === 'all' || c.rule.talentTreeId === tree).map(c => <div key={c.rule.id} className={`rounded border border-arc-border p-3 ${c.eligible ? '' : 'opacity-60'}`}>
      <p className="font-bold text-arc-gold">{c.rule.name}</p>
      <p className="text-[10px] text-slate-400">{c.rule.talentTreeId ?? 'Unassigned tree'} · {c.rule.sourcebookId}</p>
      <p className="mt-1 text-xs text-slate-300">{c.rule.description}</p>
      {c.rule.prerequisiteText !== 'None' && <p className="mt-1 text-xs text-amber-300">Requires: {c.rule.prerequisiteText}</p>}
      {[...c.reasons, ...c.unresolved].map((r,i) => <p key={i} className="text-[10px] text-rose-300">{r}</p>)}
      <button type="button" disabled={!c.eligible} onClick={() => props.onSelect(c.rule.id)} className="mt-2 rounded border border-arc-border px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40">Select Talent</button>
    </div>)}</div>
  </div>;
}
