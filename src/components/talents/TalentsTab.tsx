import { Zap, LockKeyhole } from 'lucide-react';

import { useCharacterStore } from '../../store/useCharacterStore';
import ProgressionAbilityPanel from './ProgressionAbilityPanel';

import technicksRegistry from '../../data/technicks.registry.json';

interface TechnickDefinition {
  name: string;
  prereq?: string;
  description?: string;
}

const technickDefinitions = (
  Array.isArray(technicksRegistry)
    ? technicksRegistry
    : []
) as TechnickDefinition[];

export default function TalentsTab() {
  const sheet = useCharacterStore((state) => state.sheet);

  const getTechnickDefinition = (name: string) =>
    technickDefinitions.find(
      (technick) => technick.name === name
    );

  return (
    <div className="space-y-5 text-xs">
      {/* Page heading */}
      <header className="flex items-center justify-between rounded-lg border border-arc-border bg-arc-card p-3">
        <div>
          <h2 className="flex items-center gap-1.5 font-bold uppercase tracking-wide text-slate-100">
            <Zap size={14} className="text-arc-gold" />
            Talents &amp; Technicks
          </h2>

          <p className="mt-1 text-[10px] text-slate-400">
            Class abilities, general Technicks, and character progression
          </p>
        </div>

        <span className="rounded border border-arc-border bg-arc-bg px-2 py-1 text-[9px] font-semibold uppercase text-arc-gold">
          v0.5 Preview
        </span>
      </header>

      {/* Rules-aware progression interface */}
      <section
        aria-label="Ability Progression"
        className="space-y-3"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-arc-gold">
            Ability Progression
          </h3>

          <span className="text-[9px] uppercase text-slate-500">
            Rules-Aware Selection
          </span>
        </div>

        <ProgressionAbilityPanel />
      </section>

      {/* Existing abilities: read-only during migration */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Acquired Abilities
          </h3>

          <span className="flex items-center gap-1 text-[9px] text-slate-500">
            <LockKeyhole size={11} />
            Legacy Editor Locked
          </span>
        </div>

        <p className="text-[11px] leading-relaxed text-slate-400">
          Existing abilities are displayed below for compatibility.
          Use the progression interface above to manage new
          acquisitions. Legacy editing is temporarily disabled
          while the progression ledger is being integrated.
        </p>

        {/* Class Talents */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Class Talents ({sheet.talents.length})
          </h4>

          {sheet.talents.length > 0 ? (
            <div className="space-y-2">
              {sheet.talents.map((talent, index) => (
                <div
                  key={`${talent}-${index}`}
                  className="rounded-lg border border-arc-border bg-arc-card p-3"
                >
                  <span className="font-bold text-arc-gold">
                    {talent}
                  </span>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Class-specific active or passive feature
                    from your character's Talent tree.
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-arc-border bg-arc-card p-3 italic text-slate-400">
              No class Talents recorded.
            </div>
          )}
        </div>

        {/* Technicks */}
        <div className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Technicks ({sheet.technicks.length})
          </h4>

          {sheet.technicks.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {sheet.technicks.map((technick, index) => {
                const definition =
                  getTechnickDefinition(technick);

                return (
                  <div
                    key={`${technick}-${index}`}
                    className="flex flex-col rounded-lg border border-arc-border bg-arc-card p-2.5"
                  >
                    <span className="font-bold text-slate-100">
                      {technick}
                    </span>

                    {definition?.prereq &&
                      definition.prereq !== 'None' && (
                        <span className="mt-1 text-[9px] font-mono text-amber-400">
                          Req: {definition.prereq}
                        </span>
                      )}

                    <p className="mt-1 text-[11px] leading-snug text-slate-400">
                      {definition?.description ??
                        'Active or passive combat Technick.'}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-arc-border bg-arc-card p-3 italic text-slate-400">
              No Technicks recorded.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}