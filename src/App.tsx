import { useState, useMemo, useCallback } from 'react';
import { 
  Dice5, 
  RefreshCw, 
  Swords, 
  BookOpen, 
  Share2, 
  History,
  Info,
  LayoutDashboard,
  ChevronUp,
  Menu,
  ScrollText,
  UserRound,
  Settings
} from 'lucide-react';
import { useCharacterStore, getMaxHeroPoints } from './store/useCharacterStore';
import { getModifier, getTotalLevel, calculateDefensesWithBreak, rollExplodingDie } from './engine/formulas';
import { ZODIAC_SIGNS } from './data/zodiac';
import CharacterEditorModal from './components/character/CharacterEditorModal';
import CharacterPortrait from './components/character/CharacterPortrait';
import CharacterAdvancementControl from './components/character/CharacterAdvancementControl';
import JsonSyncModal from './components/character/JsonSyncModal';
import VersionModal from './components/shared/VersionModal';
import GearManager from './components/equipment/GearManager';
import ResourceBar from './components/combat/ResourceBar';
import BreakGaugeTracker from './components/combat/BreakGaugeTracker';
import SkillTable from './components/skills/SkillTable';
import TalentsTab from './components/talents/TalentsTab';
import CharacterHistoryTab from './components/character/CharacterHistoryTab';
import NotesTab from './components/notes/NotesTab';
import type { AttributeKey } from './types/index';
import type { RollResult } from './engine/combat';

