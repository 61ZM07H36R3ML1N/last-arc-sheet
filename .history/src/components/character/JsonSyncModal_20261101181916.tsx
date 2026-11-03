import React, { useState } from 'react';
import { X, Copy, Check, Upload, AlertCircle } from 'lucide-react';
import { useCharacterStore } from '../../store/useCharacterStore';
import type { CharacterSheet } from '../../types';

interface JsonSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JsonSyncModal({ isOpen, onClose }: JsonSyncModalProps) {
  const { sheet, importSheet } = useCharacterStore();
  const [jsonText, setJsonText] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(sheet, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    try {
      setError(null);
      const parsed = JSON.parse(jsonText) as CharacterSheet;
      if (!parsed.name || !parsed.classes || !parsed.baseAttributes) {
        throw new Error('Invalid sheet format. Missing name, classes, or attributes.');
      }
      importSheet(parsed);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to parse JSON string.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <div className="bg-arc-card border border-arc-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden text-xs text-slate-200">
        <div className="p-3.5 border-b border-arc-border flex items-center justify-between bg-arc-bg/50">
          <span className="font-bold text-slate-100 uppercase tracking-wide">Backup & Sync Character</span>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Export Current Character</span>
              <button
                onClick={handleCopy}
                className="text-arc-accent hover:underline flex items-center gap-1 font-semibold text-[11px]"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? 'Copied to Clipboard!' : 'Copy JSON'}
              </button>
            </div>
            <textarea
              readOnly
              value={JSON.stringify(sheet, null, 2)}
              rows={5}
              className="w-full bg-arc-bg border border-arc-border rounded p-2 font-mono text-[10px] text-slate-300 resize-none focus:outline-none"
            />
          </div>

          <div className="border-t border-arc-border pt-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Import from JSON (Paste Below)
            </span>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="Paste exported character JSON here..."
              rows={4}
              className="w-full bg-arc-bg border border-arc-border rounded p-2 font-mono text-[10px] text-slate-200 resize-none focus:outline-none focus:border-arc-accent"
            />

            {error && (
              <div className="mt-2 text-rose-400 flex items-center gap-1 text-[11px]">
                <AlertCircle size={12} /> {error}
              </div>
            )}
          </div>
        </div>

        <div className="p-3 border-t border-arc-border bg-arc-bg/80 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-arc-border text-slate-300 hover:bg-arc-card"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!jsonText.trim()}
            className="px-3.5 py-1.5 rounded bg-arc-accent text-slate-950 font-bold hover:brightness-110 disabled:opacity-40 flex items-center gap-1.5 shadow-md"
          >
            <Upload size={14} /> Import Sheet
          </button>
        </div>
      </div>
    </div>
  );
}