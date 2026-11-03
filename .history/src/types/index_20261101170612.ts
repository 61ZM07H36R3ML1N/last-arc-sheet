export type AttributeKey = 'str' | 'vit' | 'agi' | 'int' | 'mnd' | 'chr';

export type DamageType = 
  | 'blunt' | 'piercing' | 'slashing' 
  | 'cold' | 'dark' | 'electric' | 'fire' | 'holy' 
  | 'unaspected';

export type InitiativeDie = 'd4' | 'd6' | 'd8' | 'd10' | 'd12';

export interface ClassLevel {
  name: string;
  level: number;
}

export interface CharacterAttributes {
  str: number;
  vit: number;
  agi: number;
  int: number;
  mnd: number;
  chr: number;
}

export interface Equipment {
  id: string;
  name: string;
  slot: 'mainHand' | 'offHand' | 'armor' | 'accessory';
  bulk: number;
  damageDice?: string;       // e.g. "2d8"
  damageType?: DamageType;
  atkBonus?: number;
  reflexBonus?: number;
  dr?: number;
  maxAgiBonus?: number;
  specialText?: string;
}

export interface CharacterSheet {
  id: string;
  name: string;
  race: string;
  ethos: string;
  classes: ClassLevel[];
  baseAttributes: CharacterAttributes;
  currentHp: number;
  tempHp: number;
  currentMp: number;
  tempMp: number;
  breakStep: number;         // 0: Fine, 1: Step 1, 2: Step 2, 3: Step 3, 4: Broken
  heroPoints: number;
  gold: number;
  trainedSkills: string[];
  focusedSkills: string[];
  technicks: string[];
  talents: string[];
  equipped: {
    mainHand?: Equipment;
    offHand?: Equipment;
    armor?: Equipment;
    accessory1?: Equipment;
    accessory2?: Equipment;
  };
  inventory: Equipment[];
}