interface DiceLogEntry {
  label: string;
  rolls: number[];
  total: number;
  exploded: boolean;
  breakdown?: string[];
}
declare const __APP_VERSION__: string;
export default function App() {
  const { 
    sheet,
    hasCharacter,
    updateHp, 
    updateMp, 
    setBreakStep, 
    useHeroPoint, 
    resetHeroPoints 
  } = useCharacterStore();
  const [activeView, setActiveView] = useState<'sheet' | 'combat' | 'skills' | 'talents' | 'history' | 'notes'>('sheet');
  const [moreOpen, setMoreOpen] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isSyncOpen, setIsSyncOpen] = useState<boolean>(false);
  const [isVersionOpen, setIsVersionOpen] = useState<boolean>(false);
  const [diceLog, setDiceLog] = useState<DiceLogEntry[]>([]);
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
  const handleCombatResult = useCallback((label: string, result: RollResult) => {
    const entry: DiceLogEntry = {
      label,
      rolls: result.rolls,
      total: result.total,
      exploded: result.breakdown.some((part) => part.includes('(exploded)')),
      breakdown: result.breakdown,
    };
    setDiceLog((prev) => [entry, ...prev.slice(0, 9)]);
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
  const currentZodiac = sheet.zodiacSign ? ZODIAC_SIGNS[sheet.zodiacSign] : null;
  // New visitors see creation first, not the internal sample character.
  // The persisted store restores returning players before this view renders.
  if (!hasCharacter) {
    return (
      <div className="min-h-screen bg-arc-bg text-slate-100">
        <div className="mx-auto max-w-xl px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-arc-accent">Last Arc Character Companion</h1>
          <p className="mt-3 text-slate-300">Create your first character to begin your adventure.</p>
        </div>
        <CharacterEditorModal isOpen mode="create" required onClose={() => {}} />
      </div>
    );
  }

  const navigation = [
    { id: 'sheet', label: 'Sheet', icon: LayoutDashboard },
    { id: 'combat', label: 'Combat', icon: Swords },
    { id: 'skills', label: 'Skills', icon: BookOpen },
    { id: 'talents', label: 'Progress', icon: ChevronUp },
    { id: 'history', label: 'History', icon: History },
    { id: 'notes', label: 'Notes', icon: ScrollText },
  ] as const;
  const navigateTo = (id: typeof activeView) => {
    setActiveView(id);
    setMoreOpen(false);
  };
  const onDetailPage = activeView !== 'sheet';

  return (
    <div className="min-h-screen bg-arc-bg text-slate-100 flex flex-col w-full max-w-screen-2xl mx-auto pb-24 lg:pb-0 lg:border-x border-arc-border shadow-2xl">
      <div className="hidden lg:flex items-center justify-between border-b border-arc-border bg-arc-card/80 px-6 py-3">
        <div className="font-semibold tracking-widest text-arc-accent">LAST ARC <span className="text-xs text-arc-gold">CHARACTER COMPANION</span></div>
        <button type="button" onClick={() => setIsVersionOpen(true)} className="text-xs text-slate-300 hover:text-white flex items-center gap-2"><Info size={14} /> Version {__APP_VERSION__}</button>
      </div>
      <div className="lg:grid lg:grid-cols-[210px_minmax(0,1fr)] lg:flex-1">
      <nav aria-label="Desktop navigation" className="hidden lg:flex lg:flex-col gap-2 border-r border-arc-border bg-arc-card/60 p-4">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" onClick={() => navigateTo(id)} aria-current={activeView === id ? 'page' : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-4 text-sm font-semibold transition-colors ${activeView === id ? 'bg-cyan-950/80 text-white border border-cyan-400/70' : 'text-slate-300 hover:bg-arc-cardHover border border-transparent'}`}>
            <Icon size={19} aria-hidden="true" />{label}
          </button>
        ))}
        <div className="mt-auto border-t border-arc-border pt-4 text-xs text-slate-400">Accessible layout · Mobile & Desktop</div>
      </nav>
      <div className="min-w-0 flex flex-col">
      <header className="p-3 sm:p-4 bg-arc-card border-b border-arc-border shadow-md">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="shrink-0 [&_.w-28]:!w-20 [&_.h-36]:!h-24 sm:[&_.w-28]:!w-28 sm:[&_.h-36]:!h-36">
            <CharacterPortrait characterId={sheet.id} />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="break-words text-xl sm:text-2xl font-bold tracking-wide text-arc-accent">{sheet.name}</h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300 break-words">
              {sheet.race} · {sheet.classes.map(c => `${c.name} ${c.level}`).join(' / ')}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-200 border border-amber-500/50">{sheet.ethos}</span>
              {currentZodiac && (
                <span className="text-xs px-2 py-1 rounded bg-indigo-500/20 text-indigo-200 border border-indigo-400/50" title={`Zodiac: ${currentZodiac.sign} (${currentZodiac.domain})`}>
                  {currentZodiac.symbol} {currentZodiac.sign}
                </span>
              )}
              <button type="button" onClick={() => setIsVersionOpen(true)} className="lg:hidden text-[11px] px-2 py-1 rounded border border-arc-border text-slate-300" title="Version & Release Notes">v{__APP_VERSION__}</button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-3 sm:max-w-lg">
          <button type="button" onClick={() => setIsEditorOpen(true)} className="min-h-11 rounded-lg border border-cyan-500/60 bg-arc-bg text-cyan-100 text-xs sm:text-sm font-semibold flex flex-col sm:flex-row gap-1 items-center justify-center px-2 hover:bg-arc-cardHover"><UserRound size={17} />Character</button>
          <div className="min-w-0 [&>button]:!w-full [&>button]:!h-full [&>button]:!min-h-11 [&>button]:!text-xs [&>button]:!font-semibold">
            <CharacterAdvancementControl />
          </div>
          <button type="button" onClick={() => setIsSyncOpen(true)} className="min-h-11 rounded-lg border border-cyan-500/60 bg-arc-bg text-cyan-100 text-xs sm:text-sm font-semibold flex flex-col sm:flex-row gap-1 items-center justify-center px-2 hover:bg-arc-cardHover"><Share2 size={17} />Share</button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-lg">
          <div className="rounded-lg border border-arc-border bg-arc-bg px-3 py-2 flex items-center justify-center gap-3">
            <Dice5 size={18} className="text-cyan-300" aria-hidden="true" />
            <div><div className="text-[11px] text-slate-300 uppercase">Init Die</div><div className="font-bold text-emerald-300">{getInitDie(primaryClass)}</div></div>
          </div>
          <div className="rounded-lg border border-arc-border bg-arc-bg px-2 py-2 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2"><span className="text-[11px] text-slate-300 uppercase">Hero Pts</span><button type="button" onClick={resetHeroPoints} title="Reset Hero Points" aria-label="Reset Hero Points"><RefreshCw size={13} /></button></div>
            <div className="mt-1 flex gap-2">{[...Array(getMaxHeroPoints(totalLevel))].map((_,i) => (
              <button type="button" key={i} onClick={useHeroPoint} aria-label={`Use hero point ${i + 1}`} className={`w-5 h-5 rounded-full border border-amber-400 ${i < sheet.heroPoints ? 'bg-arc-gold' : 'bg-slate-700'}`} />
            ))}</div>
          </div>
        </div>
      </header>
      <main className="p-3 sm:p-5 space-y-5 min-w-0 flex-1">
        {onDetailPage && (
          <div className="rounded-lg border border-arc-border bg-arc-card p-3">
            <h2 className="text-xl font-bold text-cyan-200">{navigation.find(item => item.id === activeView)?.label}</h2>
            <p className="text-sm text-slate-300">Your character's existing tools and information, gathered in one place.</p>
          </div>
        )}
        <div className={onDetailPage ? 'hidden' : 'space-y-5'}>
        {/* Shared resource and segmented Break Gauge components */}
        <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <ResourceBar kind="hp" current={sheet.currentHp} max={maxHp} onChange={updateHp} />
          <ResourceBar kind="mp" current={sheet.currentMp} max={maxMp} onChange={updateMp} />
        </section>
        <BreakGaugeTracker step={sheet.breakStep} onChange={setBreakStep} />
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
        </div>
        {/* DETAILS TABS */}
        <section className="space-y-3">
          <div className="hidden lg:flex flex-wrap border-b border-arc-border gap-3 text-sm font-semibold">
            {navigation.filter(item => item.id !== 'sheet').map(({id, label}) => (
              <button type="button" key={id} onClick={() => navigateTo(id)} className={`pb-2 px-2 border-b-2 ${activeView === id ? 'border-arc-accent text-arc-accent' : 'border-transparent text-slate-300'}`}>{label}</button>
            ))}
          </div>
          {activeView === 'combat' && (
            <div className="space-y-4">
              <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <ResourceBar kind="hp" current={sheet.currentHp} max={maxHp} onChange={updateHp} />
                <ResourceBar kind="mp" current={sheet.currentMp} max={maxMp} onChange={updateMp} />
              </section>
              <BreakGaugeTracker step={sheet.breakStep} onChange={setBreakStep} />
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
          <div className="mt-2.5 space-y-2">
            <div className="p-2 bg-slate-950 rounded border border-arc-border flex items-center justify-between gap-2 text-xs font-mono overflow-x-auto">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">{diceLog[0].label}:</span>
                <span className="text-slate-200">[{diceLog[0].rolls.join(', ')}]</span>
                {diceLog[0].exploded && (
                  <span className="text-[10px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                    EXPLODED!
                  </span>
                )}
              </div>
              <div className="font-bold text-arc-accent text-sm pl-2 whitespace-nowrap">Total: {diceLog[0].total}</div>
            </div>
            {diceLog[0].breakdown && (
              <div className="p-2 bg-slate-950 rounded border border-arc-border text-[11px] font-mono text-slate-400 space-y-1">
                {diceLog[0].breakdown.map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
              <GearManager onRoll={handleRoll} onCombatResult={handleCombatResult} />
            </div>
          )}
          {activeView === 'skills' && <SkillTable onRoll={handleRoll} />}
          {activeView === 'talents' && <TalentsTab />}
          {activeView === 'history' && <CharacterHistoryTab />}
          {activeView === 'notes' && <NotesTab />}
        </section>
      </main>
      </div>
      </div>
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-cyan-500/50 bg-[#071322]/95 px-1 pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_18px_rgba(0,0,0,.4)] backdrop-blur lg:hidden">
        {navigation.slice(0,4).map(({id,label,icon:Icon}) => (
          <button type="button" key={id} onClick={() => navigateTo(id)} aria-current={activeView === id ? 'page' : undefined} className={`min-h-16 flex flex-col items-center justify-center gap-1 text-[10px] font-medium ${activeView === id ? 'text-cyan-300' : 'text-slate-300'}`}>
            <Icon size={20} aria-hidden="true" />{label}
          </button>
        ))}
        <button type="button" onClick={() => navigateTo('history')} aria-current={activeView === 'history' ? 'page' : undefined} className={`min-h-16 flex flex-col items-center justify-center gap-1 text-[10px] ${activeView === 'history' ? 'text-cyan-300' : 'text-slate-300'}`}><History size={20} />History</button>
        <div className="relative flex">
          <button type="button" onClick={() => setMoreOpen(!moreOpen)} aria-expanded={moreOpen} aria-label="More navigation options" className="w-full min-h-16 flex flex-col items-center justify-center gap-1 text-[10px] text-slate-300"><Menu size={20} />More</button>
          {moreOpen && <div className="absolute bottom-full right-0 mb-2 min-w-36 rounded-lg border border-arc-border bg-arc-card p-2 shadow-xl">
            <button type="button" className="flex min-h-11 w-full items-center gap-2 rounded px-3 text-sm text-slate-100 hover:bg-arc-cardHover" onClick={() => navigateTo('notes')}><ScrollText size={17} /> Notes</button>
            <button type="button" className="flex min-h-11 w-full items-center gap-2 rounded px-3 text-sm text-slate-100 hover:bg-arc-cardHover" onClick={() => {setIsVersionOpen(true);setMoreOpen(false);}}><Settings size={17} /> About</button>
          </div>}
        </div>
      </nav>
      <footer className="w-full mt-auto px-4 py-6 border-t border-arc-border bg-arc-card/50 text-center">
  <div className="flex flex-col items-center gap-3">

    {/* Character Companion developer credit */}
    <p className="text-[11px] text-slate-400 tracking-wide">
      Character Companion
      <span className="mx-1 text-slate-600">•</span>
      Designed, Engineered &amp; Maintained by{' '}
      <span className="font-semibold text-arc-accent">
        Brian T Jamiel (6R3M)
      </span>
    </p>

    <div className="w-16 h-px bg-arc-border" />

    {/* Original tabletop game creator credit */}
    <p className="text-[11px] text-slate-400">
      <span className="font-semibold text-slate-300">
        Last Arc: Tactics Analogue
      </span>
      {' '}created &amp; developed by{' '}
      <span className="font-semibold text-arc-gold">
        GobZoblin
      </span>
    </p>

    {/* Unofficial companion disclaimer */}
    <p className="max-w-xl text-[10px] leading-relaxed text-slate-500">
      This is an independent, unofficial, fan-made companion
      application for Last Arc: Tactics Analogue. It is not
      officially affiliated with, endorsed by, or sponsored
      by the game's creators or publishers. All rights to
      the original tabletop game and its intellectual
      property remain with their respective owners.
    </p>

  </div>
</footer>
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
