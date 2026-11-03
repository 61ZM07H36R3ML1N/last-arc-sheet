/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useMemo } from 'react';
import { Shield, Swords, ShieldAlert, Package, Check } from 'lucide-react';
import { WEAPONS, ARMORS, SHIELDS } from '../../data';
import { useCharacterStore } from '../../store/useCharacterStore';

interface GearManagerProps {
  onRoll: (sides: number, label: string, explodes?: boolean) => void;
}

export default function GearManager({ onRoll }: GearManagerProps) {
  const { sheet, importSheet } = useCharacterStore();

  const mainHand = sheet.equipped.mainHand;
  const offHand = sheet.equipped.offHand;
  const armor = sheet.equipped.armor;

  // Bulk audit
  const totalBulk = useMemo(() => {
    let bulk = 0;
    if (mainHand) bulk += mainHand.bulk;
    if (offHand) bulk += offHand.bulk;
    if (armor) bulk += armor.bulk;
    sheet.inventory.forEach((i) => { bulk += i.bulk; });
    return parseFloat(bulk.toFixed(1));
  }, [mainHand, offHand, armor, sheet.inventory]);

  // Bulk limit based on Str
  const bulkLimit = sheet.baseAttributes.str;
  const isEncumbered = totalBulk > bulkLimit;

  // Equip selectors
  const setMainHand = (wId: string) => {
    const weapon = WEAPONS.find((w) => w.id === wId);
    importSheet({
      ...sheet,
      equipped: {
        ...sheet.equipped,
        mainHand: weapon
          ? {
              id: weapon.id,
              name: weapon.name,
              slot: 'mainHand',
              bulk: weapon.bulk,
              damageDice: weapon.damage,
              damageType: weapon.damageType,
              atkBonus: weapon.atkBonus
            }
          : undefined
      }
    });
  };

  const setOffHand = (sId: string) => {
    const shield = SHIELDS.find((s) => s.id === sId);
    importSheet({
      ...sheet,
      equipped: {
        ...sheet.equipped,
        offHand: shield
          ? {
              id: shield.id,
              name: shield.name,
              slot: 'offHand',
              bulk: shield.bulk,
              atkBonus: shield.atkBonus
            }
          : undefined
      }
    });
  };

  const setArmor = (aId: string) => {
    const arm = ARMORS.find((a) => a.id === aId);
    importSheet({
      ...sheet,
      equipped: {
        ...sheet.equipped,
        armor: arm
          ? {
              id: arm.id,
              name: arm.name,
              slot: 'armor',
              bulk: arm.bulk,
              reflexBonus: arm.reflexBonus,
              dr: arm.dr,
              maxAgiBonus: arm.maxAgiBonus
            }
          : undefined
      }
    });
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Bulk Status Banner */}
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

      {/* Equipment Slots Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Main Hand */}
        <div className="p-2.5 bg-arc-card rounded border border-arc-border space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Swords size={12} /> Main Hand Weapon
          </label>
          <select
            value={mainHand?.id || ''}
            onChange={(e) => setMainHand(e.target.value)}
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

        {/* Off Hand */}
        <div className="p-2.5 bg-arc-card rounded border border-arc-border space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
            <Shield size={12} /> Off-Hand / Shield
          </label>
          <select
            value={offHand?.id || ''}
            onChange={(e) => setOffHand(e.target.value)}
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

        {/* Armor */}
        <div className="p-2.5 bg-arc-card rounded border border-arc-border space-y-1">
          <label className="text-[10px] uppercase font-bold text-slate-400">Body Armor</label>
          <select
            value={armor?.id || ''}
            onChange={(e) => setArmor(e.target.value)}
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

      {/* Quick Attack & Block Actions */}
      <div className="space-y-2 pt-1">
        <span className="text-[10px] uppercase font-bold text-slate-400">Ready Actions</span>

        {mainHand ? (
          <div className="p-3 bg-arc-card rounded border border-arc-border flex justify-between items-center">
            <div>
              <div className="font-bold text-slate-100 flex items-center gap-1.5">
                {mainHand.name}
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-arc-bg border border-arc-border text-slate-400">
                  {mainHand.damageType}
                </span>
              </div>
              <div className="text-slate-400 text-[11px] mt-0.5">
                Formula: {mainHand.damageDice} • Bulk: {mainHand.bulk}
              </div>
            </div>
            <button
              onClick={() => {
                const sides = parseInt(mainHand.damageDice?.split('d')[1]?.split(/[+-]/)[0] || '8');
                onRoll(sides, `${mainHand.name} Damage`, true);
              }}
              className="px-3 py-1 bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded text-arc-accent font-semibold"
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
            <div>
              <div className="font-bold text-slate-100">{offHand.name}</div>
              <div className="text-slate-400 text-[11px] mt-0.5">Opposed Block Reaction (Opposing Roll)</div>
            </div>
            <button
              onClick={() => onRoll(20, `${offHand.name} Block Check`, false)}
              className="px-3 py-1 bg-arc-bg hover:bg-arc-cardHover border border-arc-border rounded text-emerald-400 font-semibold"
            >
              Block (d20)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}