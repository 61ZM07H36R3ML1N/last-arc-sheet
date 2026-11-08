import { useState, useMemo } from 'react';
import { X, Check, RefreshCw, User } from 'lucide-react';
import { RACES, ETHOS_LIST, SKILLS } from '../../data';
import { useCharacterStore } from '../../store/useCharacterStore';
import { getModifier } from '../../engine/formulas';
import type { AttributeKey } from '../../types';
import { ZODIAC_LIST, ZODIAC_SIGNS, type ZodiacSign } from '../../data/zodiac';
import { BASE_CLASSES, createCharacter, editCharacter } from '../../engine/characterLifecycle';



type CharacterEditorMode = 'create' | 'edit';

interface CharacterEditorModalProps {

  isOpen: boolean;

  onClose: () => void;

  mode?: CharacterEditorMode;

}



const ATTRIBUTE_KEYS: AttributeKey[] = ['str', 'vit', 'agi', 'int', 'mnd', 'chr'];

const STANDARD_ARRAY = [16, 14, 12, 10, 10, 8];

const AVAILABLE_CLASSES = BASE_CLASSES;



export default function CharacterEditorModal({ isOpen, onClose, mode = 'edit' }: CharacterEditorModalProps) {
  if (!isOpen) return null;
  return <CharacterEditorForm key={mode} onClose={onClose} mode={mode} />;
}

