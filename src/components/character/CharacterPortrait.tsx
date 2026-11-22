import { useEffect, useState, type ChangeEvent } from 'react';
import { getPortrait, putPortrait, removePortrait, processPortrait, notifyPortraitUpdated, PORTRAIT_UPDATED_EVENT } from '../../engine/portraitStorage';

interface Props {
  characterId: string;
  editable?: boolean;
}

/** Portraits are keyed by character ID and never uploaded to a server. */
export default function CharacterPortrait({ characterId, editable = false }: Props) {
  const [portrait, setPortrait] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    setPortrait(null);
    setError(null);
    const refresh = () => {
      getPortrait(characterId).then(value => {
        if (live) setPortrait(value);
      }).catch(() => {
        if (live) setError('Local portrait storage is unavailable.');
      });
    };
    const onUpdated = (event: Event) => {
      if ((event as CustomEvent<string>).detail === characterId) refresh();
    };
    window.addEventListener(PORTRAIT_UPDATED_EVENT, onUpdated);
    refresh();
    return () => {
      live = false;
      window.removeEventListener(PORTRAIT_UPDATED_EVENT, onUpdated);
    };
  }, [characterId]);

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const data = await processPortrait(file);
      await putPortrait(characterId, data);
      setPortrait(data);
      notifyPortraitUpdated(characterId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save portrait.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await removePortrait(characterId);
      setPortrait(null);
      notifyPortraitUpdated(characterId);
    } catch {
      setError('Unable to remove portrait.');
    } finally {
      setBusy(false);
    }
  };

  return <div className="space-y-2">
    <div className="w-28 h-36 overflow-hidden rounded-lg border border-cyan-500/70 bg-arc-bg flex items-center justify-center shadow-[0_0_0_1px_rgba(34,211,238,.12),0_0_18px_rgba(34,211,238,.08)]" aria-label="Character portrait">
      {portrait ? <img src={portrait} alt="Character portrait" className="w-full h-full object-cover" /> :
        <span className="text-xs text-slate-400 text-center px-2">No portrait</span>}
    </div>
    {editable && <div className="space-y-2">
      <label className="inline-block cursor-pointer rounded border border-arc-border px-2 py-1 text-xs text-arc-accent">
        {busy ? 'Saving…' : 'Upload portrait'}
        <input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={upload} />
      </label>
      {portrait && <button type="button" disabled={busy} onClick={remove} className="block text-xs text-rose-300">Remove portrait</button>}
      <p className="text-[11px] text-slate-400">PNG, JPEG, WebP · max 8 MB · stored on this device</p>
    </div>}
    {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}
  </div>;
}
