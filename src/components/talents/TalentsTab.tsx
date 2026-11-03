/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import { Zap, Plus, Trash2 } from 'lucide-react';
import { useCharacterStore } from '../../store/useCharacterStore';

const ALL_TECHNICKS = [
  { name: 'Power Attack', prereq: 'Strength 13', description: 'Spend 2 minor actions in the same turn to deal +1 damage die on all melee attacks.' },
  { name: 'Mighty Strikes', prereq: 'Strength 13', description: 'Take -1 on melee attacks to gain +1 damage (+2 for 2-handed weapons). Scales every 4 levels.' },
  { name: 'Rapid Strike', prereq: 'Agility 13', description: 'Take -2 penalty to melee attack roll to deal +1 die of damage.' },
  { name: 'Cleave', prereq: 'Mighty Strikes, Strength 13', description: 'As an all-out action, make a single melee attack against a target and any targets adjacent to both.' },
  { name: 'Whirlwind Attack', prereq: 'Cleave, Mighty Strikes, Strength 15', description: 'When using Cleave, hit all creatures adjacent to you (or 2 squares away with reach).' },
  { name: 'Dodge', prereq: 'Agility 13', description: 'Once per turn as a reaction, make an Acrobatics check to avoid an attack that beat your Reflex.' },
  { name: 'Dodge Roll', prereq: 'Agility 13, Dodge', description: 'Whenever you successfully dodge an attack, immediately move 1 square without provoking counterattacks.' },
  { name: 'Dual Wield I', prereq: 'Agility 15', description: 'Reduces the two-weapon attack penalty from -10 to -5.' },
  { name: 'Dual Wield II', prereq: 'Agility 17, Level 6, Dual Wield I', description: 'Reduces the two-weapon attack penalty from -5 to -2.' },
  { name: 'Dual Wield III', prereq: 'Agility 19, Level 11, Dual Wield II', description: 'Take no penalty when attacking with 2 weapons.' },
  { name: 'Precise Shot', prereq: 'None', description: 'Make ranged attacks into melee without suffering the standard -5 penalty.' },
  { name: 'Rapid Shot', prereq: 'Strength 13 or Agility 13', description: 'Take -2 on ranged attacks to deal +1 die of damage (uses 2 ammo).' },
  { name: 'Shield Bash', prereq: 'Shield Proficiency', description: 'Make counterattacks with your shield (Tiny 1d4, Small 1d6, Med 1d8, Large 1d10).' },
  { name: 'Threshold Up', prereq: 'None', description: 'Gain +5 bonus to your Break Threshold.' },
  { name: 'Channel', prereq: 'Trained in Spellcraft', description: 'Once per day when <= 1/2 MP, spend a minor action to restore MP equal to Mind score or 1/4 max MP.' },
  { name: 'Arcane Study', prereq: 'Trained in Spellcraft', description: 'Learn a number of spells equal to 1 + Int modifier from scrolls.' },
  { name: 'Bardic Study', prereq: 'Trained in Perform', description: 'Learn a number of performances equal to 1 + Int modifier from scores.' }
];

export default function TalentsTab() {
  const { sheet, importSheet } = useCharacterStore();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const addTechnick = (techName: string) => {
    if (!sheet.technicks.includes(techName)) {
      importSheet({
        ...sheet,
        technicks: [...sheet.technicks, techName]
      });
    }
    setIsPickerOpen(false);
  };

  const removeTechnick = (techName: string) => {
    importSheet({
      ...sheet,
      technicks: sheet.technicks.filter((t) => t !== techName)
    });
  };

  const removeTalent = (talentName: string) => {
    importSheet({
      ...sheet,
      talents: sheet.talents.filter((t) => t !== talentName)
    });
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="flex items-center justify-between bg-arc-card p-3 rounded-lg border border-arc-border">
        <div>
          <span className="font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wide">
            <Zap size={14} className="text-arc-gold" /> Talents & Technicks
          </span>
          <span className="text-[10px] text-slate-400">Class abilities and general combat technicks</span>
        </div>
        <button
          onClick={() => setIsPickerOpen(true)}
          className="px-2.5 py-1 bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded text-arc-accent font-semibold flex items-center gap-1 transition-all"
        >
          <Plus size={13} /> Add Technick
        </button>
      </div>

      <div className="space-y-2">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Class Talents
        </span>
        {sheet.talents.length > 0 ? (
          <div className="space-y-2">
            {sheet.talents.map((talent) => (
              <div
                key={talent}
                className="p-3 bg-arc-card rounded-lg border border-arc-border flex items-start justify-between gap-2"
              >
                <div>
                  <span className="font-bold text-arc-gold">{talent}</span>
                  <p className="text-slate-400 mt-0.5 text-[11px]">
                    Class-specific active or passive feature from your base class talent tree.
                  </p>
                </div>
                <button
                  onClick={() => removeTalent(talent)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                  title="Remove Talent"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-3 bg-arc-card rounded-lg border border-arc-border text-slate-400 italic">
            No class talents selected yet. Use the Character Editor to assign starting talents.
          </div>
        )}
      </div>

      <div className="space-y-2">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Technicks ({sheet.technicks.length})
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sheet.technicks.map((tech) => {
            const definition = ALL_TECHNICKS.find((t) => t.name === tech);

            return (
              <div
                key={tech}
                className="p-2.5 bg-arc-card rounded-lg border border-arc-border flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100">{tech}</span>
                    <button
                      onClick={() => removeTechnick(tech)}
                      className="text-slate-500 hover:text-rose-400 p-0.5"
                      title="Remove Technick"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  {definition?.prereq && definition.prereq !== 'None' && (
                    <span className="text-[9px] text-amber-400 font-mono">
                      Req: {definition.prereq}
                    </span>
                  )}
                  <p className="text-slate-400 mt-1 text-[11px] leading-snug">
                    {definition?.description || 'Active/passive combat technick.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isPickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm">
          <div className="bg-arc-card border border-arc-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-3.5 border-b border-arc-border flex justify-between items-center bg-arc-bg/50">
              <span className="font-bold text-slate-100 uppercase tracking-wide">
                Select a Technick to Learn
              </span>
              <button
                onClick={() => setIsPickerOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 overflow-y-auto space-y-2">
              {ALL_TECHNICKS.map((t) => {
                const alreadyHas = sheet.technicks.includes(t.name);
                return (
                  <button
                    key={t.name}
                    disabled={alreadyHas}
                    onClick={() => addTechnick(t.name)}
                    className={`w-full text-left p-2.5 rounded border transition-all ${
                      alreadyHas
                        ? 'opacity-40 bg-arc-bg border-transparent cursor-not-allowed'
                        : 'bg-arc-bg hover:bg-arc-cardHover border-arc-border hover:border-arc-accent'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-100">{t.name}</span>
                      {alreadyHas ? (
                        <span className="text-[9px] text-slate-500 uppercase font-bold">Acquired</span>
                      ) : (
                        <span className="text-[9px] text-amber-400 font-mono">Req: {t.prereq}</span>
                      )}
                    </div>
                    <p className="text-slate-400 text-[11px] mt-0.5">{t.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}