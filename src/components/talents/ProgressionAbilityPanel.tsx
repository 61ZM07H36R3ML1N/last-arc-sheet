import { useMemo, useState } from 'react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { generateAbilitySlots, validateLevelHistory } from '../../engine/abilityProgression';
import { acquireAbility } from '../../engine/abilitySelection';
import { abilityRegistry } from '../../engine/abilityEligibility';
import TechnickPicker from './TechnickPicker';
import TalentTreeBrowser from './TalentTreeBrowser';

/** Opt-in replacement panel: uses only complete, verifiable progression histories. */
export default function ProgressionAbilityPanel() {
  const { sheet, importSheet } = useCharacterStore();
  const [atlasEnabled, setAtlasEnabled] = useState(false);
  const [error, setError] = useState('');
  const progression = sheet.abilityProgression;
  const level = sheet.classes.reduce((sum, c) => sum + c.level, 0);
  const validHistory = Boolean(progression && progression.levelHistory.length === level && !validateLevelHistory(progression.levelHistory).length && !progression.needsReconciliation);
  const slots = useMemo(() => validHistory && progression ? generateAbilitySlots(progression.levelHistory) : [], [validHistory, progression]);
  const openSlots = slots.filter(s => !progression?.acquisitions.some(a => a.slotId === s.id));
  const enabledSourcebooks = useMemo(() => new Set(atlasEnabled ? ['core-v04', 'atlas-dtr-v03'] : ['core-v04']), [atlasEnabled]);
  const selectAbility = (slotId: string, abilityId: string) => {
    const slot = openSlots.find(s => s.id === slotId);
    const rule = abilityRegistry.find(r => r.id === abilityId);
    if (!slot || !rule || !progression) return;
    try {
      // Historical attribute/skill values are deliberately not inferred from current sheet values.
      const acquisitions = acquireAbility(slot, rule, {
        slot, acquired: progression.acquisitions, enabledSourcebooks,
        knownAbilitiesAtLevel: progression.acquisitions.filter(a => a.characterLevel !== null && a.characterLevel < slot.characterLevel).map(a => a.abilityName),
      });
      importSheet({ ...sheet, technicks: rule.kind === 'technick' ? [...sheet.technicks, rule.name] : sheet.technicks,
        talents: rule.kind === 'talent' ? [...sheet.talents, rule.name] : sheet.talents,
        abilityProgression: { ...progression, acquisitions } });
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to acquire ability'); }
  };
  return <section className="space-y-4 text-xs">
    <div className="rounded border border-arc-border bg-arc-card p-3">
      <h2 className="font-bold text-arc-gold">Technicks & Talents — progression preview</h2>
      <label className="mt-2 flex items-center gap-2"><input type="checkbox" checked={atlasEnabled} onChange={e => setAtlasEnabled(e.target.checked)} /> Enable Atlas DTR v.03 (GM approval)</label>
      <p className="mt-2 text-slate-400">Corebook rules are always enabled. Atlas selection is local to this preview until campaign settings are implemented.</p>
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
