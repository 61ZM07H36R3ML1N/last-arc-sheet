import React, { useState, useMemo, useCallback } from 'react';
import { 
  Heart, 
  Sparkles, 
  Zap, 
  Dice5, 
  RefreshCw, 
  Swords, 
  BookOpen, 
  AlertOctagon,
  UserCheck,
  Share2
} from 'lucide-react';
import { useCharacterStore } from './store/useCharacterStore';
import { getModifier, getTotalLevel, calculateDefenses, rollExplodingDie } from './engine/formulas';
import CharacterEditorModal from './components/character/CharacterEditorModal';
import JsonSyncModal from './components/character/JsonSyncModal';
import GearManager from './components/equipment/GearManager';
import type { AttributeKey } from './types/index';

export default function App() {
  const { 
    sheet, 
    updateHp, 
    updateMp, 
    setBreakStep, 
    useHeroPoint, 
    resetHeroPoints 
  } = useCharacterStore();

  const [activeTab, setActiveTab] = useState<'combat' | 'skills' | 'equipment' | 'talents'>('combat');
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isSyncOpen, setIsSyncOpen] = useState<boolean>(false);
  const [diceLog, setDiceLog] = useState<{ label: string; rolls: number[]; total: number; exploded: boolean }[]>([]);

  // Memoized calculations (Pure during render)
  const totalLevel = useMemo(() => getTotalLevel(sheet), [sheet]);
  const defenses = useMemo(() => calculateDefenses(sheet), [sheet]);
  const primaryClass = sheet.classes[0]?.name || 'Warrior';

  const vitMod = useMemo(() => getModifier(sheet.baseAttributes.vit), [sheet.baseAttributes.vit]);
  const mndMod = useMemo(() => getModifier(sheet.baseAttributes.mnd), [sheet.baseAttributes.mnd]);

  const { maxHp, maxMp } = useMemo(() => {
    let hp = 0;
    let mp = 0;

    sheet.classes.forEach((c, idx) => {
      const isBase = idx === 0;
      if (['Warrior', 'Ranger'].includes(c.name)) {
        hp += (isBase ? 30 : 6) + vitMod + (c.level - 1) * (6 + vitMod);
        mp += (isBase ? 6 : 2) + mndMod + (c.level - 1) * (2 + mndMod);
      } else if (['Bard', 'Rogue'].includes(c.name)) {
        hp += (isBase ? 24 : 5) + vitMod + (c.level - 1) * (5 + vitMod);
        mp += (isBase ? 6 : 2) + mndMod + (c.level - 1) * (2 + mndMod);
      } else {
        // Mage / Initiate
        hp += (isBase ? 18 : 4) + vitMod + (c.level - 1) * (4 + vitMod);
        mp += (isBase ? 12 : 3) + mndMod + (c.level - 1) * (3 + mndMod);
      }
    });

    return { maxHp: Math.max(1, hp), maxMp: Math.max(0, mp) };
  }, [sheet.classes, vitMod, mndMod]);

  // Stable roll handler keeping random execution outside React render loops
  const handleRoll = useCallback((sides: number, label: string, explodes = false) => {
    let rolls: number[] = [];
    let total = 0;
    let wasExploded = false;

    if (explodes) {
      const res = rollExplodingDie(sides);
      rolls = res.rolls;
      total = res.total;
      wasExploded = res.rolls.length > 1;
    } else {
      const roll = Math.floor(Math.random() * sides) + 1;
      rolls = [roll];
      total = roll;
    }

    const newEntry = {
      label: explodes ? `${label} (Exploding)` : label,
      rolls,
      total,
      exploded: wasExploded
    };

    setDiceLog((prev) => [newEntry, ...prev.slice(0, 9)]);
  }, []);

  const getInitDie = (className: string) => {
    switch (className) {
      case 'Rogue': return 'd4';
      case 'Bard': return 'd6';
      case 'Ranger': return 'd8';
      case 'Warrior': return 'd10';
      default: return 'd12';
    }
  };

  const breakLabels = ['Normal', 'Step 1 (-2)', 'Step 2 (-5)', 'Step 3 (-10)', 'Broken!'];
  const breakColors = [
    'bg-arc-break-normal',
    'bg-arc-break-step1',
    'bg-arc-break-step2',
    'bg-arc-break-step3',
    'bg-arc-break-broken'
  ];

  return (
    <div className="min-h-screen bg-arc-bg text-slate-100 flex flex-col max-w-4xl mx-auto pb-24 border-x border-arc-border shadow-2xl">
      {/* Top Banner / Header */}
      <header className="p-4 bg-arc-card border-b border-arc-border flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-wide text-arc-accent">{sheet.name}</h1>
            <button
              onClick={() => setIsEditorOpen(true)}
              className="p-1 rounded bg-arc-bg hover:bg-arc-cardHover border border-arc-border text-arc-accent hover:border-arc-accent transition-all"
              title="Edit / Level Up Character"
            >
              <UserCheck size={14} />
            </button>
            <button
              onClick={() => setIsSyncOpen(true)}
              className="p-1 rounded bg-arc-bg hover:bg-arc-cardHover border border-arc-border text-slate-400 hover:text-white transition-all ml-1"
              title="Backup / Sync Character"
            >
              <Share2 size={14} />
            </button>
            <span className="text-xs px-2 py-0.5 rounded bg-arc-border text-slate-300">
              Lv. {totalLevel}
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {sheet.ethos}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {sheet.race} • {sheet.classes.map(c => `${c.name} ${c.level}`).join(' / ')}
          </p>
        </div>

        {/* Quick Vitals Badges */}
        <div className="flex items-center gap-3">
          {/* Initiative Die */}
          <div className="flex flex-col items-center bg-arc-bg px-2.5 py-1 rounded border border-arc-border">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Init Die</span>
            <span className="text-sm font-semibold text-emerald-400">{getInitDie(primaryClass)}</span>
          </div>

          {/* Hero Points */}
          <div className="flex flex-col items-center bg-arc-bg px-2.5 py-1 rounded border border-arc-border">
            <div className="flex items-center justify-between w-full gap-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Hero Pts</span>
              <button onClick={resetHeroPoints} title="Reset Hero Points">
                <RefreshCw size={10} className="text-slate-400 hover:text-arc-accent" />
              </button>
            </div>
            <div className="flex gap-1 mt-1">
              {[...Array(Math.min(4, Math.floor(1 + totalLevel / 5)))].map((_, i) => (
                <button
                  key={i}
                  onClick={useHeroPoint}
                  className={`w-3.5 h-3.5 rounded-full border transition-all ${
                    i < sheet.heroPoints
                      ? 'bg-arc-gold border-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                      : 'bg-arc-border border-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="p-4 space-y-5">
        {/* RESOURCE BARS (HP / MP / BREAK GAUGE) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hit Points Bar */}
          <div className="bg-arc-card p-3.5 rounded-lg border border-arc-border shadow-sm">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                <Heart size={14} className="fill-rose-500/20" /> Hit Points
              </span>
              <span className="text-sm font-mono font-bold">
                {sheet.currentHp} <span className="text-xs text-slate-400">/ {maxHp}</span>
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
              <div 
                className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-300"
                style={{ width: `${Math.min(100, (sheet.currentHp / maxHp) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center gap-1 mt-2.5">
              <button 
                onClick={() => updateHp(-10)} 
                className="px-2 py-1 text-xs bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded"
              >
                -10
              </button>
              <button 
                onClick={() => updateHp(-1)} 
                className="px-2 py-1 text-xs bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded"
              >
                -1
              </button>
              <button 
                onClick={() => updateHp(1)} 
                className="px-2 py-1 text-xs bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded text-emerald-400"
              >
                +1
              </button>
              <button 
                onClick={() => updateHp(10)} 
                className="px-2 py-1 text-xs bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded text-emerald-400"
              >
                +10
              </button>
            </div>
          </div>

          {/* Mana Points Bar */}
          <div className="bg-arc-card p-3.5 rounded-lg border border-arc-border shadow-sm">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                <Sparkles size={14} className="fill-cyan-500/20" /> Mana Points
              </span>
              <span className="text-sm font-mono font-bold">
                {sheet.currentMp} <span className="text-xs text-slate-400">/ {maxMp}</span>
              </span>
            </div>
            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700/50">
              <div 
                className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
                style={{ width: `${maxMp > 0 ? Math.min(100, (sheet.currentMp / maxMp) * 100) : 0}%` }}
              />
            </div>
            <div className="flex justify-between items-center gap-1 mt-2.5">
              <button 
                onClick={() => updateMp(-5)} 
                className="px-2 py-1 text-xs bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded"
              >
                -5
              </button>
              <button 
                onClick={() => updateMp(-1)} 
                className="px-2 py-1 text-xs bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded"
              >
                -1
              </button>
              <button 
                onClick={() => updateMp(1)} 
                className="px-2 py-1 text-xs bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded text-cyan-400"
              >
                +1
              </button>
              <button 
                onClick={() => updateMp(5)} 
                className="px-2 py-1 text-xs bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded text-cyan-400"
              >
                +5
              </button>
            </div>
          </div>
        </section>

        {/* BREAK GAUGE TRACKER */}
        <section className="bg-arc-card p-3.5 rounded-lg border border-arc-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
              <AlertOctagon size={14} className="text-amber-400" /> Break Gauge
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-arc-bg border border-arc-border text-slate-300">
              Status: <span className="text-arc-accent">{breakLabels[sheet.breakStep]}</span>
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {breakLabels.map((lbl, idx) => {
              const isActive = sheet.breakStep === idx;
              return (
                <button
                  key={lbl}
                  onClick={() => setBreakStep(idx)}
                  className={`py-2 px-1 text-[11px] font-medium rounded border transition-all text-center flex flex-col items-center justify-center ${
                    isActive
                      ? `${breakColors[idx]} text-white font-bold border-white/40 shadow-lg scale-[1.02]`
                      : 'bg-arc-bg text-slate-400 border-arc-border hover:bg-arc-cardHover'
                  }`}
                >
                  <span>{idx === 0 ? '0' : `-${idx}`}</span>
                  <span className="text-[9px] opacity-80 truncate">{lbl.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* DEFENSES & ATTRIBUTES */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-arc-card p-2.5 rounded-lg border border-arc-border text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Reflex</span>
            <div className="text-xl font-bold text-arc-accent mt-0.5">{defenses.reflex}</div>
            <span className="text-[9px] text-slate-500">10 + Lv + Agi + Cls</span>
          </div>

          <div className="bg-arc-card p-2.5 rounded-lg border border-arc-border text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Fortitude</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{defenses.fortitude}</div>
            <span className="text-[9px] text-slate-500">10 + Lv + Vit + Cls</span>
          </div>

          <div className="bg-arc-card p-2.5 rounded-lg border border-arc-border text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Will</span>
            <div className="text-xl font-bold text-purple-400 mt-0.5">{defenses.will}</div>
            <span className="text-[9px] text-slate-500">10 + Lv + Mnd + Cls</span>
          </div>

          <div className="bg-arc-card p-2.5 rounded-lg border border-arc-border text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Threshold</span>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{defenses.breakThreshold}</div>
            <span className="text-[9px] text-slate-500">Max Hit Tolerance</span>
          </div>
        </section>

        {/* ATTRIBUTES ROW */}
        <section className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {(Object.keys(sheet.baseAttributes) as AttributeKey[]).map((attr) => {
            const val = sheet.baseAttributes[attr];
            const mod = getModifier(val);
            return (
              <div 
                key={attr} 
                className="bg-arc-card p-2 rounded-lg border border-arc-border text-center hover:border-arc-accent transition-colors"
              >
                <div className="text-[10px] uppercase font-bold text-slate-400">{attr}</div>
                <div className="text-lg font-bold text-slate-100">{val}</div>
                <div className={`text-xs font-semibold ${mod >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {mod >= 0 ? `+${mod}` : mod}
                </div>
              </div>
            );
          })}
        </section>

        {/* INTERACTIVE DICE TRAY */}
        <section className="bg-arc-card p-3 rounded-lg border border-arc-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase">
              <Dice5 size={14} className="text-arc-accent" /> Dice Roller & Explosions
            </span>
            <span className="text-[10px] text-slate-400">Max rolls explode automatically</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[4, 6, 8, 10, 12, 20].map((sides) => (
              <button
                key={sides}
                onClick={() => handleRoll(sides, `d${sides}`, sides <= 12)}
                className="flex-1 min-w-[55px] py-1.5 bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded text-xs font-semibold hover:border-arc-accent transition-all"
              >
                d{sides}
              </button>
            ))}
          </div>

          {/* Roller Output Log */}
          {diceLog.length > 0 && (
            <div className="mt-2.5 p-2 bg-slate-950 rounded border border-arc-border flex items-center justify-between text-xs font-mono overflow-x-auto">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{diceLog[0].label}:</span>
                <span className="text-slate-200">[{diceLog[0].rolls.join(', ')}]</span>
                {diceLog[0].exploded && (
                  <span className="text-[10px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                    EXPLODED!
                  </span>
                )}
              </div>
              <div className="font-bold text-arc-accent text-sm pl-2">Total: {diceLog[0].total}</div>
            </div>
          )}
        </section>

        {/* DETAILS TABS */}
        <section className="space-y-3">
          <div className="flex border-b border-arc-border gap-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('combat')}
              className={`pb-2 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'combat' 
                  ? 'border-arc-accent text-arc-accent' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Swords size={13} /> Attacks & Gear
            </button>
            <button
              onClick={() => setActiveTab('skills')}
              className={`pb-2 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'skills' 
                  ? 'border-arc-accent text-arc-accent' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen size={13} /> Skills
            </button>
            <button
              onClick={() => setActiveTab('talents')}
              className={`pb-2 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'talents' 
                  ? 'border-arc-accent text-arc-accent' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap size={13} /> Talents & Technicks
            </button>
          </div>

          {/* TAB: COMBAT & GEAR */}
          {activeTab === 'combat' && (
            <GearManager onRoll={handleRoll} />
          )}

          {/* TAB: SKILLS */}
          {activeTab === 'skills' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {[
                { name: 'Athletics', attr: 'str' },
                { name: 'Acrobatics', attr: 'agi' },
                { name: '1-Handed', attr: 'str' },
                { name: 'Perception', attr: 'mnd' },
                { name: 'Persuasion', attr: 'chr' },
                { name: 'Stealth', attr: 'agi' }
              ].map((skill) => {
                const isTrained = sheet.trainedSkills.includes(skill.name);
                const attrMod = getModifier(sheet.baseAttributes[skill.attr as AttributeKey]);
                const totalMod = Math.floor(totalLevel / 2) + attrMod + (isTrained ? 5 : 0);

                return (
                  <div 
                    key={skill.name}
                    className="p-2.5 bg-arc-card rounded border border-arc-border flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-200">{skill.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase ml-1.5">({skill.attr})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isTrained && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Trained
                        </span>
                      )}
                      <button
                        onClick={() => handleRoll(20, `${skill.name} Check (+${totalMod})`, false)}
                        className="px-2 py-0.5 bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded text-arc-accent font-bold"
                      >
                        +{totalMod}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB: TALENTS & TECHNICKS */}
          {activeTab === 'talents' && (
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-arc-card rounded border border-arc-border">
                <span className="font-bold text-arc-gold">Provoke (Warrior Talent)</span>
                <p className="text-slate-400 mt-1 text-[11px]">
                  Minor Action. Persuasion check vs Will Defence of all enemies within 4 squares. Enemies take a -5 penalty to attack anyone else.
                </p>
              </div>
              <div className="p-3 bg-arc-card rounded border border-arc-border">
                <span className="font-bold text-arc-accent">Power Attack (Technick)</span>
                <p className="text-slate-400 mt-1 text-[11px]">
                  Spend 2 minor actions in the same turn to deal +1 damage die on all melee attacks.
                </p>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Character Creator / Editor Modal */}
      <CharacterEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />

      {/* JSON Backup & Sync Modal */}
      <JsonSyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
      />
    </div>
  );
}