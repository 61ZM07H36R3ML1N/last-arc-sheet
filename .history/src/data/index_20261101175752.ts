import racesData from './races.json';
import classesData from './baseClasses.json';
import skillsData from './skills.json';
import type { AttributeKey } from '../types';

export interface RaceTrait {
  name: string;
  description: string;
}

export interface RaceDefinition {
  id: string;
  name: string;
  size: 'Small' | 'Medium' | 'Large';
  speed: number;
  specialSenses: string;
  languages: string[];
  attributeAdjustments: Partial<Record<AttributeKey, number>> & { any?: number };
  attributeCaps: Record<AttributeKey, number>;
  traits: RaceTrait[];
}

export interface ClassDefinition {
  id: string;
  name: string;
  initiativeDie: string;
  startingHp: number;
  hpPerLevel: number;
  startingMp: number;
  mpPerLevel: number;
  startingGold: number;
  baseTrainedSkillsCount: number;
  defenseBonuses: {
    fortitude: number;
    reflex: number;
    will: number;
  };
  startingTechnicks: string[];
  classSkills: string[];
}

export interface SkillDefinition {
  name: string;
  attribute: AttributeKey;
  armorPenalty: boolean;
  trainedOnly: boolean;
}

export const RACES = racesData as RaceDefinition[];
export const CLASSES = classesData as ClassDefinition[];
export const SKILLS = skillsData as SkillDefinition[];

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