export type ZodiacSign =
  | 'Aries'
  | 'Taurus'
  | 'Gemini'
  | 'Cancer'
  | 'Leo'
  | 'Virgo'
  | 'Libra'
  | 'Scorpio'
  | 'Sagittarius'
  | 'Capricorn'
  | 'Aquarius'
  | 'Pisces'
  | 'Ophiuchus';

export interface ZodiacInfo {
  sign: ZodiacSign;
  symbol: string;
  title: string;
  month: string;
  celestial: string;
  domain: string;
  celestialType: 'Primal' | 'Champion' | 'Guardian' | 'Dragon King';
  associatedSkills: readonly string[];
  compatible: ZodiacSign[];
  incompatible: ZodiacSign[];
}

export const ZODIAC_SIGNS: Record<ZodiacSign, ZodiacInfo> = {
  Aries: {
    sign: 'Aries',
    symbol: '♈',
    title: 'The Artisan',
    month: 'Mesa',
    celestial: 'Sirius',
    domain: 'Flame',
    celestialType: 'Primal',
    associatedSkills: ['Disable', 'Lore (terrestrial)', 'Smithing'],
    compatible: ['Leo', 'Sagittarius'],
    incompatible: ['Cancer', 'Capricorn', 'Libra'],
  },

  Taurus: {
    sign: 'Taurus',
    symbol: '♉',
    title: 'The Trickster',
    month: 'Vrsabha',
    celestial: 'Arcturus',
    domain: 'Ice',
    celestialType: 'Primal',
    associatedSkills: ['Disable', 'Lore (arcane)', 'Stealth'],
    compatible: ['Capricorn', 'Virgo'],
    incompatible: ['Aquarius', 'Leo', 'Scorpio'],
  },

  Gemini: {
    sign: 'Gemini',
    symbol: '♊',
    title: 'The Cornucopia',
    month: 'Mithuna',
    celestial: 'Pleiades',
    domain: 'Nature',
    celestialType: 'Primal',
    associatedSkills: ['Lore (mystic)', 'Medicine', 'Survival'],
    compatible: ['Aquarius', 'Libra'],
    incompatible: ['Pisces', 'Sagittarius', 'Virgo'],
  },

  Cancer: {
    sign: 'Cancer',
    symbol: '♋',
    title: 'The Crone',
    month: 'Karkata',
    celestial: 'Betelgeuse',
    domain: 'Poison',
    celestialType: 'Primal',
    associatedSkills: ['Alchemy', 'Lore (occult)', 'Medicine'],
    compatible: ['Pisces', 'Scorpio'],
    incompatible: ['Aries', 'Capricorn', 'Libra'],
  },

  Leo: {
    sign: 'Leo',
    symbol: '♌',
    title: 'The Envoy',
    month: 'Simha',
    celestial: 'Rasalas',
    domain: 'Earth',
    celestialType: 'Primal',
    associatedSkills: ['Deception', 'Lore (social)', 'Persuasion'],
    compatible: ['Aries', 'Sagittarius'],
    incompatible: ['Aquarius', 'Scorpio', 'Taurus'],
  },

  Virgo: {
    sign: 'Virgo',
    symbol: '♍',
    title: 'The Herald',
    month: 'Kanya',
    celestial: 'Ras Algethi',
    domain: 'Light',
    celestialType: 'Champion',
    associatedSkills: ['Lore (mystic)', 'Persuasion', 'Ride'],
    compatible: ['Capricorn', 'Taurus'],
    incompatible: ['Gemini', 'Pisces', 'Sagittarius'],
  },

  Libra: {
    sign: 'Libra',
    symbol: '♎',
    title: 'The Winged Serpent',
    month: 'Tula',
    celestial: 'Fomalhaut',
    domain: 'Dragons',
    celestialType: 'Dragon King',
    associatedSkills: ['Alchemy', 'Lore (arcane)', 'Ride'],
    compatible: ['Aquarius', 'Gemini'],
    incompatible: ['Aries', 'Cancer', 'Capricorn'],
  },

  Scorpio: {
    sign: 'Scorpio',
    symbol: '♏',
    title: 'The Phantasm',
    month: 'Vrscika',
    celestial: 'Algol',
    domain: 'Darkness',
    celestialType: 'Primal',
    associatedSkills: ['Deception', 'Lore (occult)', 'Stealth'],
    compatible: ['Cancer', 'Pisces'],
    incompatible: ['Aquarius', 'Leo', 'Taurus'],
  },

  Sagittarius: {
    sign: 'Sagittarius',
    symbol: '♐',
    title: 'The Shield Bearer',
    month: 'Dhanusha',
    celestial: 'Rigel',
    domain: 'Protection',
    celestialType: 'Guardian',
    associatedSkills: ['Athletics', 'Lore (social)', 'Smithing'],
    compatible: ['Aries', 'Leo'],
    incompatible: ['Gemini', 'Pisces', 'Virgo'],
  },

  Capricorn: {
    sign: 'Capricorn',
    symbol: '♑',
    title: 'The Beacon',
    month: 'Makara',
    celestial: 'Achernar',
    domain: 'Sea',
    celestialType: 'Primal',
    associatedSkills: ['Lore (terrestrial)', 'Perception', 'Pilot'],
    compatible: ['Taurus', 'Virgo'],
    incompatible: ['Aries', 'Cancer', 'Libra'],
  },

  Aquarius: {
    sign: 'Aquarius',
    symbol: '♒',
    title: 'The Venator',
    month: 'Kumbha',
    celestial: 'Alioth',
    domain: 'Wind',
    celestialType: 'Primal',
    associatedSkills: ['Acrobatics', 'Perception', 'Survival'],
    compatible: ['Gemini', 'Libra'],
    incompatible: ['Leo', 'Scorpio', 'Taurus'],
  },

  Pisces: {
    sign: 'Pisces',
    symbol: '♓',
    title: 'The Explorer',
    month: 'Mina',
    celestial: 'Altair',
    domain: 'Storms',
    celestialType: 'Primal',
    associatedSkills: ['Acrobatics', 'Athletics', 'Pilot'],
    compatible: ['Cancer', 'Scorpio'],
    incompatible: ['Gemini', 'Sagittarius', 'Virgo'],
  },

  Ophiuchus: {
    sign: 'Ophiuchus',
    symbol: '⛎',
    title: 'The Watcher',
    month: 'Adhik Mass',
    celestial: 'Polaris',
    domain: 'Time and Space',
    celestialType: 'Primal',
    // Player selects any three eligible skills.
    // Weapon skills, Spellcraft, and Performance are excluded.
    associatedSkills: [],
    // Player selects any two compatible and any three
    // incompatible signs.
    compatible: [],
    incompatible: [],
  },
};

export const ZODIAC_LIST = Object.keys(ZODIAC_SIGNS) as ZodiacSign[];