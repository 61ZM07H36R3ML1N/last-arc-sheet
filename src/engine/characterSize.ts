import races from '../data/races.json';

export const SIZE_RANKS = {
  Tiny: 0,
  Small: 1,
  Medium: 2,
  Large: 3,
} as const;

export type CreatureSize = keyof typeof SIZE_RANKS;

export function isCreatureSize(
  value: string,
): value is CreatureSize {
  return Object.prototype.hasOwnProperty.call(
    SIZE_RANKS,
    value,
  );
}

export function getSizeRank(size: CreatureSize): number {
  return SIZE_RANKS[size];
}

export function resolveCharacterSize(
  race: string,
  override?: CreatureSize,
): CreatureSize {
  if (override) return override;

  const normalized = race.trim().toLowerCase();

  const matchedRace = races.find(
    entry =>
      entry.id.toLowerCase() === normalized ||
      entry.name.toLowerCase() === normalized,
  );

  if (!matchedRace) {
    throw new Error(`Unknown character race: ${race}`);
  }

  if (!isCreatureSize(matchedRace.size)) {
    throw new Error(
      `Unsupported size for race: ${matchedRace.name}`,
    );
  }

  return matchedRace.size;
}