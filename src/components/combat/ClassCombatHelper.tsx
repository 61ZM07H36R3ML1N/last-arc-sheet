import { useState, useMemo } from 'react';
import { Sparkles, Compass, BookOpen, Dices, Award, Zap } from 'lucide-react';
import { ZODIAC_LIST, ZODIAC_SIGNS, type ZodiacSign } from '../../data/zodiac';
import { calculateZodiacResonance, getTabulaRasaStats } from '../../engine/astrologyScholar';
import { getModifier } from '../../engine/formulas';
import { useCharacterStore } from '../../store/useCharacterStore';

interface ClassCombatHelpersProps {
  onRoll: (sides: number, label: string, explodes?: boolean) => void;
}

export default function ClassCombatHelpers({ onRoll }: ClassCombatHelpersProps) {
  const { sheet, updateMp, updateHp } = useCharacterStore();

  const isAstrologian = useMemo(
    () => sheet.classes.some((c) => c.name.toLowerCase() === 'astrologian'),
    [sheet.classes]
  );
  const isScholar = useMemo(
    () => sheet.classes.some((c) => c.name.toLowerCase() === 'scholar'),
    [sheet.classes]
  );

  // Target sign for Astrologian mechanics
  const [targetSign, setTargetSign] = useState<ZodiacSign>('Leo');
  const [lastTabulaResult, setLastTabulaResult] = useState<{
    roll: number;
    targetChance: number;
    success: boolean;
    eureka: boolean;
    mpRestored: number;
  } | null>(null);

  // Variate die selector for Scholar Mathmagician
  const [variateSides, setVariateSides] = useState<number>(6);

  const casterSign = (sheet.zodiacSign as ZodiacSign) || 'Aries';
  const resonance = useMemo(
    () => calculateZodiacResonance(casterSign, targetSign, sheet),
    [casterSign, targetSign, sheet]
  );

  const tabulaStats = useMemo(() => getTabulaRasaStats(sheet), [sheet]);
  const hasEruditeWand = useMemo(
    () => sheet.equipped.mainHand?.id.toLowerCase().includes('erudite'),
    [sheet.equipped.mainHand]
  );

  const handleTabulaRasaRoll = () => {
    const roll = Math.floor(Math.random() * 100) + 1;
    const success = roll <= tabulaStats.effectiveChance;
    const hasEureka = sheet.talents.some((t) => t.toLowerCase().includes('eureka')) || tabulaStats.eurekaThreshold === 25;
    const eureka = hasEureka && roll <= tabulaStats.eurekaThreshold;
    const intMod = Math.max(1, getModifier(sheet.baseAttributes.int));

    if (eureka) {
      updateMp(intMod);
    }

    setLastTabulaResult({
      roll,
      targetChance: tabulaStats.effectiveChance,
      success,
      eureka,
      mpRestored: intMod
    });

    onRoll(100, `Tabula Rasa (d100 vs ≤${tabulaStats.effectiveChance})`, false);
  };

  const handleVariateRoll = () => {
    if (hasEruditeWand) {
      const roll1 = Math.floor(Math.random() * variateSides) + 1;
      const roll2 = Math.floor(Math.random() * variateSides) + 1;
      const chosen = Math.max(roll1, roll2);
      onRoll(
        variateSides,
        `Mathmagician Variate d${variateSides} [Erudite Wand: ${roll1}, ${roll2} -> Pick ${chosen}]`,
        false
      );
    } else {
      onRoll(variateSides, `Mathmagician Variate d${variateSides}`, false);
    }
  };

  const handlePedagogyAid = () => {
    const raw = Math.floor(Math.random() * 20) + 1;
    const finalVal = raw >= 2 && raw <= 7 ? 8 : raw;
    onRoll(
      20,
      `Pedagogy Aid Another [Rolled ${raw} -> Elevated to ${finalVal}]`,
      false
    );
  };

  // If the character has neither class, allow viewing as an Arcana Helper toggle
  const [forceShow, setForceShow] = useState(false);
  if (!isAstrologian && !isScholar && !forceShow) {
    return (
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setForceShow(true)}
          className="text-[11px] text-slate-400 hover:text-arc-accent flex items-center gap-1.5 transition-colors"
        >
          <Sparkles size={12} /> Show Astrologian & Scholar Tactical Console
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
          <Sparkles size={12} className="text-arc-accent" /> Atlas Arcana & Resonance Helpers
        </span>
        {!isAstrologian && !isScholar && (
          <button
            type="button"
            onClick={() => setForceShow(false)}
            className="text-[10px] text-slate-500 hover:text-slate-300"
          >
            Hide Console
          </button>
        )}
      </div>

      {/* ASTROLOGIAN RESONANCE CONSOLE */}
      {(isAstrologian || forceShow) && (
        <div className="p-3 bg-arc-card rounded-lg border border-indigo-500/30 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Compass size={14} className="text-indigo-400" /> Astrologian: Horo-Scope & Resonance
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-arc-bg border border-arc-border text-slate-300">
              Caster Sign: <strong className="text-arc-accent">{casterSign}</strong> ({ZODIAC_SIGNS[casterSign]?.symbol})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Target Zodiac Sign
              </label>
              <select
                value={targetSign}
                onChange={(e) => setTargetSign(e.target.value as ZodiacSign)}
                className="w-full bg-arc-bg border border-arc-border rounded px-2 py-1.5 text-slate-200 focus:outline-none focus:border-indigo-400 font-semibold"
              >
                {ZODIAC_LIST.map((sign) => (
                  <option key={sign} value={sign}>
                    {ZODIAC_SIGNS[sign].symbol} {sign} ({ZODIAC_SIGNS[sign].domain})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col justify-center px-2.5 py-1.5 bg-arc-bg rounded border border-arc-border">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400">Resonance Status</span>
                {resonance.resonance === 'compatible' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/40">
                    Benefic (+HP)
                  </span>
                )}
                {resonance.resonance === 'incompatible' && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded border border-purple-500/40">
                    Malefic (+MP)
                  </span>
                )}
                {resonance.resonance === 'neutral' && (
                  <span className="text-[10px] font-semibold text-slate-400">Neutral</span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">{resonance.description}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-indigo-500/20">
            {resonance.resonance === 'compatible' && (
              <button
                type="button"
                onClick={() => {
                  updateHp(resonance.beneficHpBonus);
                  onRoll(1, `Benefic Wave (+${resonance.beneficHpBonus} HP)`, false);
                }}
                className="px-2.5 py-1 text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded flex items-center gap-1 font-semibold transition-all"
              >
                <Zap size={12} /> Apply Benefic Heal (+{resonance.beneficHpBonus} HP)
              </button>
            )}
            {resonance.resonance === 'incompatible' && (
              <button
                type="button"
                onClick={() => {
                  updateMp(resonance.maleficMpBonus);
                  onRoll(1, `Malefic Surge (+${resonance.maleficMpBonus} MP)`, false);
                }}
                className="px-2.5 py-1 text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 rounded flex items-center gap-1 font-semibold transition-all"
              >
                <Zap size={12} /> Siphon Malefic Mana (+{resonance.maleficMpBonus} MP)
              </button>
            )}
          </div>
        </div>
      )}

      {/* SCHOLAR TABULA RASA & MATHMAGICIAN CONSOLE */}
      {(isScholar || forceShow) && (
        <div className="p-3 bg-arc-card rounded-lg border border-cyan-500/30 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
              <BookOpen size={14} className="text-cyan-400" /> Scholar: Tabula Rasa & Mathmagician
            </span>
            <span className="text-[10px] text-slate-400">
              {tabulaStats.activeTomeName ? (
                <span>Tome: <strong className="text-cyan-300">{tabulaStats.activeTomeName}</strong></span>
              ) : (
                <span className="italic">No Tome Equipped (+0%)</span>
              )}
            </span>
          </div>

          {/* Action Row 1: Tabula Rasa */}
          <div className="p-2 bg-arc-bg rounded border border-arc-border flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-slate-200">
                Tabula Rasa Threshold: <strong className="text-cyan-400">{tabulaStats.effectiveChance}%</strong>
              </div>
              <div className="text-[10px] text-slate-400">
                Improvise unknown spell on d100. Eureka trigger: ≤{tabulaStats.eurekaThreshold} refunds MP.
              </div>
            </div>

            <button
              type="button"
              onClick={handleTabulaRasaRoll}
              className="px-3 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded text-xs font-bold flex items-center gap-1 transition-all"
            >
              <Dices size={13} /> Improvise Spell (d100)
            </button>
          </div>

          {lastTabulaResult && (
            <div
              className={`p-2 rounded border text-xs flex items-center justify-between ${
                lastTabulaResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              <span>
                Result: <strong>Rolled {lastTabulaResult.roll}</strong> vs ≤{lastTabulaResult.targetChance} (
                {lastTabulaResult.success ? 'Success!' : 'Cast Failed'})
              </span>
              {lastTabulaResult.eureka && (
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/40 font-bold flex items-center gap-1">
                  <Sparkles size={11} /> Eureka! +{lastTabulaResult.mpRestored} MP refunded
                </span>
              )}
            </div>
          )}

          {/* Action Row 2: Mathmagician & Pedagogy */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div className="p-2 bg-arc-bg rounded border border-arc-border space-y-1.5">
              <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400">
                <span>Mathmagician Variate Die</span>
                {hasEruditeWand && (
                  <span className="text-amber-400 font-normal">Wand Advantage</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={variateSides}
                  onChange={(e) => setVariateSides(parseInt(e.target.value) || 6)}
                  className="bg-arc-card border border-arc-border rounded px-2 py-1 text-slate-200 text-xs font-semibold focus:outline-none"
                >
                  <option value={4}>d4</option>
                  <option value={6}>d6</option>
                  <option value={8}>d8</option>
                  <option value={10}>d10</option>
                  <option value={12}>d12</option>
                </select>
                <button
                  type="button"
                  onClick={handleVariateRoll}
                  className="flex-1 py-1 bg-arc-card hover:bg-arc-cardHover border border-arc-border rounded text-xs font-semibold text-slate-200 hover:border-cyan-400 transition-all text-center"
                >
                  Roll Variate d{variateSides}
                </button>
              </div>
            </div>

            <div className="p-2 bg-arc-bg rounded border border-arc-border space-y-1.5 flex flex-col justify-between">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Curriculum: Pedagogy Aid
              </div>
              <button
                type="button"
                onClick={handlePedagogyAid}
                className="w-full py-1 bg-arc-card hover:bg-arc-cardHover border border-arc-border rounded text-xs font-semibold text-slate-200 hover:border-emerald-400 flex items-center justify-center gap-1 transition-all"
              >
                <Award size={12} className="text-emerald-400" /> Aid Check (2–7 Elevates to 8)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}