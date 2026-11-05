import { useState, useMemo } from 'react';
import { Search, ShieldAlert, Award, Star } from 'lucide-react';
import { SKILLS, ARMORS } from '../../data';
import { useCharacterStore } from '../../store/useCharacterStore';
import { getModifier, getTotalLevel } from '../../engine/formulas';
import type { AttributeKey } from '../../types';

interface SkillTableProps {
  onRoll: (sides: number, label: string, explodes?: boolean) => void;
}

export default function SkillTable({ onRoll }: SkillTableProps) {
  const { sheet } = useCharacterStore();
  const [search, setSearch] = useState('');
  const [filterAttr, setFilterAttr] = useState<string>('all');

  const totalLevel = useMemo(() => getTotalLevel(sheet), [sheet]);

  const armorPenalty = useMemo(() => {
    if (!sheet.equipped.armor?.id) return 0;
    const foundArmor = ARMORS.find((a) => a.id === sheet.equipped.armor?.id);
    return foundArmor?.checkPenalty || 0;
  }, [sheet.equipped.armor]);

  const filteredSkills = useMemo(() => {
    return SKILLS.filter((s) => {
      const matchesSearch = (s.name ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesAttr = filterAttr === 'all' || s.attribute === filterAttr;
      return matchesSearch && matchesAttr;
    });
  }, [search, filterAttr]);

  return (
    <div className="space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-arc-card p-2.5 rounded-lg border border-arc-border">
        <div className="relative flex-1 min-w-35">
          <Search size={14} className="absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search skills..."
            className="w-full bg-arc-bg border border-arc-border rounded pl-8 pr-2 py-1 text-slate-200 focus:outline-none focus:border-arc-accent text-xs"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto">
          {['all', 'str', 'vit', 'agi', 'int', 'mnd', 'chr'].map((attr) => (
            <button
              key={attr}
              onClick={() => setFilterAttr(attr)}
              className={`px-2 py-1 rounded uppercase font-semibold text-[10px] transition-all ${
                filterAttr === attr
                  ? 'bg-arc-accent text-slate-950 font-bold'
                  : 'bg-arc-bg text-slate-400 hover:text-slate-200 border border-arc-border'
              }`}
            >
              {attr}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filteredSkills.map((skill) => {
          const isTrained = sheet.trainedSkills.some(
            (ts) => skill.name != null && ts.toLowerCase() === skill.name.toLowerCase()
          );
          const isFocused = skill.name != null && (sheet.focusedSkills?.includes(skill.name) ?? false);
          const attrMod = getModifier(sheet.baseAttributes[skill.attribute as AttributeKey]);
          const baseLvlBonus = Math.floor(totalLevel / 2);

          let penalty = 0;
          if (skill.armorPenalty && armorPenalty < 0) {
            penalty = armorPenalty;
          }

          const totalMod =
            baseLvlBonus +
            attrMod +
            (isTrained ? 5 : 0) +
            (isFocused ? 5 : 0) +
            penalty;

          return (
            <div
              key={skill.name}
              className={`p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                isTrained
                  ? 'bg-arc-card border-slate-700 hover:border-arc-accent'
                  : 'bg-arc-bg border-arc-border opacity-85 hover:border-slate-600'
              }`}
            >
              <div className="flex flex-col min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-200 truncate">{skill.name}</span>
                  <span className="text-[10px] font-mono uppercase text-slate-400">
                    ({skill.attribute})
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {isTrained && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-semibold flex items-center gap-0.5">
                      <Award size={10} /> Trained (+5)
                    </span>
                  )}
                  {isFocused && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-0.5">
                      <Star size={10} /> Focused (+5)
                    </span>
                  )}
                  {skill.armorPenalty && penalty < 0 && (
                    <span
                      title={`Armor Check Penalty: ${penalty}`}
                      className="text-[9px] px-1 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-0.5"
                    >
                      <ShieldAlert size={10} /> {penalty}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() =>
                  onRoll(
                    20,
                    `${skill.name} Check (${totalMod >= 0 ? `+${totalMod}` : totalMod})`,
                    false
                  )
                }
                className="px-2.5 py-1 bg-arc-bg hover:bg-arc-cardHover border border-arc-border hover:border-arc-accent rounded font-mono font-bold text-arc-accent transition-all text-xs shadow-sm"
              >
                {totalMod >= 0 ? `+${totalMod}` : totalMod}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}