import { useMemo, useState } from 'react';
import { Check, RefreshCw, User, X } from 'lucide-react';
import { RACES, ETHOS_LIST, SKILLS } from '../../data';
import { ZODIAC_LIST, ZODIAC_SIGNS, type ZodiacSign } from '../../data/zodiac';
import { useCharacterStore } from '../../store/useCharacterStore';
import { getModifier } from '../../engine/formulas';
import { BASE_CLASSES, createCharacter, editCharacter } from '../../engine/characterLifecycle';
import type { AttributeKey } from '../../types';

type CharacterEditorMode = 'create' | 'edit';
type AttributeScores = Record<AttributeKey, number>;

interface CharacterEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: CharacterEditorMode;
}

const ATTRIBUTE_KEYS: AttributeKey[] = ['str', 'vit', 'agi', 'int', 'mnd', 'chr'];
const STANDARD_ARRAY: AttributeScores = {
  str: 16, vit: 14, agi: 12, int: 10, mnd: 10, chr: 8,
};
const AVAILABLE_CLASSES = BASE_CLASSES;

export default function CharacterEditorModal({
  isOpen,
  onClose,
  mode = 'edit',
}: CharacterEditorModalProps) {
  if (!isOpen) return null;
  return <CharacterEditorForm key={mode} mode={mode} onClose={onClose} />;
}

