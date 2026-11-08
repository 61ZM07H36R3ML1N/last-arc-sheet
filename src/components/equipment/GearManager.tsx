import { useMemo } from 'react';
import { Shield, Swords, ShieldAlert, Package, Book, Eye, Music, Sparkles } from 'lucide-react';
import { WEAPONS, ARMORS, SHIELDS, MASKS, TOMES, INSTRUMENTS } from '../../data';
import { useCharacterStore } from '../../store/useCharacterStore';
import ClassCombatHelpers from '../combat/ClassCombatHelper';
import type { Equipment } from '../../types';
import { rollWeaponDamage, toCombatWeapon, type RollResult } from '../../engine/combat';


interface GearManagerProps {
  onRoll: (sides: number, label: string, explodes?: boolean) => void;
  onCombatResult: (label: string, result: RollResult) => void;
}

export default function GearManager({ onRoll, onCombatResult }: GearManagerProps) {
  const { sheet, importSheet } = useCharacterStore();

  const mainHand = sheet.equipped.mainHand;
  const offHand = sheet.equipped.offHand;
  const armor = sheet.equipped.armor;
  const mask = sheet.equipped.mask;
  const tome = sheet.equipped.tome;
  const instrument = sheet.equipped.instrument;

  const totalBulk = useMemo(() => {
    let bulk = 0;
    if (mainHand) bulk += mainHand.bulk || 0;
    if (offHand) bulk += offHand.bulk || 0;
    if (armor) bulk += armor.bulk || 0;
    if (mask) bulk += mask.bulk || 0;
    if (tome) bulk += tome.bulk || 0;
    if (instrument) bulk += instrument.bulk || 0;
    sheet.inventory?.forEach((i) => {
      bulk += i.bulk || 0;
    });
    return parseFloat(bulk.toFixed(1));
  }, [mainHand, offHand, armor, mask, tome, instrument, sheet.inventory]);

  const bulkLimit = sheet.baseAttributes.str;
  const isEncumbered = totalBulk > bulkLimit;

  const updateEquippedSlot = (slotKey: keyof typeof sheet.equipped, item?: Equipment) => {
    importSheet({
      ...sheet,
      equipped: {
        ...sheet.equipped,
        [slotKey]: item
      }
    });
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Bulk Tracker */}
      <div className="p-2.5 bg-arc-card rounded-lg border border-arc-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={15} className="text-arc-accent" />
          <span className="text-slate-300">
            Total Bulk: <strong className="text-slate-100">{totalBulk}</strong> / {bulkLimit}
          </span>
        </div>
        {isEncumbered && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
            <ShieldAlert size={12} /> Encumbered (-2 Speed)
          </span>
        )}
      </div>

      {/* Row 1: Weapons & Defenses */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-2.5 bg-arc-card rounded border border-arc-border space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Swords size={12} /> Main Hand Weapon
          </label>
          <select
            value={mainHand?.id || ''}
            onChange={(e) => {
              const item = WEAPONS.find((w) => w.id === e.target.value);
              updateEquippedSlot(
                'mainHand',
                item
                  ? {
                      id: item.id,
                      name: item.name,
                      slot: 'mainHand',
                      bulk: item.bulk,
                      damageDice: item.damage,
                      damageType: item.damageType,
                      atkBonus: item.atkBonus,
                      specialText: item.special
                    }
                  : undefined
              );
            }}
            className="w-full bg-arc-bg border border-arc-border rounded p-1.5 text-slate-200 focus:outline-none focus:border-arc-accent"
          >
            <option value="">None / Unarmed</option>
            {WEAPONS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.damage} {w.damageType})
              </option>
            ))}
          </select>
        </div>

        <div className="p-2.5 bg-arc-card rounded border border-arc-border space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Shield size={12} /> Off-Hand / Shield
          </label>
          <select
            value={offHand?.id || ''}
            onChange={(e) => {
              const item = SHIELDS.find((s) => s.id === e.target.value);
              updateEquippedSlot(
                'offHand',
                item
                  ? {
                      id: item.id,
                      name: item.name,
                      slot: 'offHand',
                      bulk: item.bulk,
                      atkBonus: item.atkBonus,
                      specialText: item.special
                    }
                  : undefined
              );
            }}
            className="w-full bg-arc-bg border border-arc-border rounded p-1.5 text-slate-200 focus:outline-none focus:border-arc-accent"
          >
            <option value="">None</option>
            {SHIELDS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.size})
              </option>
            ))}
          </select>
        </div>

        <div className="p-2.5 bg-arc-card rounded border border-arc-border space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400">Body Armor</label>
          <select
            value={armor?.id || ''}
            onChange={(e) => {
              const item = ARMORS.find((a) => a.id === e.target.value);
              updateEquippedSlot(
                'armor',
                item
                  ? {
                      id: item.id,
                      name: item.name,
                      slot: 'armor',
                      bulk: item.bulk,
                      reflexBonus: item.reflexBonus,
                      dr: item.dr,
                      maxAgiBonus: item.maxAgiBonus,
                      checkPenalty: item.checkPenalty,
                      specialText: item.special
                    }
                  : undefined
              );
            }}
            className="w-full bg-arc-bg border border-arc-border rounded p-1.5 text-slate-200 focus:outline-none focus:border-arc-accent"
          >
            <option value="">No Armor</option>
            {ARMORS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} (+{a.reflexBonus} Ref, DR {a.dr})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Specialized Class Gear (Masks, Tomes, Instruments) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-2.5 bg-arc-card rounded border border-arc-border space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Eye size={12} className="text-purple-400" /> Disguise Mask (Mstovari)
          </label>
          <select
            value={mask?.id || ''}
            onChange={(e) => {
              const item = MASKS.find((m) => m.id === e.target.value);
              updateEquippedSlot(
                'mask',
                item
                  ? {
                      id: item.id,
                      name: item.name,
                      slot: 'mask',
                      bulk: item.bulk,
                      specialText: item.special
                    }
                  : undefined
              );
            }}
            className="w-full bg-arc-bg border border-arc-border rounded p-1.5 text-slate-200 focus:outline-none focus:border-arc-accent"
          >
            <option value="">No Mask</option>
            {MASKS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <div className="p-2.5 bg-arc-card rounded border border-arc-border space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Book size={12} className="text-cyan-400" /> Arcane Tome (Scholar)
          </label>
          <select
            value={tome?.id || ''}
            onChange={(e) => {
              const item = TOMES.find((t) => t.id === e.target.value);
              updateEquippedSlot(
                'tome',
                item
                  ? {
                      id: item.id,
                      name: item.name,
                      slot: 'tome',
                      bulk: item.bulk,
                      specialText: item.special
                    }
                  : undefined
              );
            }}
            className="w-full bg-arc-bg border border-arc-border rounded p-1.5 text-slate-200 focus:outline-none focus:border-arc-accent"
          >
            <option value="">No Tome</option>
            {TOMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.field})
              </option>
            ))}
          </select>
        </div>

        <div className="p-2.5 bg-arc-card rounded border border-arc-border space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Music size={12} className="text-amber-400" /> Instrument (Bard)
          </label>
          <select
            value={instrument?.id || ''}
            onChange={(e) => {
              const item = INSTRUMENTS.find((inst) => inst.id === e.target.value);
              updateEquippedSlot(
                'instrument',
                item
                  ? {
                      id: item.id,
                      name: item.name,
                      slot: 'instrument',
                      bulk: item.bulk,
                      performanceBonus: item.performanceBonus,
                      specialText: item.special
                    }
                  : undefined
              );
            }}
            className="w-full bg-arc-bg border border-arc-border rounded p-1.5 text-slate-200 focus:outline-none focus:border-arc-accent"
          >
            <option value="">No Instrument</option>
            {INSTRUMENTS.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name} (+{inst.performanceBonus})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Ready Combat Actions */}
      <div className="space-y-2 pt-1">
        <span className="text-[10px] uppercase font-bold text-slate-400">Ready Actions</span>

        {mainHand ? (
          <div className="p-3 bg-arc-card rounded border border-arc-border flex justify-between items-center">
            <div className="space-y-1">
              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                {mainHand.name}
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-arc-bg border border-arc-border text-slate-400 capitalize">
                  {mainHand.damageType}
                </span>
                {mainHand.specialText && (
                  <span
                    className="cursor-help text-[10px] text-amber-400 flex items-center gap-0.5"
                    title={mainHand.specialText}
                  >
                    <Sparkles size={11} /> Special
                  </span>
                )}
              </div>
              <div className="text-slate-400 text-[11px]">
                Formula: <span className="text-slate-200 font-mono">{mainHand.damageDice}</span> • Bulk:{' '}
                <span className="text-slate-200 font-mono">{mainHand.bulk}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const weapon = toCombatWeapon(mainHand);
                const result = rollWeaponDamage(sheet, weapon, {
                  attribute: 'str'
                });
                onCombatResult(`${mainHand.name} Damage`, result);
              }}
              className="px-3 py-1 bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded text-arc-accent font-semibold transition-all shadow-sm"
            >
              Roll Damage
            </button>
          </div>
        ) : (
          <div className="p-2.5 bg-arc-card rounded border border-arc-border text-slate-400 italic">
            No main weapon equipped (Unarmed).
          </div>
        )}

        {offHand && (
          <div className="p-3 bg-arc-card rounded border border-arc-border flex justify-between items-center">
            <div className="space-y-1">
              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                {offHand.name}
                {offHand.specialText && (
                  <span
                    className="cursor-help text-[10px] text-amber-400 flex items-center gap-0.5"
                    title={offHand.specialText}
                  >
                    <Sparkles size={11} /> Special
                  </span>
                )}
              </div>
              <div className="text-slate-400 text-[11px]">
                Opposed Block Reaction (+{offHand.atkBonus || 0} to check)
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRoll(20, `${offHand.name} Block Check (+${offHand.atkBonus || 0})`, false)}
              className="px-3 py-1 bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded text-emerald-400 font-semibold transition-all shadow-sm"
            >
              Block (d20)
            </button>
          </div>
        )}
      </div>

      {/* Interactive Class Arcana & Resonance Helpers */}
      <ClassCombatHelpers onRoll={onRoll} />
    </div>
  );
}