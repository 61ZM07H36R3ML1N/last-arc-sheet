import { useMemo, useState } from 'react';
import { CLASSES } from '../../data';
import { generateAbilitySlots } from '../../engine/abilityProgression';
import { reconcileCharacter } from '../../engine/characterReconciliation';
import { useCharacterStore } from '../../store/useCharacterStore';
import type { ClassLevelEvent } from '../../types/abilities';

interface Props { onClose: () => void }

export default function CharacterReconciliationWizard({ onClose }: Props) {
  const { sheet, atlasEnabled, reconcileHistory } = useCharacterStore();
  const progression = sheet.abilityProgression;
  const definitions = CLASSES.flat();
  const classes = sheet.classes.map(entry => {
    const definition = definitions.find(candidate => candidate.name.toLowerCase() === entry.name.toLowerCase());
    return { id: definition?.id ?? '', name: entry.name, level: entry.level };
  });
  const total = classes.reduce((sum, item) => sum + item.level, 0);
  const [classIds, setClassIds] = useState<string[]>(() =>
    progression?.levelHistory.length === total
      ? progression.levelHistory.map(event => event.classId)
      : Array.from({ length: total }, () => ''),
  );
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(false);
  const history = useMemo(() => {
    const counts = new Map<string, number>();
    return classIds.map((classId, index): ClassLevelEvent => {
      const classLevel = (counts.get(classId) ?? 0) + 1;
      counts.set(classId, classLevel);
      return { characterLevel: index + 1, classId, classLevel };
    });
  }, [classIds]);
  const completeHistory = classIds.every(Boolean) && classes.every(item => classIds.filter(id => id === item.id).length === item.level);
  const slots = useMemo(() => completeHistory ? generateAbilitySlots(history) : [], [completeHistory, history]);
  const legacy = progression?.acquisitions.filter(item => item.provenance === 'legacy-unknown') ?? [];
  const preview = useMemo(() => {
    if (!completeHistory || !progression) return null;
    try {
      return { result: reconcileCharacter(sheet, { classIds, assignments }, atlasEnabled), error: '' };
    } catch (err) {
      return { result: null, error: err instanceof Error ? err.message : 'Invalid reconciliation' };
    }
  }, [sheet, progression, completeHistory, classIds, assignments, atlasEnabled]);
  const unresolved = preview?.result?.acquisitions.filter(item => item.provenance === 'legacy-unknown').length ?? legacy.length;
  const save = () => {
    if (!progression || !confirmation) return;
    try {
      reconcileHistory(sheet.id, progression, { classIds, assignments });
      setError('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save reconciliation');
    }
  };
  return <div className="rounded border border-amber-500/40 bg-arc-card p-4 space-y-4 text-xs">
    <h3 className="text-base font-bold text-arc-gold">Reconcile character history</h3>
    <p className="text-slate-300">Confirm each level in chronological order. Nothing is changed until you save. Existing abilities are preserved, including those that cannot yet be assigned.</p>
    <div className="space-y-2">
      <h4 className="font-semibold">1. Class progression</h4>
      {classIds.map((id, index) => <label key={index} className="flex items-center gap-2">
        <span className="w-16">Level {index + 1}</span>
        <select aria-label={`Class at character level ${index + 1}`} className="flex-1 rounded border border-arc-border bg-arc-bg p-2" value={id}
          onChange={event => { setClassIds(previous => previous.map((value, i) => i === index ? event.target.value : value)); setConfirmation(false); }}>
          <option value="">Choose class…</option>
          {classes.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
      </label>)}
      {!completeHistory && <p className="text-amber-300">Choose exactly the current number of levels in each class.</p>}
    </div>
    {completeHistory && <div className="space-y-2">
      <h4 className="font-semibold">2. Existing abilities</h4>
      <p className="text-slate-400">Assign only when you know the original level and slot. Leave uncertain abilities unresolved. Unsupported or unverified prerequisites cannot be approved here.</p>
      {legacy.map(item => <label key={item.id} className="flex items-center gap-2">
        <span className="w-36 truncate" title={item.abilityName}>{item.abilityName}</span>
        <select aria-label={`Historical slot for ${item.abilityName}`} className="min-w-0 flex-1 rounded border border-arc-border bg-arc-bg p-2"
          value={assignments[item.id] ?? ''} onChange={event => { setAssignments(previous => ({ ...previous, [item.id]: event.target.value })); setConfirmation(false); }}>
          <option value="">Unresolved — preserve ability</option>
          {slots.filter(slot => slot.kind === item.kind).map(slot =>
            <option key={slot.id} value={slot.id}>Level {slot.characterLevel} · {slot.source}</option>)}
        </select>
      </label>)}
    </div>}
    {preview?.error && <p role="alert" className="text-rose-300">{preview.error}</p>}
    {preview?.result && <p role="status" className="text-amber-200">
      {unresolved === 0 ? 'All legacy abilities mapped; progression can unlock.' : `${unresolved} abilities remain unresolved; ability selection stays locked.`}
    </p>}
    <label className="flex gap-2 items-start"><input type="checkbox" checked={confirmation} onChange={event => setConfirmation(event.target.checked)} />
      <span>I confirm the level order and assigned acquisitions reflect known character history.</span></label>
    {error && <p role="alert" className="text-rose-300">{error}</p>}
    <div className="flex gap-2">
      <button type="button" onClick={save} disabled={!preview?.result || !confirmation} className="rounded bg-arc-accent px-3 py-2 font-bold text-black disabled:opacity-40">Save verified history</button>
      <button type="button" onClick={onClose} className="rounded border border-arc-border px-3 py-2">Cancel</button>
    </div>
  </div>;
}
