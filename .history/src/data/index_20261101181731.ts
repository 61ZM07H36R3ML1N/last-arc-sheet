import racesData from './races.json';
import classesData from './baseClasses.json';
import skillsData from './skills.json';
import equipmentData from './equipment.json';
import type { AttributeKey, DamageType } from '../types';

export interface WeaponItem {
  id: string;
  name: string;
  category: string;
  size: 'Tiny' | 'Small' | 'Medium' | 'Large';
  damage: string;
  damageType: DamageType;
  cost: number;
  bulk: number;
  atkBonus: number;
  capacity?: number;
  availability: string;
}

export interface ArmorItem {
  id: string;
  name: string;
  type: 'light' | 'heavy' | 'mystic';
  cost: number;
  bulk: number;
  reflexBonus: number;
  dr: number;
  maxAgiBonus: number;
  checkPenalty: number;
  availability: string;
}

export interface ShieldItem {
  id: string;
  name: string;
  size: 'Tiny' | 'Small' | 'Medium' | 'Large';
  cost: number;
  bulk: number;
  atkBonus: number;
  availability: string;
}

export const RACES = racesData;
export const CLASSES = classesData;
export const SKILLS = skillsData;
export const WEAPONS = equipmentData.weapons as WeaponItem[];
export const ARMORS = equipmentData.armors as ArmorItem[];
export const SHIELDS = equipmentData.shields as ShieldItem[];

export const ETHOS_LIST = [
  'Pure Good',
  'Neutral Good',
  'Corrupt Good',
  'Pure Neutral',
  'Neutral',
  'Corrupt Neutral',
  'Pure Evil',
  'Neutral Evil',
  'Corrupt Evil'
] as const;