function CharacterEditorForm({ onClose, mode }: { onClose: () => void; mode: CharacterEditorMode }) {

  const isCreating = mode === 'create';

  const { sheet, importSheet } = useCharacterStore();



// Local draft state

  const [name, setName] = useState(isCreating ? '' : sheet.name);

  const [raceId, setRaceId] = useState(() => {

    if (isCreating) return RACES[0].id;
    const found = RACES.find((r) => r.name.toLowerCase() === sheet.race.toLowerCase());

    return found ? found.id : RACES[0].id;

  });

  const [ethos, setEthos] = useState(isCreating ? ETHOS_LIST[0] : sheet.ethos);

  const [zodiacSign, setZodiacSign] = useState<ZodiacSign>(isCreating ? 'Aries' : (sheet.zodiacSign || 'Aries'));

  const [classId, setClassId] = useState(() => {

    if (isCreating) return AVAILABLE_CLASSES[0].id;
    const firstClass = sheet.classes[0]?.name || 'Warrior';

    const found = AVAILABLE_CLASSES.find((c) => c.name.toLowerCase() === firstClass.toLowerCase());

    return found ? found.id : AVAILABLE_CLASSES[0].id;

  });

  const [level, setLevel] = useState(isCreating ? 1 : (sheet.classes[0]?.level || 1));



// Flexible attribute selection for Human / Half-Elf

  const [flexibleAttr, setFlexibleAttr] = useState<AttributeKey>('str');



// Base raw scores (before racial adjustments)

  const [baseAttributes, setBaseAttributes] = useState<Record<AttributeKey, number>>({

    ...(isCreating ? { str: 16, vit: 14, agi: 12, int: 10, mnd: 10, chr: 8 } : sheet.baseAttributes)

  });



  const [trainedSkills, setTrainedSkills] = useState<string[]>(isCreating ? [] : [...sheet.trainedSkills]);



// Selected race and class objects

  const selectedRace = useMemo(() => RACES.find((r) => r.id === raceId) ?? RACES[0], [raceId]);

  const selectedClass = useMemo(

    () => AVAILABLE_CLASSES.find((c) => c.id === classId) ?? AVAILABLE_CLASSES[0],

    [classId]

  );



// Compute final attributes applying racial adjustments and checking caps

  const finalAttributes = useMemo(() => {

    const finalAttrs = { ...baseAttributes };

    const adjustments = selectedRace.attributeAdjustments;



    ATTRIBUTE_KEYS.forEach((key) => {

      let adj = adjustments[key] ?? 0;

      if (adjustments.any && flexibleAttr === key) {

        adj += adjustments.any;

      }

      const raw = baseAttributes[key] + adj;

      const cap = selectedRace.attributeCaps[key] ?? 20;

      finalAttrs[key] = Math.min(raw, cap);

    });



    return finalAttrs;

  }, [baseAttributes, selectedRace, flexibleAttr]);



// Skill training allowances

  const intMod = getModifier(isCreating ? finalAttributes.int : sheet.baseAttributes.int);

  const maxTrainedSkills = useMemo(() => {

    let count = selectedClass.baseTrainedSkillsCount + intMod;

    if (selectedRace.traits.some((t) => t.name === 'Skilled')) {

      count += 1;

    }

    return Math.max(1, count);

  }, [selectedClass, intMod, selectedRace]);



// Toggle skills in/out of trained list

  const toggleSkill = (skillName: string) => {

    if (trainedSkills.includes(skillName)) {

      setTrainedSkills(trainedSkills.filter((s) => s !== skillName));

    } else {

      if (trainedSkills.length < maxTrainedSkills) {

        setTrainedSkills([...trainedSkills, skillName]);

      }

    }

  };



// Standard Array quick preset

  const applyStandardArray = () => {

    setBaseAttributes({

      str: STANDARD_ARRAY[0],

      vit: STANDARD_ARRAY[1],

      agi: STANDARD_ARRAY[2],

      int: STANDARD_ARRAY[3],

      mnd: STANDARD_ARRAY[4],

      chr: STANDARD_ARRAY[5]

    });

  };



// Save changes to Zustand store

  const handleSave = () => {

  if (isCreating) {

    const newSheet = createCharacter({

      id: crypto.randomUUID(),

      name,

      race: selectedRace.name,

      ethos,

      zodiacSign,

      classId: selectedClass.id,

      level,

      baseAttributes: finalAttributes,

      trainedSkills,

    });



    const confirmed = window.confirm(

      'Creating a new character will replace your currently active character. ' +

      'Export your existing character first if you want to keep it.\n\n' +

      'Continue?'

    );



    if (!confirmed) return;



    importSheet(newSheet);

    onClose();

    return;

  }



  const updatedSheet = editCharacter(sheet, {

    name,

    ethos,

    zodiacSign,

    trainedSkills,

  });



  importSheet(updatedSheet);

  onClose();

};







  return (

    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">

      <div className="bg-arc-card border border-arc-border w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* Header */}

        <div className="p-4 border-b border-arc-border flex items-center justify-between bg-arc-bg/50">

          <div className="flex items-center gap-2">

            <User className="text-arc-accent" size={18} />

            <h2 className="text-base font-bold text-slate-100 tracking-wide">{isCreating ? 'Create Character' : 'Edit Character'}</h2>

          </div>

          <button

            onClick={onClose}

            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-arc-border transition-colors"

          >

            <X size={18} />

          </button>

        </div>



        {/* Modal Form Body */}

        <div className="p-4 overflow-y-auto space-y-5 text-xs text-slate-200">

          {/* Identity Grid: Name, Zodiac, Ethos, Level */}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">

            <div>

              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Character Name</label>

              <input

                type="text"

                value={name}

                onChange={(e) => setName(e.target.value)}

                placeholder="e.g. Kress"

                className="w-full bg-arc-bg border border-arc-border rounded px-2.5 py-1.5 focus:border-arc-accent focus:outline-none"

              />

            </div>



            <div>

              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Zodiac Sign</label>

              <select

                value={zodiacSign}

                onChange={(e) => setZodiacSign(e.target.value as ZodiacSign)}

                className="w-full bg-arc-bg border border-arc-border rounded px-2 py-1.5 focus:border-arc-accent focus:outline-none"

              >

                {ZODIAC_LIST.map((sign) => (

                  <option key={sign} value={sign}>

                    {ZODIAC_SIGNS[sign].symbol} {sign} ({ZODIAC_SIGNS[sign].element})

                  </option>

                ))}

              </select>

            </div>



            <div>

              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Ethos (Alignment)</label>

              <select

                value={ethos}

                onChange={(e) => setEthos(e.target.value)}

                className="w-full bg-arc-bg border border-arc-border rounded px-2 py-1.5 focus:border-arc-accent focus:outline-none"

              >

                {ETHOS_LIST.map((e) => (

                  <option key={e} value={e}>

                    {e}

                  </option>

                ))}

              </select>

            </div>



            <div>

              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Level</label>

              <input

                type="number"

                min={1}

                max={20}

                value={level}
              disabled={!isCreating}

                onChange={(e) => setLevel(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}

                className="w-full bg-arc-bg border border-arc-border rounded px-2.5 py-1.5 focus:border-arc-accent focus:outline-none"

              />

            </div>

          </div>



          {/* Race and Class Selectors */}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* Race Picker */}

            <div className="p-3 bg-arc-bg rounded-lg border border-arc-border space-y-2">

              <label className="block text-[10px] uppercase font-bold text-slate-400">Race & Ancestry</label>

              <select

                value={raceId}
              disabled={!isCreating}

                onChange={(e) => setRaceId(e.target.value)}

                className="w-full bg-arc-card border border-arc-border rounded px-2 py-1.5 focus:border-arc-accent focus:outline-none font-semibold text-slate-100"

              >

                {RACES.map((r) => (

                  <option key={r.id} value={r.id}>

                    {r.name} ({r.size}, Spd {r.speed})

                  </option>

                ))}

              </select>



              {/* Flexible +2 picker for Human/Half-Elf */}

              {selectedRace.attributeAdjustments.any && (

                <div className="pt-1 flex items-center justify-between text-[11px]">

                  <span className="text-amber-400 font-semibold">+2 Racial Choice:</span>

                  <select

                    value={flexibleAttr}
                  disabled={!isCreating}

                    onChange={(e) => setFlexibleAttr(e.target.value as AttributeKey)}

                    className="bg-arc-card border border-arc-border rounded px-1.5 py-0.5 text-slate-200 uppercase font-bold"

                  >

                    {ATTRIBUTE_KEYS.map((k) => (

                      <option key={k} value={k}>

                        {k}

                      </option>

                    ))}

                  </select>

                </div>

              )}



              {/* Racial Trait Pills */}

              <div className="pt-1 flex flex-wrap gap-1">

                {selectedRace.traits.map((trait) => (

                  <span

                    key={trait.name}

                    title={trait.description}

                    className="text-[10px] px-1.5 py-0.5 rounded bg-arc-border/60 text-slate-300 border border-slate-700/50"

                  >

                    {trait.name}

                  </span>

                ))}

              </div>

            </div>



            {/* Base Class Picker */}

            <div className="p-3 bg-arc-bg rounded-lg border border-arc-border space-y-2">

              <label className="block text-[10px] uppercase font-bold text-slate-400">Base Class</label>

              <select

                value={classId}
              disabled={!isCreating}

                onChange={(e) => {

                  setClassId(e.target.value);

                  setTrainedSkills([]); // Reset skill selection to prevent illegal out-of-class choices*

                }}

                className="w-full bg-arc-card border border-arc-border rounded px-2 py-1.5 focus:border-arc-accent focus:outline-none font-semibold text-slate-100"

              >

                {AVAILABLE_CLASSES.map((c) => (

                  <option key={c.id} value={c.id}>

                    {c.name} (Init {c.initiativeDie}, HP {c.startingHp}, MP {c.startingMp})

                  </option>

                ))}

              </select>



              <div className="text-[11px] text-slate-400 pt-1 flex justify-between">

                <span>Init: <strong className="text-emerald-400">{selectedClass.initiativeDie}</strong></span>

                <span>Gold: <strong className="text-arc-gold">{selectedClass.startingGold ?? 0} gp</strong></span>

                <span>

                  Def: Ref <strong className="text-arc-accent">+{selectedClass.defenseBonuses.reflex}</strong> | Fort <strong className="text-emerald-400">+{selectedClass.defenseBonuses.fortitude}</strong> | Will <strong className="text-purple-400">+{selectedClass.defenseBonuses.will}</strong>

                </span>

              </div>

            </div>

          </div>



          {/* ATTRIBUTES SECTION */}

          <div className="space-y-2">

            <div className="flex items-center justify-between">

              <span className="text-[10px] uppercase font-bold text-slate-400">

                Attributes (Base Score + Racial = Final)

              </span>

              <button

                type="button"

                onClick={applyStandardArray}
              disabled={!isCreating}

                className="text-[10px] text-arc-accent hover:underline flex items-center gap-1"

              >

                <RefreshCw size={10} /> Load Standard Array (16, 14, 12, 10, 10, 8)

              </button>

            </div>



            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">

              {ATTRIBUTE_KEYS.map((key) => {

                const baseVal = baseAttributes[key];

                const finalVal = isCreating ? finalAttributes[key] : sheet.baseAttributes[key];

                const mod = getModifier(finalVal);

                const cap = selectedRace.attributeCaps[key] ?? 20;



                return (

                  <div key={key} className="p-2 bg-arc-bg rounded border border-arc-border text-center">

                    <span className="text-[10px] uppercase font-bold text-slate-400">{key}</span>

                    <input

                      type="number"

                      min={6}

                      max={cap}

                      value={baseVal}
                    disabled={!isCreating}

                      onChange={(e) =>

                        setBaseAttributes({

                          ...baseAttributes,

                          [key]: parseInt(e.target.value) || 10

                        })

                      }

                      className="w-full text-center font-bold bg-transparent border-b border-arc-border py-0.5 focus:outline-none focus:border-arc-accent"

                    />

                    <div className="text-[10px] text-slate-400 mt-1 flex justify-between px-1">

                      <span>Tot: <strong className="text-slate-100">{finalVal}</strong></span>

                      <span className={mod >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>

                        {mod >= 0 ? `+${mod}` : mod}

                      </span>

                    </div>

                  </div>

                );

              })}

            </div>

          </div>



          {/* SKILLS SELECTION */}

          <div className="space-y-2">

            <div className="flex items-center justify-between">

              <span className="text-[10px] uppercase font-bold text-slate-400">Class Skills Training</span>

              <span className={`text-[11px] font-bold ${trainedSkills.length === maxTrainedSkills ? 'text-emerald-400' : 'text-amber-400'}`}>

                {trainedSkills.length} / {maxTrainedSkills} Trained

              </span>

            </div>



            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto p-1 bg-arc-bg rounded border border-arc-border">

              {SKILLS.map((skill) => {

                const isClassSkill = selectedClass.classSkills.some(

                  (cs) => !!skill.name && skill.name.toLowerCase().startsWith(cs.toLowerCase())

                );

                const isTrained = !!skill.name && trainedSkills.includes(skill.name);



                return (

                  <button

                    key={skill.name}

                    type="button"

                    disabled={!isClassSkill && !isTrained}

                    onClick={() => skill.name && toggleSkill(skill.name)}

                    className={`p-1.5 rounded text-left flex items-center justify-between border transition-all ${

                      isTrained

                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-semibold'

                        : isClassSkill

                        ? 'bg-arc-card border-arc-border text-slate-300 hover:border-slate-500'

                        : 'opacity-40 border-transparent text-slate-500 cursor-not-allowed'

                    }`}

                  >

                    <span className="truncate pr-1">{skill.name}</span>

                    <span className="text-[9px] uppercase font-mono text-slate-400">{skill.attribute}</span>

                  </button>

                );

              })}

            </div>

          </div>

        </div>



        {/* Footer Actions */}

        <div className="p-3 border-t border-arc-border bg-arc-bg/80 flex justify-end gap-2">

          <button

            onClick={onClose}

            className="px-3 py-1.5 rounded border border-arc-border hover:bg-arc-card transition-colors text-slate-300"

          >

            Cancel

          </button>

          <button

            onClick={handleSave}

            className="px-4 py-1.5 rounded bg-arc-accent text-slate-950 font-bold hover:brightness-110 flex items-center gap-1.5 transition-all shadow-md"

          >

            <Check size={14} /> {isCreating ? 'Create Character' : 'Save Changes'}

          </button>

        </div>

      </div>

    </div>

  );

}