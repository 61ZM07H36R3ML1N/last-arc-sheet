import { useState, useMemo, useCallback } from 'react';
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
  Share2, 
  BookMarked, 
  Info 
} from 'lucide-react';
import { useCharacterStore } from './store/useCharacterStore';
import { getModifier, getTotalLevel, calculateDefensesWithBreak, rollExplodingDie } from './engine/formulas';
import { ZODIAC_SIGNS } from './data/zodiac';
import CharacterEditorModal from './components/character/CharacterEditorModal';
import JsonSyncModal from './components/character/JsonSyncModal';
import VersionModal from './components/shared/VersionModal';
import GearManager from './components/equipment/GearManager';
import SkillTable from './components/skills/SkillTable';
import TalentsTab from './components/talents/TalentsTab';
import NotesTab from './components/notes/NotesTab';
import type { AttributeKey } from './types/index';

declare const __APP_VERSION__: string;

export default function App() {
  const { 
    sheet, 
    updateHp, 
    updateMp, 
    setBreakStep, 
    useHeroPoint, 
    resetHeroPoints 
  } = useCharacterStore();

  const [activeTab, setActiveTab] = useState<'combat' | 'skills' | 'talents' | 'notes'>('combat');
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isSyncOpen, setIsSyncOpen] = useState<boolean>(false);
  const [isVersionOpen, setIsVersionOpen] = useState<boolean>(false);
  const [diceLog, setDiceLog] = useState<{ label: string; rolls: number[]; total: number; exploded: boolean }[]>([]);

  const totalLevel = useMemo(() => getTotalLevel(sheet), [sheet]);
  const defenses = useMemo(() => calculateDefensesWithBreak(sheet), [sheet]);
  const primaryClass = sheet.classes[0]?.name || 'Warrior';

  const vitMod = useMemo(() => getModifier(sheet.baseAttributes.vit), [sheet.baseAttributes.vit]);
  const mndMod = useMemo(() => getModifier(sheet.baseAttributes.mnd), [sheet.baseAttributes.mnd]);

  const { maxHp, maxMp } = useMemo(() => {
    let hp = 0;
    let mp = 0;

    sheet.classes.forEach((c, idx) => {
      const isBase = idx === 0;
      if (['Warrior', 'Ranger', 'Condottiere'].includes(c.name)) {
        hp += (isBase ? 30 : 6) + vitMod + (c.level - 1) * (6 + vitMod);
        mp += (isBase ? 6 : 2) + mndMod + (c.level - 1) * (2 + mndMod);
      } else if (['Bard', 'Rogue', 'Aeronaut', 'Magnate', 'Mstovari'].includes(c.name)) {
        hp += (isBase ? 24 : 5) + vitMod + (c.level - 1) * (5 + vitMod);
        mp += (isBase ? 6 : 2) + mndMod + (c.level - 1) * (2 + mndMod);
      } else {
        // Mage, Initiate, Astrologian, Scholar
        hp += (isBase ? 18 : 4) + vitMod + (c.level - 1) * (4 + vitMod);
        mp += (isBase ? 12 : 3) + mndMod + (c.level - 1) * (3 + mndMod);
      }
    });

    return { maxHp: Math.max(1, hp), maxMp: Math.max(0, mp) };
  }, [sheet.classes, vitMod, mndMod]);

  const handleRoll = useCallback((sides: number, label: string, explodes = false) => {
    let rolls: number[];
    let total: number;
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
      case 'Rogue':
      case 'Mstovari':
        return 'd4';
      case 'Bard':
      case 'Magnate':
        return 'd6';
      case 'Ranger':
      case 'Aeronaut':
      case 'Scholar':
        return 'd8';
      case 'Warrior':
      case 'Astrologian':
      case 'Condottiere':
        return 'd10';
      default:
        return 'd12';
    }
  };

  const breakSteps = [
    { label: 'Normal', penalty: '0', color: 'bg-arc-break-normal' },
    { label: 'Step 1', penalty: '-1', color: 'bg-arc-break-step1' },
    { label: 'Step 2', penalty: '-2', color: 'bg-arc-break-step2' },
    { label: 'Step 3', penalty: '-5', color: 'bg-arc-break-step3' },
    { label: 'Step 4', penalty: '-10', color: 'bg-arc-break-step3' },
    { label: 'Broken!', penalty: '—', color: 'bg-arc-break-broken' },
] as const;

  const currentZodiac = sheet.zodiacSign ? ZODIAC_SIGNS[sheet.zodiacSign] : null;

  return (
    <div className="min-h-screen bg-arc-bg text-slate-100 flex flex-col max-w-4xl mx-auto pb-24 border-x border-arc-border shadow-2xl">
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
              className="p-1 rounded bg-arc-bg hover:bg-arc-cardHover border border-arc-border text-slate-400 hover:text-white transition-all ml-0.5"
              title="Backup / Sync Character"
            >
              <Share2 size={14} />
            </button>
            <button
              onClick={() => setIsVersionOpen(true)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-arc-border hover:bg-arc-cardHover text-slate-300 font-mono flex items-center gap-1"
              title="Version & Release Notes"
            >
              <Info size={11} /> {__APP_VERSION__}
            </button>

            {/* Ethos Badge */}
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {sheet.ethos}
            </span>

            {/* Zodiac Badge */}
            {currentZodiac && (
              <span 
                className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 font-medium cursor-help"
                title={`Zodiac: ${currentZodiac.sign} (${currentZodiac.element})\n• Compatible (+Benefic): ${currentZodiac.compatible.join(', ')}\n• Incompatible (+Malefic): ${currentZodiac.incompatible.join(', ')}`}
              >
                <span>{currentZodiac.symbol}</span>
                <span>{currentZodiac.sign}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {sheet.race} • {sheet.classes.map(c => `${c.name} ${c.level}`).join(' / ')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center bg-arc-bg px-2.5 py-1 rounded border border-arc-border">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider">Init Die</span>
            <span className="text-sm font-semibold text-emerald-400">{getInitDie(primaryClass)}</span>
          </div>

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

      <main className="p-4 space-y-5">
        {/* RESOURCE BARS (HP / MP) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <button onClick={() => updateHp(-10)} className="px-2 py-1 text-xs bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded">-10</button>
              <button onClick={() => updateHp(-1)} className="px-2 py-1 text-xs bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded">-1</button>
              <button onClick={() => updateHp(1)} className="px-2 py-1 text-xs bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded text-emerald-400">+1</button>
              <button onClick={() => updateHp(10)} className="px-2 py-1 text-xs bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded text-emerald-400">+10</button>
            </div>
          </div>

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
              <button onClick={() => updateMp(-5)} className="px-2 py-1 text-xs bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded">-5</button>
              <button onClick={() => updateMp(-1)} className="px-2 py-1 text-xs bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded">-1</button>
              <button onClick={() => updateMp(1)} className="px-2 py-1 text-xs bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded text-cyan-400">+1</button>
              <button onClick={() => updateMp(5)} className="px-2 py-1 text-xs bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded text-cyan-400">+5</button>
            </div>
          </div>
        </section>

        {/* BREAK GAUGE */}
        <section className="bg-arc-card p-3.5 rounded-lg border border-arc-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wide">
              <AlertOctagon size={14} className="text-amber-400" /> Break Gauge
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-arc-bg border border-arc-border text-slate-300">
              Status: <span className="text-arc-accent"> {breakSteps[sheet.breakStep]?.label ?? 'Unknown'}</span>
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
  {breakSteps.map((step, idx) => {
    const isActive = sheet.breakStep === idx;

    return (
      <button
        key={idx}
        type="button"
        onClick={() => setBreakStep(idx)}
        className={`py-2 px-1 text-[11px] font-medium rounded border transition-all text-center flex flex-col items-center justify-center ${
          isActive
            ? `${step.color} text-white font-bold border-white/40 shadow-lg scale-[1.02]`
            : 'bg-arc-bg text-slate-400 border-arc-border hover:bg-arc-cardHover'
        }`}
      >
        <span>{step.penalty}</span>
        <span className="text-[9px] opacity-80">
          {step.label}
        </span>
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
            <span className="text-[9px] text-slate-500">10 + ½Lv + Agi + Cls</span>
          </div>

          <div className="bg-arc-card p-2.5 rounded-lg border border-arc-border text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Fortitude</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">{defenses.fortitude}</div>
            <span className="text-[9px] text-slate-500">10 + ½Lv + Vit + Cls</span>
          </div>

          <div className="bg-arc-card p-2.5 rounded-lg border border-arc-border text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Will</span>
            <div className="text-xl font-bold text-purple-400 mt-0.5">{defenses.will}</div>
            <span className="text-[9px] text-slate-500">10 + ½Lv + Mnd + Cls</span>
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

        {/* DICE TRAY */}
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
            <button
              onClick={() => setActiveTab('notes')}
              className={`pb-2 border-b-2 flex items-center gap-1.5 transition-all ${
                activeTab === 'notes' 
                  ? 'border-arc-accent text-arc-accent' 
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookMarked size={13} /> Journal & Notes
            </button>
          </div>

          {activeTab === 'combat' && <GearManager onRoll={handleRoll} />}
          {activeTab === 'skills' && <SkillTable onRoll={handleRoll} />}
          {activeTab === 'talents' && <TalentsTab />}
          {activeTab === 'notes' && <NotesTab />}
        </section>
      </main>

      <CharacterEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
      />

      <JsonSyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
      />

      <VersionModal
        isOpen={isVersionOpen}
        onClose={() => setIsVersionOpen(false)}
      />
    </div>
  );
}