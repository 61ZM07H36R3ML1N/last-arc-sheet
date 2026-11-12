import { useMemo, useState } from 'react';
import { CLASSES } from '../../data';
import type { CharacterSheet } from '../../types';
import { advanceCharacter, type AdvancementResult, type AdvancementChoices } from '../../engine/characterProgression';

export interface CharacterAdvancementModalProps {
  sheet: CharacterSheet;
  open: boolean;
  onClose: () => void;
  /** Commit choices against the latest store state. */
  onConfirm: (characterId: string, expectedLevel: number, choices: AdvancementChoices) => void | Promise<void>;
}

/** The progression engine is the sole authority for eligibility and resource gains. */
export function CharacterAdvancementModal({
  sheet, open, onClose, onConfirm,
}: CharacterAdvancementModalProps) {
  const [classId, setClassId] = useState('');
  const [gmApproved, setGmApproved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const classes = useMemo(() => CLASSES.flat(), []);
  const totalLevel = sheet.classes.reduce((sum, entry) => sum + entry.level, 0);
  const selected = classes.find((entry) => entry.id === classId);
  const isNewAdvanced = selected?.type === 'advanced' &&
    !sheet.classes.some((entry) => entry.name === selected.name);

  // A preview never mutates or persists the sheet. Any failure is displayed inline.
  const preview = useMemo(() => {
    if (!classId) return { result: null as AdvancementResult | null, error: null as string | null };
    try {
      return { result: advanceCharacter(sheet, { classId, gmApproved }), error: null };
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : 'Cannot advance this class.' };
    }
  }, [sheet, classId, gmApproved]);

  if (!open) return null;

  async function confirm() {
    if (!preview.result || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      await onConfirm(sheet.id, totalLevel, { classId, gmApproved });
      setClassId('');
      setGmApproved(false);
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save advancement.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation">
      <section role="dialog" aria-modal="true" aria-labelledby="advancement-title"
        className="w-full max-w-xl rounded-xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="advancement-title" className="text-xl font-bold">Advance Character</h2>
            <p className="mt-1 text-sm text-slate-300">{sheet.name} · Character level {totalLevel}</p>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close advancement"
            className="rounded px-2 py-1 text-slate-300 hover:bg-slate-800 disabled:opacity-50">✕</button>
        </div>

        <div className="mb-5">
          <h3 className="mb-2 text-sm font-semibold">Current classes</h3>
          <ul className="flex flex-wrap gap-2">
            {sheet.classes.map((entry) => (
              <li key={entry.name} className="rounded-md bg-slate-800 px-3 py-1 text-sm">
                {entry.name} {entry.level}
              </li>
            ))}
          </ul>
        </div>

        <label htmlFor="advancement-class" className="mb-2 block text-sm font-semibold">
          Class to advance
        </label>
        <select id="advancement-class" value={classId} disabled={saving}
          onChange={(event) => { setClassId(event.target.value); setGmApproved(false); setSaveError(null); }}
          className="w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-slate-100">
          <option value="">Choose a class…</option>
          <optgroup label="Base Classes">
            {classes.filter((entry) => entry.type !== 'advanced').map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.name}</option>
            ))}
          </optgroup>
          <optgroup label="Advanced Classes">
            {classes.filter((entry) => entry.type === 'advanced').map((entry) => (
              <option key={entry.id} value={entry.id}>{entry.name}</option>
            ))}
          </optgroup>
        </select>

        {isNewAdvanced && (
          <label className="mt-4 flex items-start gap-2 text-sm">
            <input type="checkbox" checked={gmApproved} disabled={saving}
              onChange={(event) => setGmApproved(event.target.checked)} className="mt-1" />
            <span>GM has confirmed any campaign-specific entry requirements.
              <span className="block text-xs text-slate-400">Only check this after obtaining GM approval.</span>
            </span>
          </label>
        )}

        {preview.error && (
          <p role="alert" className="mt-4 rounded-md border border-amber-700 bg-amber-950/40 p-3 text-sm text-amber-200">
            {preview.error}
          </p>
        )}
        {preview.result && (
          <div aria-label="Advancement preview" className="mt-4 rounded-lg border border-slate-700 bg-slate-800/70 p-4">
            <h3 className="mb-2 font-semibold">Advancement preview</h3>
            <p>Character level: {preview.result.previousLevel} → {preview.result.newLevel}</p>
            <p>{preview.result.className} level: {preview.result.classLevel}</p>
            <p>HP gained: +{preview.result.hpGained}</p>
            <p>MP gained: +{preview.result.mpGained}</p>
            <p className="mt-2 text-xs text-slate-400">Skill, talent, and Technick selections are not awarded automatically.</p>
          </div>
        )}
        {saveError && <p role="alert" className="mt-3 text-sm text-red-300">{saveError}</p>}

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" disabled={saving} onClick={onClose}
            className="rounded-md border border-slate-600 px-4 py-2 hover:bg-slate-800 disabled:opacity-50">Cancel</button>
          <button type="button" disabled={!preview.result || saving} onClick={() => void confirm()}
            className="rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-40">
            {saving ? 'Saving…' : 'Confirm Advancement'}
          </button>
        </div>
      </section>
    </div>
  );
}

export default CharacterAdvancementModal;
