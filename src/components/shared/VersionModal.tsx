import { X, GitCommit, CheckCircle2 } from 'lucide-react';

interface VersionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CHANGELOG = [
  {
    version: 'v0.3.2 (Current)',
    date: 'November 2026',
    changes: [
      'Added Foundry VTT Actor JSON interoperability engine (Two-way import/export).',
      'Added persistent Player Journal & Campaign Notes tab.',
      'Updated Break Gauge tracker to prevent race conditions during state reset.',
      'Integrated live Armor Check Penalty deductions against 27 system skills.'
    ]
  },
  {
    version: 'v0.3.1',
    date: 'October 2026',
    changes: [
      'Introduced complete Equipment & Bulk audit engine (Light, 1H, 2H, and Armor weights).',
      'Added dynamic character creator modal supporting racial caps and flexible attribute modifiers.',
      'Added JSON export and clipboard backup for offline table redundancy.'
    ]
  },
  {
    version: 'v0.3.0',
    date: 'Initial Release',
    changes: [
      'Core Rules Cyclopedia v.03 compliance (Defenses, Exploding Dice, Class Initiative).',
      'PWA standalone service worker configuration.'
    ]
  }
];

export default function VersionModal({ isOpen, onClose }: VersionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
      <div className="bg-arc-card border border-arc-border w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-xs text-slate-200">
        <div className="p-3.5 border-b border-arc-border flex items-center justify-between bg-arc-bg/50">
          <div className="flex items-center gap-1.5 font-bold text-slate-100 uppercase tracking-wide">
            <GitCommit size={15} className="text-arc-accent" />
            <span>App Version & Update Notes</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4">
          {CHANGELOG.map((log) => (
            <div key={log.version} className="p-3 bg-arc-bg rounded-lg border border-arc-border space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold text-arc-accent text-sm">{log.version}</span>
                <span className="text-[10px] text-slate-400 font-mono">{log.date}</span>
              </div>
              <ul className="space-y-1.5 text-slate-300">
                {log.changes.map((c, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[11px] leading-relaxed">
                    <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-arc-border bg-arc-bg/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-arc-card border border-arc-border hover:bg-arc-cardHover text-slate-300 font-semibold transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}