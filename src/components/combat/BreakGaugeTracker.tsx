import { AlertOctagon } from 'lucide-react';
import { getBreakState } from '../../engine/breakGauge';

interface Props {
  step: number;
  onChange: (step: number) => void;
}

const SEGMENTS = [
  { label: 'Normal', penalty: '0' },
  { label: 'Step 1', penalty: '-1' },
  { label: 'Step 2', penalty: '-2' },
  { label: 'Step 3', penalty: '-5' },
  { label: 'Step 4', penalty: '-10' },
  { label: 'Broken', penalty: '—' },
] as const;

export default function BreakGaugeTracker({ step, onChange }: Props) {
  const current = Number.isInteger(step) && step >= 0 && step <= 5 ? step : 0;
  const state = getBreakState(current);
  return (
    <section className="rounded-xl border border-arc-border bg-arc-card p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-100">
          <AlertOctagon size={18} className="text-amber-300" aria-hidden="true" />Break Gauge
        </h2>
        <span className="rounded-md border border-arc-border bg-arc-bg px-2 py-1 text-xs font-semibold" aria-live="polite">
          Status: {SEGMENTS[current].label}
        </span>
      </div>
      <div role="group" aria-label="Choose Break Gauge step" className="grid grid-cols-6 gap-1 sm:gap-2">
        {SEGMENTS.map((segment, index) => (
          <button key={segment.label} type="button" onClick={() => onChange(index)}
            aria-pressed={index === current}
            aria-label={`${segment.label}, ${index === 5 ? 'incapacitated' : `penalty ${segment.penalty}`}`}
            className={`min-h-14 min-w-0 rounded-md border px-0.5 py-2 text-center focus-visible:outline-2 focus-visible:outline-cyan-300 ${index === current ? 'border-emerald-300 bg-emerald-700 text-white' : 'border-slate-500 bg-[#0b1628] text-slate-200 hover:border-cyan-300'}`}>
            <span className="block text-xs font-bold sm:text-sm">{segment.penalty}</span>
            <span className="mt-1 block text-[9px] leading-tight sm:text-xs">{segment.label}</span>
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-200" aria-live="polite">
        {state.canAct ? (state.penalty === 0 ? 'No Break penalty' : `Break penalty: ${state.penalty}`) : 'Broken — cannot act'}
      </p>
    </section>
  );
}
