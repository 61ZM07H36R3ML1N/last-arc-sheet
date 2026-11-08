import { WEAPONS } from '../data';
import type { WeaponItem } from '../data';
import type { CharacterSheet, Equipment } from '../types';

import {
  getSizeRank,
  resolveCharacterSize,
  type CreatureSize,
} from './characterSize';

import {
  resolveMeleeWeaponSkills,
} from './weaponSkills';

export type ResolvedAttackSkill =
  | '1-Handed'
  | '2-Handed'
  | 'Light Weapon'
  | 'Ranged'
  | 'Spellcraft';

export type EquipmentWeaponResolution =
  | {
      status: 'ready';
      canWield: true;
      weaponId: string;
      weaponName: string;
      category: string;
      characterSize: CreatureSize;
      weaponSize: CreatureSize;
      skills: ResolvedAttackSkill[];
    }
  | {
      status: 'too-large';
      canWield: false;
      weaponId: string;
      weaponName: string;
      skills: [];
      reason: string;
    }
  | {
      status: 'unresolved';
      canWield: false;
      weaponId: string;
      weaponName: string;
      skills: [];
      reason: string;
    };

const RANGED_CATEGORIES = new Set([
  'bows',
  'crossbows',
]);

const SPELLCRAFT_CATEGORY = 'staves';

function findCatalogWeapon(
  equipment: Equipment,
): WeaponItem | undefined {
  return WEAPONS.find(
    weapon => weapon.id === equipment.id,
  );
}

export function resolveEquippedWeaponSkills(
  sheet: CharacterSheet,
  equipment: Equipment,
  sizeOverride?: CreatureSize,
): EquipmentWeaponResolution {
  const weapon = findCatalogWeapon(equipment);

  if (!weapon) {
    return {
      status: 'unresolved',
      canWield: false,
      weaponId: equipment.id,
      weaponName: equipment.name,
      skills: [],
      reason: 'Weapon not found in the equipment catalog.',
    };
  }

  const characterSize = resolveCharacterSize(
    sheet.race,
    sizeOverride,
  );

  const weaponSize = weapon.size;

  // This size limit is enforced for melee weapons.
  // Ranged and staff weapon restrictions require
  // their own rules and are not inferred here.
  if (RANGED_CATEGORIES.has(weapon.category)) {
    return {
      status: 'ready',
      canWield: true,
      weaponId: weapon.id,
      weaponName: weapon.name,
      category: weapon.category,
      characterSize,
      weaponSize,
      skills: ['Ranged'],
    };
  }

  if (weapon.category === SPELLCRAFT_CATEGORY) {
    return {
      status: 'ready',
      canWield: true,
      weaponId: weapon.id,
      weaponName: weapon.name,
      category: weapon.category,
      characterSize,
      weaponSize,
      skills: ['Spellcraft'],
    };
  }

  const result = resolveMeleeWeaponSkills(
    getSizeRank(characterSize),
    getSizeRank(weaponSize),
  );

  if (result.canWield === false) {
    return {
      status: 'too-large',
      canWield: false,
      weaponId: weapon.id,
      weaponName: weapon.name,
      skills: [],
      reason: 'Weapon is too large for this character.',
    };
  }

  return {
    status: 'ready',
    canWield: true,
    weaponId: weapon.id,
    weaponName: weapon.name,
    category: weapon.category,
    characterSize,
    weaponSize,
    skills: result.skills,
  };
}