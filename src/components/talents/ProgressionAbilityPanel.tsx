import { useMemo, useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { getEnabledSourcebooks } from '../../data/sourcebooks';
import { generateAbilitySlots, validateLevelHistory } from '../../engine/abilityProgression';
import TechnickPicker from './TechnickPicker';
import TalentTreeBrowser from './TalentTreeBrowser';

/** Opt-in replacement panel: uses only complete, verifiable progression histories. */
export default function ProgressionAbilityPanel() {
  const { sheet, acquireAbility } = useCharacterStore();
    const [error, setError] = useState('');
  const progression = sheet.abilityProgression;
  const level = sheet.classes.reduce((sum, c) => sum + c.level, 0);
  const validHistory = Boolean(progression && progression.levelHistory.length === level && !validateLevelHistory(progression.levelHistory).length && !progression.needsReconciliation);
  const slots = useMemo(() => validHistory && progression ? generateAbilitySlots(progression.levelHistory) : [], [validHistory, progression]);
  const openSlots = slots.filter(s => !progression?.acquisitions.some(a => a.slotId === s.id));
  const enabledSourcebooks = useMemo(() => getEnabledSourcebooks(false), [atlasEnabled]);
  const selectAbility = (slotId: string, abilityId: string) => {
    try {
      acquireAbility(slotId, abilityId);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to acquire ability');
    }
  };
  return <section className="space-y-4 text-xs">
    <div className="rounded border border-arc-border bg-arc-card p-3">
      <h2 className="font-bold text-arc-gold">Technicks & Talents — progression preview</h2>
      <p className="mt-2 text-slate-400">Corebook selections use the same validation as the character store. Atlas content remains unavailable until campaign settings and GM approval are implemented.</p>
    </div>
    {!validHistory ? <div role="status" className="rounded border border-amber-500/40 p-3 text-amber-200">This character needs progression-history reconciliation before slot-based selection can be enabled. Existing abilities remain preserved. No acquisition levels will be guessed.</div> : null}
    {error && <p role="alert" className="text-rose-300">{error}</p>}
    {openSlots.map(slot => <div key={slot.id} className="rounded border border-arc-border bg-arc-card p-3">
      <p className="mb-2 font-semibold text-slate-200">Level {slot.characterLevel} · {slot.classId} {slot.classLevel} · {slot.source}</p>
      {slot.kind === 'technick' ? <TechnickPicker slot={slot} acquired={progression?.acquisitions ?? []} enabledSourcebooks={enabledSourcebooks} onSelect={id => selectAbility(slot.id,id)} /> :
        <TalentTreeBrowser slot={slot} acquired={progression?.acquisitions ?? []} enabledSourcebooks={enabledSourcebooks} onSelect={id => selectAbility(slot.id,id)} />}
    </div>)}
    <div className="rounded border border-arc-border p-3">
      <h3 className="font-semibold text-arc-gold">Acquisition ledger</h3>
      {(progression?.acquisitions ?? []).map(a => <p key={a.id} className="mt-1 text-slate-300">#{a.acquisitionOrder} {a.abilityName} · {a.characterLevel === null ? 'Legacy — level unknown' : `Level ${a.characterLevel}, ${a.classId} ${a.classLevel}`} · {a.source}</p>)}
    </div>
  </section>;
}
