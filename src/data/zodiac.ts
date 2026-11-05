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
  | 'Pisces';

export interface ZodiacInfo {
  sign: ZodiacSign;
  symbol: string;
  element: 'Fire' | 'Earth' | 'Air' | 'Water';
  compatible: ZodiacSign[];
  incompatible: ZodiacSign[];
}

export const ZODIAC_SIGNS: Record<ZodiacSign, ZodiacInfo> = {
  Aries: {
    sign: 'Aries',
    symbol: '♈',
    element: 'Fire',
    compatible: ['Leo', 'Sagittarius'],
    incompatible: ['Libra', 'Cancer', 'Capricorn']
  },
  Taurus: {
    sign: 'Taurus',
    symbol: '♉',
    element: 'Earth',
    compatible: ['Virgo', 'Capricorn'],
    incompatible: ['Scorpio', 'Leo', 'Aquarius']
  },
  Gemini: {
    sign: 'Gemini',
    symbol: '♊',
    element: 'Air',
    compatible: ['Libra', 'Aquarius'],
    incompatible: ['Sagittarius', 'Virgo', 'Pisces']
  },
  Cancer: {
    sign: 'Cancer',
    symbol: '♋',
    element: 'Water',
    compatible: ['Scorpio', 'Pisces'],
    incompatible: ['Capricorn', 'Aries', 'Libra']
  },
  Leo: {
    sign: 'Leo',
    symbol: '♌',
    element: 'Fire',
    compatible: ['Aries', 'Sagittarius'],
    incompatible: ['Aquarius', 'Taurus', 'Scorpio']
  },
  Virgo: {
    sign: 'Virgo',
    symbol: '♍',
    element: 'Earth',
    compatible: ['Taurus', 'Capricorn'],
    incompatible: ['Pisces', 'Gemini', 'Sagittarius']
  },
  Libra: {
    sign: 'Libra',
    symbol: '♎',
    element: 'Air',
    compatible: ['Gemini', 'Aquarius'],
    incompatible: ['Aries', 'Cancer', 'Capricorn']
  },
  Scorpio: {
    sign: 'Scorpio',
    symbol: '♏',
    element: 'Water',
    compatible: ['Cancer', 'Pisces'],
    incompatible: ['Taurus', 'Leo', 'Aquarius']
  },
  Sagittarius: {
    sign: 'Sagittarius',
    symbol: '♐',
    element: 'Fire',
    compatible: ['Aries', 'Leo'],
    incompatible: ['Gemini', 'Virgo', 'Pisces']
  },
  Capricorn: {
    sign: 'Capricorn',
    symbol: '♑',
    element: 'Earth',
    compatible: ['Taurus', 'Virgo'],
    incompatible: ['Cancer', 'Aries', 'Libra']
  },
  Aquarius: {
    sign: 'Aquarius',
    symbol: '♒',
    element: 'Air',
    compatible: ['Gemini', 'Libra'],
    incompatible: ['Leo', 'Taurus', 'Scorpio']
  },
  Pisces: {
    sign: 'Pisces',
    symbol: '♓',
    element: 'Water',
    compatible: ['Cancer', 'Scorpio'],
    incompatible: ['Virgo', 'Gemini', 'Sagittarius']
  }
};

export const ZODIAC_LIST = Object.keys(ZODIAC_SIGNS) as ZodiacSign[];