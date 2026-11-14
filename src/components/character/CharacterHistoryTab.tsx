import { useState } from 'react';
import { History, ShieldCheck } from 'lucide-react';
import { useCharacterStore } from '../../store/useCharacterStore';
import { validateLevelHistory } from '../../engine/abilityProgression';
import CharacterReconciliationWizard from '../talents/CharacterReconciliationWizard';

export default function CharacterHistoryTab() {
  const sheet = useCharacterStore(state => state.sheet);
  const [editing, setEditing] = useState(false);
  const progression = sheet.abilityProgression;
  const total = sheet.classes.reduce((sum, entry) => sum + entry.level, 0);
  const valid = Boolean(
    progression &&
    !progression.needsReconciliation &&
    progression.levelHistory.length === total &&
    validateLevelHistory(progression.levelHistory).length === 0,
  );
  const unresolved = progression?.acquisitions.filter(item => item.provenance === 'legacy-unknown').length ?? 0;

  return <section className="space-y-4 text-xs">
    <header className="rounded-lg border border-arc-border bg-arc-card p-4">
      <h2 className="flex items-center gap-2 font-bold uppercase tracking-wide text-slate-100">
        <History size={16} className="text-arc-gold" /> Character History
      </h2>
      <p className="mt-2 text-slate-400">Review your class progression and reconcile imported abilities without changing your character until you confirm.</p>
      <p role="status" className={`mt-3 font-semibold ${valid ? 'text-emerald-400' : 'text-amber-300'}`}>
        {valid ? 'Progression history recorded' : 'Progression history needs reconciliation'}
        {unresolved > 0 ? ` · ${unresolved} unresolved abilities` : ''}
      </p>
    </header>

    <div className="rounded-lg border border-arc-border bg-arc-card p-4">
      <h3 className="flex items-center gap-2 font-semibold text-arc-gold">
        <ShieldCheck size={14} /> Recorded class levels
      </h3>
      {progression?.levelHistory.length ? (
        <ol className="mt-3 space-y-1 text-slate-300">
          {progression.levelHistory.map(event =>
            <li key={event.characterLevel}>Character level {event.characterLevel}: {event.classId} {event.classLevel}</li>,
          )}
        </ol>
      ) : <p className="mt-2 text-slate-400">No verified level-by-level history is available yet.</p>}
    </div>

    {!valid && !editing && <div className="rounded-lg border border-amber-500/40 p-4">
      <p className="text-amber-200">Existing abilities are preserved. Historical acquisition levels will never be guessed.</p>
      <button type="button" onClick={() => setEditing(true)}
        className="mt-3 rounded border border-amber-500/50 px-3 py-2 font-semibold text-amber-200">
        Reconcile character history
      </button>
    </div>}
    {!valid && editing && <CharacterReconciliationWizard key={sheet.id} onClose={() => setEditing(false)} />}
    {valid && <p className="text-slate-400">Your recorded progression is available to the Talents & Technicks selection system.</p>}
  </section>;
}
