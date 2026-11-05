/* eslint-disable @typescript-eslint/no-unused-vars */
import racesData from './races.json';
import classesData from './baseClasses.json';
import skillsData from './skills.json';
import equipmentData from './equipment.json';
import type { DamageType } from '../types';

export interface ClassItem {
  id: string;
  name: string;
  type?: 'base' | 'advanced' | string;
  initiativeDie: string;
  startingHp: number;
  hpPerLevel: number;
  startingMp: number;
  mpPerLevel: number;
  startingGold?: number;
  baseTrainedSkillsCount: number;
  defenseBonuses: {
    reflex: number;
    fortitude: number;
    will: number;
  };
  startingTechnicks: string[];
  classSkills: string[];
  requirements?: {
    level: number;
    skills?: string[];
    technicks?: string[];
    talents?: string[];
    special?: string;
  };
}

export interface RaceItem {
  id: string;
  name: string;
  size: string;
  speed: number;
  attributeAdjustments: Record<string, number>;
  attributeCaps: Record<string, number>;
  traits: Array<{ name: string; description: string }>;
}

export interface SkillItem {
  name: string;
  attribute: string;
  armorPenalty?: boolean;
  description?: string;
}

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
  special?: string;
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
  special?: string;
}

export interface ShieldItem {
  id: string;
  name: string;
  size: 'Tiny' | 'Small' | 'Medium' | 'Large';
  cost: number;
  bulk: number;
  atkBonus: number;
  availability: string;
  special?: string;
}

export interface MaskItem {
  id: string;
  name: string;
  slot?: 'mask';
  cost: number;
  bulk: number;
  availability: string;
  special: string;
}

export interface TomeItem {
  id: string;
  name: string;
  field: string;
  cost: number;
  bulk: number;
  availability: string;
  special: string;
}

export interface InstrumentItem {
  id: string;
  name: string;
  cost: number;
  performanceBonus: number;
  bulk: number;
  availability: string;
  special: string;
}

export const RACES = racesData as unknown as RaceItem[];
export const CLASSES = classesData as ClassItem[];
export const SKILLS = skillsData as SkillItem[];

export const WEAPONS = (equipmentData.weapons || []) as WeaponItem[];
export const ARMORS = (equipmentData.armors || []) as ArmorItem[];
export const SHIELDS = (equipmentData.shields || []) as ShieldItem[];
export const MASKS = (equipmentData.masks || []) as MaskItem[];
export const TOMES = (equipmentData.tomes || []) as TomeItem[];
export const INSTRUMENTS = (equipmentData.instruments || []) as InstrumentItem[];

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