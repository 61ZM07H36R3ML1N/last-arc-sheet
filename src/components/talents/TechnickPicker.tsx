import { useMemo, useState } from 'react';
import type { AbilityAcquisition, AbilitySlot } from '../../types/abilities';
import { availableAbilities } from '../../engine/abilityEligibility';
import { abilityRegistry } from '../../engine/abilityEligibility';

interface Props {
  slot: AbilitySlot;
  acquired: readonly AbilityAcquisition[];
  onSelect: (abilityId: string) => void;
  enabledSourcebooks: ReadonlySet<string>;
  attributesAtLevel?: Partial<Record<'str'|'vit'|'agi'|'int'|'mnd'|'chr', number>>;
  trainedSkillsAtLevel?: readonly string[];
  knownAbilitiesAtLevel?: readonly string[];
}
export default function TechnickPicker(props: Props) {
  const [selected, setSelected] = useState('');
  const choices = useMemo(() => availableAbilities({
    slot: props.slot, acquired: props.acquired, enabledSourcebooks: props.enabledSourcebooks,
    attributesAtLevel: props.attributesAtLevel, trainedSkillsAtLevel: props.trainedSkillsAtLevel,
    knownAbilitiesAtLevel: props.knownAbilitiesAtLevel,
  }), [props.slot, props.acquired, props.enabledSourcebooks, props.attributesAtLevel, props.trainedSkillsAtLevel, props.knownAbilitiesAtLevel]);
  const current = choices.find(c => c.rule.id === selected);
  return <div className="space-y-2">
    <label className="block text-xs font-semibold text-slate-200" htmlFor={`ability-${props.slot.id}`}>Choose {props.slot.kind === 'talent' ? 'Talent' : 'Technick'}</label>
    <select id={`ability-${props.slot.id}`} value={selected} onChange={e => setSelected(e.target.value)} className="w-full rounded border border-arc-border bg-arc-bg p-2 text-slate-100">
      <option value="">Select an available ability…</option>
      {choices.map(c => <option key={c.rule.id} value={c.rule.id} disabled={!c.eligible}>{c.rule.name}{c.eligible ? '' : ' — unavailable'}</option>)}
    </select>
    {current && <div className="rounded border border-arc-border p-2 text-xs text-slate-300">
      <p>{current.rule.description}</p>
      {current.rule.prerequisiteText && current.rule.prerequisiteText !== 'None' && <p className="mt-1 text-amber-300">Requires: {current.rule.prerequisiteText}</p>}
      {[...current.reasons, ...current.unresolved].map((reason,i) => <p key={i} className="text-rose-300">{reason}</p>)}
    </div>}
    <button type="button" disabled={!current?.eligible || !abilityRegistry.some(r => r.id === selected)} onClick={() => props.onSelect(selected)} className="rounded bg-arc-accent px-3 py-1.5 text-xs font-bold text-black disabled:opacity-40">Learn ability</button>
    <p className="text-[10px] text-slate-400">Unavailable options remain visible. Rules requiring historical data or unverified class lists cannot be selected yet.</p>
  </div>;
}