function CharacterEditorForm({
  mode,
  onClose,
}: {
  mode: CharacterEditorMode;
  onClose: () => void;
}) {
  const isCreating = mode === 'create';
  const { sheet, importSheet } = useCharacterStore();

  const [name, setName] = useState(isCreating ? '' : sheet.name);
  const [raceId, setRaceId] = useState(() => {
    if (isCreating) return RACES[0].id;
    return RACES.find((race) => race.name.toLowerCase() === sheet.race.toLowerCase())?.id ?? RACES[0].id;
  });
  const [ethos, setEthos] = useState(isCreating ? ETHOS_LIST[0] : sheet.ethos);
  const [zodiacSign, setZodiacSign] = useState<ZodiacSign>(
    isCreating ? 'Aries' : (sheet.zodiacSign || 'Aries'),
  );
  const [classId, setClassId] = useState(() => {
    if (isCreating) return AVAILABLE_CLASSES[0].id;
    const currentName = sheet.classes[0]?.name ?? '';
    return AVAILABLE_CLASSES.find((entry) => entry.name.toLowerCase() === currentName.toLowerCase())?.id
      ?? AVAILABLE_CLASSES[0].id;
  });
  const [level, setLevel] = useState(isCreating ? 1 : (sheet.classes[0]?.level ?? 1));
  const [flexibleAttr, setFlexibleAttr] = useState<AttributeKey>(
    isCreating ? 'str' : (sheet.racialAttributeChoice ?? 'str'),
  );
  const [baseAttributes, setBaseAttributes] = useState<AttributeScores>(() =>
    isCreating ? { ...STANDARD_ARRAY } : { ...sheet.baseAttributes },
  );
  const [trainedSkills, setTrainedSkills] = useState<string[]>(
    isCreating ? [] : [...sheet.trainedSkills],
  );
  const [saveError, setSaveError] = useState<string | null>(null);

  const selectedRace = useMemo(
    () => RACES.find((race) => race.id === raceId) ?? RACES[0],
    [raceId],
  );
  const selectedClass = useMemo(
    () => AVAILABLE_CLASSES.find((entry) => entry.id === classId) ?? AVAILABLE_CLASSES[0],
    [classId],
  );

  // Calculate the preview directly from the currently selected race. This is
  // independent of the persisted sheet, so changing the dropdown updates the UI.
  // The lifecycle engine remains responsible for validating and saving the sheet.
  const { finalAttributes, bonuses, capErrors } = useMemo(() => {
    const scores = { ...baseAttributes };
    const adjustments = {} as AttributeScores;
    const errors: string[] = [];
    const raceBonuses = selectedRace.attributeAdjustments;
    const increases = isCreating ? {} : (sheet.attributeIncreases ?? {});

    for (const key of ATTRIBUTE_KEYS) {
      const fixed = raceBonuses[key] ?? 0;
      const flexible = flexibleAttr === key ? (raceBonuses.any ?? 0) : 0;
      const progression = increases[key] ?? 0;
      const bonus = fixed + flexible + progression;
      const score = baseAttributes[key] + bonus;
      const cap = selectedRace.attributeCaps[key] ?? 20;
      adjustments[key] = bonus;
      scores[key] = score;
      if (score > cap) errors.push(`${key.toUpperCase()} ${score} exceeds the ${selectedRace.name} cap of ${cap}.`);
    }

    return { finalAttributes: scores, bonuses: adjustments, capErrors: errors };
  }, [baseAttributes, selectedRace, flexibleAttr, isCreating, sheet.attributeIncreases]);

  const intMod = getModifier(finalAttributes.int);
  const maxTrainedSkills = useMemo(() => {
    const skilled = selectedRace.traits.some((trait) => trait.name === 'Skilled') ? 1 : 0;
    return Math.max(1, selectedClass.baseTrainedSkillsCount + intMod + skilled);
  }, [selectedClass, intMod, selectedRace]);

  const toggleSkill = (skillName: string) => {
    setTrainedSkills((current) => {
      if (current.includes(skillName)) return current.filter((name) => name !== skillName);
      if (current.length >= maxTrainedSkills) return current;
      return [...current, skillName];
    });
  };

  const handleSave = () => {
    setSaveError(null);
    if (capErrors.length) {
      setSaveError(capErrors.join(' '));
      return;
    }
    if (trainedSkills.length > maxTrainedSkills) {
      setSaveError(`Choose no more than ${maxTrainedSkills} trained skills.`);
      return;
    }

    try {
      if (isCreating) {
        const newSheet = createCharacter({
          id: crypto.randomUUID(),
          name: name.trim() || 'Hero',
          race: selectedRace.name,
          ethos,
          zodiacSign,
          classId: selectedClass.id,
          level,
          baseAttributes: { ...baseAttributes },
          racialAttributeChoice: flexibleAttr,
          trainedSkills,
        });

        const confirmed = window.confirm(
          'Creating a new character will replace your currently active character. ' +
          'Export your existing character first if you want to keep it.\n\nContinue?',
        );
        if (!confirmed) return;
        importSheet(newSheet);
      } else {
        const updatedSheet = editCharacter(sheet, {
          name: name.trim() || 'Hero',
          race: selectedRace.name,
          classId: selectedClass.id,
          level,
          ethos,
          zodiacSign,
          baseAttributes: { ...baseAttributes },
          racialAttributeChoice: flexibleAttr,
          trainedSkills,
        });
        importSheet(updatedSheet);
      }
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Unable to save character.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-arc-card border border-arc-border w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        <div className="p-4 border-b border-arc-border flex items-center justify-between bg-arc-bg/50">
          <div className="flex items-center gap-2">
            <User className="text-arc-accent" size={18} />
            <h2 className="text-base font-bold text-slate-100 tracking-wide">
              {isCreating ? 'Create New Character' : 'Edit Character'}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close editor" className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-arc-border transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-5 text-xs text-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Character Name</label>
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Kress" className="w-full bg-arc-bg border border-arc-border rounded px-2.5 py-1.5 focus:border-arc-accent focus:outline-none" />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Zodiac Sign</label>
              <select value={zodiacSign} onChange={(event) => setZodiacSign(event.target.value as ZodiacSign)} className="w-full bg-arc-bg border border-arc-border rounded px-2 py-1.5 focus:border-arc-accent focus:outline-none">
                {ZODIAC_LIST.map((sign) => (
  <option key={sign} value={sign}>
    {ZODIAC_SIGNS[sign].symbol} {sign} ({ZODIAC_SIGNS[sign].celestial} — {ZODIAC_SIGNS[sign].domain})
  </option>
))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Ethos (Alignment)</label>
              <select value={ethos} onChange={(event) => setEthos(event.target.value)} className="w-full bg-arc-bg border border-arc-border rounded px-2 py-1.5 focus:border-arc-accent focus:outline-none">
                {ETHOS_LIST.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Level</label>
              <input type="number" min={1} max={20} value={level} onChange={(event) => setLevel(Math.max(1, Math.min(20, Number.parseInt(event.target.value, 10) || 1)))} className="w-full bg-arc-bg border border-arc-border rounded px-2.5 py-1.5 focus:border-arc-accent focus:outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 bg-arc-bg rounded-lg border border-arc-border space-y-2">
              <label className="block text-[10px] uppercase font-bold text-slate-400">Race &amp; Ancestry</label>
              <select value={raceId} onChange={(event) => { setRaceId(event.target.value); setSaveError(null); }} className="w-full bg-arc-card border border-arc-border rounded px-2 py-1.5 focus:border-arc-accent focus:outline-none font-semibold text-slate-100">
                {RACES.map((race) => <option key={race.id} value={race.id}>{race.name} ({race.size}, Spd {race.speed})</option>)}
              </select>
              {!!selectedRace.attributeAdjustments.any && (
                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <span className="text-amber-400 font-semibold">+{selectedRace.attributeAdjustments.any} Racial Choice:</span>
                  <select value={flexibleAttr} onChange={(event) => setFlexibleAttr(event.target.value as AttributeKey)} className="bg-arc-card border border-arc-border rounded px-1.5 py-0.5 text-slate-200 uppercase font-bold">
                    {ATTRIBUTE_KEYS.map((key) => <option key={key} value={key}>{key}</option>)}
                  </select>
                </div>
              )}
              <div className="pt-1 flex flex-wrap gap-1">
                {selectedRace.traits.map((trait) => (
                  <span key={trait.name} title={trait.description} className="text-[10px] px-1.5 py-0.5 rounded bg-arc-border/60 text-slate-300 border border-slate-700/50">{trait.name}</span>
                ))}
              </div>
            </div>

            <div className="p-3 bg-arc-bg rounded-lg border border-arc-border space-y-2">
              <label className="block text-[10px] uppercase font-bold text-slate-400">Base Class</label>
              <select value={classId} onChange={(event) => { setClassId(event.target.value); if (isCreating) setTrainedSkills([]); }} className="w-full bg-arc-card border border-arc-border rounded px-2 py-1.5 focus:border-arc-accent focus:outline-none font-semibold text-slate-100">
                {AVAILABLE_CLASSES.map((entry) => <option key={entry.id} value={entry.id}>{entry.name} (Init {entry.initiativeDie}, HP {entry.startingHp}, MP {entry.startingMp})</option>)}
              </select>
              <div className="text-[11px] text-slate-400 pt-1 flex justify-between gap-2 flex-wrap">
                <span>Init: <strong className="text-emerald-400">{selectedClass.initiativeDie}</strong></span>
                <span>Gold: <strong className="text-arc-gold">{selectedClass.startingGold ?? 0} gp</strong></span>
                <span>Def: Ref <strong className="text-arc-accent">+{selectedClass.defenseBonuses.reflex}</strong> | Fort <strong className="text-emerald-400">+{selectedClass.defenseBonuses.fortitude}</strong> | Will <strong className="text-purple-400">+{selectedClass.defenseBonuses.will}</strong></span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Attributes (Base + Racial + Progression = Final)</span>
              <button type="button" onClick={() => setBaseAttributes({ ...STANDARD_ARRAY })} className="text-[10px] text-arc-accent hover:underline flex items-center gap-1">
                <RefreshCw size={10} /> Load Standard Array
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {ATTRIBUTE_KEYS.map((key) => {
                const baseVal = baseAttributes[key];
                const finalVal = finalAttributes[key];
                const bonus = bonuses[key];
                const mod = getModifier(finalVal);
                const cap = selectedRace.attributeCaps[key] ?? 20;
                const exceedsCap = finalVal > cap;

                return (
                  <div key={key} className={`p-2 bg-arc-bg rounded border text-center ${exceedsCap ? 'border-rose-500' : 'border-arc-border'}`}>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{key}</span>
                    <div className={`text-xl font-bold py-1 ${exceedsCap ? 'text-rose-400' : 'text-slate-100'}`}>{finalVal}</div>
                    <div className="flex items-center justify-between border-t border-arc-border pt-1">
                      <label htmlFor={`base-${key}`} className="text-[10px] text-slate-400">Base</label>
                      <input id={`base-${key}`} type="number" min={6} value={baseVal} onChange={(event) => {
                        const parsed = Number.parseInt(event.target.value, 10);
                        setBaseAttributes((previous) => ({ ...previous, [key]: Number.isNaN(parsed) ? 10 : parsed }));
                      }} className="w-12 text-right text-xs font-semibold bg-transparent text-slate-200 focus:outline-none focus:text-arc-accent" />
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-400">Bonus</span>
                      <span className={`text-[10px] font-bold ${bonus > 0 ? 'text-emerald-400' : bonus < 0 ? 'text-rose-400' : 'text-slate-400'}`}>{bonus >= 0 ? `+${bonus}` : bonus}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[10px] text-slate-400">Mod</span>
                      <span className={`text-[10px] font-bold ${mod >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{mod >= 0 ? `+${mod}` : mod}</span>
                    </div>
                    {exceedsCap && <div className="text-[9px] text-rose-400 mt-1">Cap {cap}</div>}
                  </div>
                );
              })}
            </div>
            {capErrors.length > 0 && <p className="text-[11px] text-rose-400" role="alert">{capErrors.join(' ')}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">Class Skills Training</span>
              <span className={`text-[11px] font-bold ${trainedSkills.length <= maxTrainedSkills ? 'text-emerald-400' : 'text-rose-400'}`}>
                {trainedSkills.length} / {maxTrainedSkills} Trained
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1 bg-arc-bg rounded border border-arc-border">
              {SKILLS.map((skill) => {
                const isClassSkill = selectedClass.classSkills.some((classSkill) =>
                  !!skill.name && skill.name.toLowerCase().startsWith(classSkill.toLowerCase()),
                );
                const isTrained = !!skill.name && trainedSkills.includes(skill.name);
                return (
                  <button key={skill.name} type="button" disabled={!isClassSkill && !isTrained} onClick={() => skill.name && toggleSkill(skill.name)}
                    className={`p-1.5 rounded text-left flex items-center justify-between border transition-all ${isTrained ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold' : isClassSkill ? 'bg-arc-card border-arc-border text-slate-300 hover:border-slate-500' : 'opacity-40 border-transparent text-slate-500 cursor-not-allowed'}`}>
                    <span className="truncate pr-1">{skill.name}</span>
                    <span className="text-[9px] uppercase font-mono text-slate-400">{skill.attribute}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-arc-border bg-arc-bg/80 space-y-2">
          {saveError && <p role="alert" className="text-xs text-rose-400">{saveError}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded border border-arc-border hover:bg-arc-card transition-colors text-slate-300">Cancel</button>
            <button type="button" onClick={handleSave} disabled={capErrors.length > 0} className="px-4 py-1.5 rounded bg-arc-accent text-slate-950 font-bold hover:brightness-110 flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
              <Check size={14} /> {isCreating ? 'Create Character' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
