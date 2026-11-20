import { Heart, Sparkles } from 'lucide-react';

interface Props {
  kind: 'hp' | 'mp';
  current: number;
  max: number;
  onChange: (delta: number) => void;
}

export default function ResourceBar({ kind, current, max, onChange }: Props) {
  const hp = kind === 'hp';
  const label = hp ? 'Hit Points' : 'Mana Points';
  const Icon = hp ? Heart : Sparkles;
  const steps = hp ? [-10, -1, 1, 10] : [-5, -1, 1, 5];
  const percentage = max > 0 ? Math.max(0, Math.min(100, current / max * 100)) : 0;
  return (
    <section className="rounded-xl border border-arc-border bg-arc-card p-4 shadow-lg">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className={`flex items-center gap-2 text-sm font-bold ${hp ? 'text-rose-300' : 'text-cyan-300'}`}>
          <Icon size={19} aria-hidden="true" />{label}
        </h2>
        <span className="font-mono text-lg font-semibold tabular-nums">
          {current} <span className="text-slate-300">/ {max}</span>
        </span>
      </div>
      <div role="progressbar" aria-label={label} aria-valuemin={0}
        aria-valuemax={Math.max(0, max)} aria-valuenow={Math.max(0, Math.min(max, current))}
        className="h-3.5 overflow-hidden rounded-full border border-slate-600/60 bg-slate-950">
        <div style={{ width: `${percentage}%` }}
          className={`h-full rounded-full bg-gradient-to-r transition-[width] duration-200 ${hp ? 'from-rose-600 to-rose-400' : 'from-cyan-600 to-cyan-300'}`} />
      </div>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {steps.map(delta => (
          <button key={delta} type="button" onClick={() => onChange(delta)}
            aria-label={`${delta < 0 ? 'Decrease' : 'Increase'} ${label} by ${Math.abs(delta)}`}
            className={`min-h-11 rounded-lg border border-arc-border bg-arc-bg text-sm font-semibold hover:border-arc-accent focus-visible:outline-2 focus-visible:outline-cyan-300 ${delta > 0 ? 'text-emerald-300' : 'text-slate-100'}`}>
            {delta > 0 ? `+${delta}` : delta}
          </button>
        ))}
      </div>
    </section>
  );
}
