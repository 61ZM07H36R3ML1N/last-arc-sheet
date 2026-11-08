export type MeleeAttackSkill =
  | 'Light Weapon'
  | '1-Handed'
  | '2-Handed';

export type WeaponSkillResolution =
  | {
      canWield: true;
      skills: MeleeAttackSkill[];
      sizeDifference: number;
    }
  | {
      canWield: false;
      skills: [];
      sizeDifference: number;
      reason: string;
    };

/**
 * Resolves melee weapon skills based on relative size.
 *
 * sizeDifference = weaponSizeRank - characterSizeRank
 *
 * Negative: weapon is smaller than the wielder.
 * Positive: weapon is larger than the wielder.
 *
 * Does not handle ranged weapons, staves, or special
 * weapon exceptions. Those require separate rules.
 */
export function resolveMeleeWeaponSkills(
  characterSizeRank: number,
  weaponSizeRank: number,
): WeaponSkillResolution {
  if (
    !Number.isInteger(characterSizeRank) ||
    !Number.isInteger(weaponSizeRank)
  ) {
    throw new Error('Size ranks must be integers.');
  }

  const sizeDifference =
    weaponSizeRank - characterSizeRank;

  if (sizeDifference <= -2) {
    return {
      canWield: true,
      skills: ['Light Weapon'],
      sizeDifference,
    };
  }

  if (sizeDifference === -1) {
    return {
      canWield: true,
      skills: ['Light Weapon', '1-Handed'],
      sizeDifference,
    };
  }

  if (sizeDifference === 0) {
    return {
      canWield: true,
      skills: ['1-Handed'],
      sizeDifference,
    };
  }

  if (sizeDifference === 1) {
    return {
      canWield: true,
      skills: ['2-Handed'],
      sizeDifference,
    };
  }

  return {
    canWield: false,
    skills: [],
    sizeDifference,
    reason: 'Weapon is too large for this character.',
  };
}