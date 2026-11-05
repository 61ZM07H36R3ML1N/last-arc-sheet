import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CharacterSheet } from '../types';
import type { ZodiacSign } from '../data/zodiac';

const defaultCharacter: CharacterSheet = {
  id: 'char-1',
  name: 'Kress',
  race: 'Human',
  zodiacSign: 'Aries',
  ethos: 'Pure Good',
  classes: [{ name: 'Warrior', level: 1 }],
  baseAttributes: {
    str: 16,
    vit: 14,
    agi: 12,
    int: 10,
    mnd: 10,
    chr: 8
  },
  currentHp: 32,
  tempHp: 0,
  currentMp: 6,
  tempMp: 0,
  breakStep: 0,
  heroPoints: 1,
  gold: 1000,
  notes: 'Campaign notes, quest logs, and NPC interactions...',
  trainedSkills: ['Athletics', '1-Handed', '2-Handed'],
  focusedSkills: [],
  technicks: ['Shield Proficiency', 'Power Attack'],
  talents: ['Provoke'],
  equipped: {},
  inventory: []
};

interface CharacterStore {
  sheet: CharacterSheet;
  updateHp: (delta: number) => void;
  updateMp: (delta: number) => void;
  setBreakStep: (step: number) => void;
  useHeroPoint: () => void;
  resetHeroPoints: () => void;
  updateNotes: (notes: string) => void;
  setZodiacSign: (sign: ZodiacSign) => void;
  importSheet: (json: CharacterSheet) => void;
}

export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set) => ({
      sheet: defaultCharacter,
      updateHp: (delta) =>
        set((state) => ({
          sheet: {
            ...state.sheet,
            currentHp: Math.max(0, state.sheet.currentHp + delta)
          }
        })),
      updateMp: (delta) =>
        set((state) => ({
          sheet: {
            ...state.sheet,
            currentMp: Math.max(0, state.sheet.currentMp + delta)
          }
        })),
      setBreakStep: (step) =>
        set((state) => ({
          sheet: {
            ...state.sheet,
            breakStep: Math.min(4, Math.max(0, step))
          }
        })),
      useHeroPoint: () =>
        set((state) => ({
          sheet: {
            ...state.sheet,
            heroPoints: Math.max(0, state.sheet.heroPoints - 1)
          }
        })),
      resetHeroPoints: () =>
        set((state) => ({
          sheet: { ...state.sheet, heroPoints: 1 }
        })),
      updateNotes: (notes) =>
        set((state) => ({
          sheet: { ...state.sheet, notes }
        })),
      setZodiacSign: (sign) =>
        set((state) => ({
          sheet: { ...state.sheet, zodiacSign: sign }
        })),
      importSheet: (newSheet) => set({ sheet: newSheet })
    }),
    {
      name: 'last-arc-character-storage'
    }
  )
);