import type { CharacterSheet, Equipment } from '../types';
import { getModifier } from './formulas';
import { calculateSkill } from './skills';
import { getBreakState } from './breakGauge';

export const ATTACK_SKILLS = [
  '1-Handed',
  '2-Handed',
  'Light Weapon',
  'Ranged',
  'Spellcraft',
  'Unarmed',
] as const;

export type AttackSkill = (typeof ATTACK_SKILLS)[number];
export type DamageAttribute = 'str' | 'none';

export interface DamageExpression {
  count: number;
  sides: number;
  flatBonus: number;
}

export interface CombatWeapon {
  name: string;
  damageDice: string;
  atkBonus: number;
  damageType?: string;
}

export interface AttackOptions {
  skill: AttackSkill;
  skillBonus: number;
  situationalBonus?: number;
  breakPenalty?: number;
}

export interface DamageOptions {
  attribute: DamageAttribute;
  situationalBonus?: number;
  applyWandwork?: boolean;
}

export interface RollResult {
  rolls: number[];
  diceTotal: number;
  modifier: number;
  total: number;
  breakdown: string[];
}

type RandomSource = () => number;

function rollDie(
  sides: number,
  random: RandomSource,
): number {
  const value = random();

  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value >= 1
  ) {
    throw new Error(
      'Random source must return a value in [0, 1).',
    );
  }

  return Math.floor(value * sides) + 1;
}

export function rollExplodingDamageDie(
  sides: number,
  random: RandomSource = Math.random,
): { rolls: number[] } {
  if (!Number.isSafeInteger(sides) || sides < 2) {
    throw new Error('Invalid die size.');
  }

  const rolls: number[] = [];
  const MAX_ROLLS = 1000;

  for (let i = 0; i < MAX_ROLLS; i++) {
    const result = rollDie(sides, random);

    rolls.push(result);

    // Stop when the die does not roll its maximum.
    if (result !== sides) {
      return { rolls };
    }
  }

  throw new Error(
    'Exploding die exceeded maximum roll count.',
  );
}

export function parseDamageExpression(
  expression: string,
): DamageExpression {
  const normalized = expression.replace(/\s+/g, '');

  const match = /^(\d+)d(\d+)([+-]\d+)?$/i.exec(
    normalized,
  );

  if (!match) {
    throw new Error(
      `Invalid damage expression: ${expression}`,
    );
  }

  const count = Number(match[1]);
  const sides = Number(match[2]);
  const flatBonus = Number(match[3] ?? 0);

  if (
    !Number.isSafeInteger(count) ||
    !Number.isSafeInteger(sides) ||
    !Number.isSafeInteger(flatBonus) ||
    count < 1 ||
    count > 100 ||
    sides < 2 ||
    sides > 1000
  ) {
    throw new Error(
      `Unsupported damage expression: ${expression}`,
    );
  }

  return { count, sides, flatBonus };
}

export function toCombatWeapon(
  equipment: Equipment,
): CombatWeapon {
  if (!equipment.damageDice) {
    throw new Error(
      `${equipment.name} has no weapon damage expression.`,
    );
  }

  return {
    name: equipment.name,
    damageDice: equipment.damageDice,
    atkBonus: equipment.atkBonus ?? 0,
    damageType: equipment.damageType,
  };
}

export function calculateAttackModifier(
  weapon: CombatWeapon,
  options: AttackOptions,
): number {
  return (
    options.skillBonus +
    weapon.atkBonus +
    (options.situationalBonus ?? 0) +
    (options.breakPenalty ?? 0)
  );
}

export function calculateCharacterAttackModifier(
  sheet: CharacterSheet,
  weapon: CombatWeapon,
  skillName: AttackSkill,
  situationalBonus = 0,
  breakPenalty = 0,
): number {
  const skill = calculateSkill(sheet, skillName);

  if (!skill.canRoll) {
    throw new Error(
      `Character cannot use skill: ${skillName}`,
    );
  }

  return calculateAttackModifier(weapon, {
    skill: skillName,
    skillBonus: skill.total,
    situationalBonus,
    breakPenalty,
  });
}

