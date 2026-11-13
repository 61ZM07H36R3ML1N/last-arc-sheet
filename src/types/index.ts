import type { ZodiacSign } from '../data/zodiac';
import type { AbilityProgressionState } from './abilities';

export type AttributeKey = 'str' | 'vit' | 'agi' | 'int' | 'mnd' | 'chr';

export type DamageType = 
  | 'blunt' | 'piercing' | 'slashing' 
  | 'cold' | 'dark' | 'electric' | 'fire' | 'holy' 
  | 'unaspected';

export type EquipmentSlot = 
  | 'mainHand' 
  | 'offHand' 
  | 'armor' 
  | 'accessory'
  | 'mask'
  | 'tome'
  | 'instrument';

export interface Equipment {
  id: string;
  name: string;
  slot: EquipmentSlot;
  bulk: number;
  damageDice?: string;
  damageType?: DamageType;
  atkBonus?: number;
  reflexBonus?: number;
  dr?: number;
  maxAgiBonus?: number;
  checkPenalty?: number;
  performanceBonus?: number;
  specialText?: string;
  availability?: string;
}

export interface CharacterSheet {
  id: string;
  name: string;
  race: string;
  ethos: string;
  zodiacSign: ZodiacSign;

abilityProgression: AbilityProgressionState;

  classes: Array<{
    name: string;
    level: number;
  }>;

  // Raw attribute scores before racial and level bonuses
  baseAttributes: {
    str: number;
    vit: number;
    agi: number;
    int: number;
    mnd: number;
    chr: number;
  };

  // Human / Half-Elf flexible racial +2 selection
  racialAttributeChoice?: AttributeKey;

  // Attribute increases earned through character progression
  attributeIncreases?: Partial<Record<AttributeKey, number>>;

  currentHp: number;
  tempHp: number;
  currentMp: number;
  tempMp: number;

  breakStep: number;
  heroPoints: number;
  gold: number;
  notes: string;

  trainedSkills: string[];
  focusedSkills: string[];
  technicks: string[];
  talents: string[];

  equipped: {
    mainHand?: Equipment;
    offHand?: Equipment;
    armor?: Equipment;
    mask?: Equipment;
    tome?: Equipment;
    instrument?: Equipment;
    accessory1?: Equipment;
    accessory2?: Equipment;
  };

  inventory: Equipment[];
}