export function rollWeaponAttack(
  weapon: CombatWeapon,
  options: AttackOptions,
  random: RandomSource = Math.random,
): RollResult {
  const die = rollDie(20, random);

  const modifier = calculateAttackModifier(
    weapon,
    options,
  );

  return {
    rolls: [die],
    diceTotal: die,
    modifier,
    total: die + modifier,
    breakdown: [
      `d20: ${die}`,
      `${options.skill}: ${options.skillBonus}`,
      `Weapon: ${weapon.atkBonus}`,
      `Situational: ${options.situationalBonus ?? 0}`,
      `Break: ${options.breakPenalty ?? 0}`,
    ],
  };
}

export function rollCharacterWeaponAttack(
  sheet: CharacterSheet,
  weapon: CombatWeapon,
  skillName: AttackSkill,
  situationalBonus = 0,
  breakPenalty = 0,
  random: RandomSource = Math.random,
): RollResult {
  const skill = calculateSkill(sheet, skillName);

  if (!skill.canRoll) {
    throw new Error(
      `Character cannot use skill: ${skillName}`,
    );
  }

  return rollWeaponAttack(
    weapon,
    {
      skill: skillName,
      skillBonus: skill.total,
      situationalBonus,
      breakPenalty,
    },
    random,
  );
}

export function calculateDamageModifier(
  sheet: CharacterSheet,
  options: DamageOptions,
): number {
  const strengthBonus =
    options.attribute === 'str'
      ? getModifier(sheet.baseAttributes.str)
      : 0;

  const hasWandwork = sheet.talents.some(
    (talent) => talent.toLowerCase() === 'wandwork',
  );

  const wandworkBonus =
    options.applyWandwork && hasWandwork
      ? getModifier(sheet.baseAttributes.int)
      : 0;

  return (
    strengthBonus +
    wandworkBonus +
    (options.situationalBonus ?? 0)
  );
}

export function rollWeaponDamage(
  sheet: CharacterSheet,
  weapon: CombatWeapon,
  options: DamageOptions,
  random: RandomSource = Math.random,
): RollResult {
  const expression = parseDamageExpression(
    weapon.damageDice,
  );

  const rolls: number[] = [];
  const breakdown: string[] = [];

  for (let i = 0; i < expression.count; i++) {
    const result = rollExplodingDamageDie(
      expression.sides,
      random,
    );

    rolls.push(...result.rolls);

    breakdown.push(
      `Die ${i + 1}: ${result.rolls.join(' + ')}${
        result.rolls.length > 1
          ? ' (exploded)'
          : ''
      }`,
    );
  }

  const diceTotal = rolls.reduce(
    (sum, value) => sum + value,
    0,
  );

  const strengthBonus =
    options.attribute === 'str'
      ? getModifier(sheet.baseAttributes.str)
      : 0;

  const hasWandwork = sheet.talents.some(
    (talent) => talent.toLowerCase() === 'wandwork',
  );

  const wandworkBonus =
    options.applyWandwork && hasWandwork
      ? getModifier(sheet.baseAttributes.int)
      : 0;

  const situationalBonus =
    options.situationalBonus ?? 0;

  const modifier =
    expression.flatBonus +
    strengthBonus +
    wandworkBonus +
    situationalBonus;

  breakdown.push(
    `Weapon flat bonus: ${expression.flatBonus}`,
    `Strength: ${strengthBonus}`,
    `Wandwork: ${wandworkBonus}`,
    `Situational: ${situationalBonus}`,
  );

  return {
    rolls,
    diceTotal,
    modifier,
    total: diceTotal + modifier,
    breakdown,
  };
}

export function rollCharacterWeaponAttackWithBreak(
  sheet: CharacterSheet,
  weapon: CombatWeapon,
  skillName: AttackSkill,
  situationalBonus = 0,
  random: RandomSource = Math.random,
): RollResult {
  const breakState = getBreakState(
    sheet.breakStep,
  );

  if (!breakState.canAct) {
    throw new Error(
      'Character cannot attack at Break step 5.',
    );
  }

  return rollCharacterWeaponAttack(
    sheet,
    weapon,
    skillName,
    situationalBonus,
    breakState.penalty,
    random,
  );
}