// @vitest-environment jsdom

/**
 * Regression coverage for the reactive Character Editor.
 * Place alongside CharacterEditorModal.tsx in src/components/character/.
 * Uses deterministic fixtures so it does not depend on the full rules catalog.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps } from 'react';
import CharacterEditorModal from './CharacterEditorModal';

const mocks = vi.hoisted(() => ({
  importSheet: vi.fn(),
  editCharacter: vi.fn(),
  createCharacter: vi.fn(),
  sheet: {
    id: 'hero-1', name: 'Kress', race: 'Human', ethos: 'Neutral',
    zodiacSign: 'Aries', classes: [{ name: 'Warrior', level: 1 }],
    baseAttributes: { str: 16, vit: 14, agi: 12, int: 10, mnd: 10, chr: 8 },
    racialAttributeChoice: 'vit', attributeIncreases: {},
    trainedSkills: [], focusedSkills: [], technicks: [], talents: [],
    equipped: {}, inventory: [],
  },
}));

vi.mock('../../store/useCharacterStore', () => ({
  useCharacterStore: () => ({ sheet: mocks.sheet, importSheet: mocks.importSheet }),
}));

vi.mock('../../data', () => ({
  RACES: [
    {
      id: 'human', name: 'Human', size: 'Medium', speed: 6,
      attributeAdjustments: { any: 2 }, attributeCaps: {}, traits: [],
    },
    {
      id: 'dwarf', name: 'Dwarf', size: 'Medium', speed: 4,
      attributeAdjustments: { vit: 2, mnd: 2, chr: -2 },
      attributeCaps: { vit: 16 }, traits: [],
    },
  ],
  ETHOS_LIST: ['Neutral'],
  SKILLS: [],
}));

vi.mock('../../data/zodiac', () => ({
  ZODIAC_LIST: ['Aries'],
  ZODIAC_SIGNS: { Aries: { symbol: '♈', element: 'Fire' } },
}));

vi.mock('../../engine/formulas', () => ({
  getModifier: (score: number) => Math.floor((score - 10) / 2),
}));

vi.mock('../../engine/characterLifecycle', () => ({
  BASE_CLASSES: [{
    id: 'warrior', name: 'Warrior', initiativeDie: 'd10',
    startingHp: 30, startingMp: 6, startingGold: 10,
    defenseBonuses: { reflex: 0, fortitude: 0, will: 0 },
    baseTrainedSkillsCount: 2, classSkills: [],
  }],
  editCharacter: mocks.editCharacter,
  createCharacter: mocks.createCharacter,
}));

const open = (mode: ComponentProps<typeof CharacterEditorModal>['mode'] = 'edit') => {
  const onClose = vi.fn();
  const result = render(<CharacterEditorModal isOpen onClose={onClose} mode={mode} />);
  return { ...result, onClose };
};

const raceSelect = () => screen.getAllByRole('combobox').find((element) =>
  Array.from((element as HTMLSelectElement).options).some((option) => option.value === 'dwarf'),
) as HTMLSelectElement;
const attributeCard = (key: string) => {
  const input = document.getElementById(`base-${key}`);
  if (!input) throw new Error(`Missing base-${key} input`);
  const card = input.closest('div.p-2');
  if (!card) throw new Error(`Missing ${key} attribute card`);
  return card as HTMLElement;
};

const effectiveScore = (key: string) => {
  const card = attributeCard(key);
  const score = card.querySelector('.text-xl');
  if (!score) throw new Error(`Missing final score for ${key}`);
  return score.textContent;
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.editCharacter.mockImplementation((sheet, changes) => ({ ...sheet, ...changes }));
  mocks.createCharacter.mockImplementation((options) => ({ ...mocks.sheet, ...options }));
});

describe('CharacterEditorModal racial attribute regressions', () => {
  it('renders the correct create/edit heading', () => {
    const { unmount } = open('edit');
    expect(screen.getByRole('heading', { name: 'Edit Character' })).toBeInTheDocument();
    unmount();
    open('create');
    expect(
  screen.getByRole('heading', { name: 'Create New Character' })
).toBeInTheDocument();
  });

  it('updates final attributes immediately on race change without altering base scores', () => {
    open();
    // Saved Human choice is VIT, so initial VIT = 14 + 2.
    expect(effectiveScore('vit')).toBe('16');
    fireEvent.change(raceSelect(), { target: { value: 'dwarf' } });
    expect(effectiveScore('vit')).toBe('16');
    expect(effectiveScore('mnd')).toBe('12');
    expect(effectiveScore('chr')).toBe('6');
    expect((document.getElementById('base-vit') as HTMLInputElement).value).toBe('14');
    expect((document.getElementById('base-chr') as HTMLInputElement).value).toBe('8');
  });

  it('restores a saved flexible racial choice and recalculates when it changes', () => {
    open();
    const flexible = screen.getAllByRole('combobox').find((element) =>
      Array.from((element as HTMLSelectElement).options).some((option) => option.value === 'vit'),
    ) as HTMLSelectElement;
    expect((flexible as HTMLSelectElement).value).toBe('vit');
    expect(effectiveScore('vit')).toBe('16');
    fireEvent.change(flexible, { target: { value: 'str' } });
    expect(effectiveScore('str')).toBe('18');
    expect(effectiveScore('vit')).toBe('14');
  });

  it('keeps base attributes editable in edit mode and updates the final score', () => {
    open();
    const input = document.getElementById('base-str') as HTMLInputElement;
    expect(input).toBeEnabled();
    fireEvent.change(input, { target: { value: '17' } });
    expect(input.value).toBe('17');
    expect(effectiveScore('str')).toBe('17');
  });

  it('shows an over-cap warning and prevents saving an invalid score', () => {
    open();
    fireEvent.change(raceSelect(), { target: { value: 'dwarf' } });
    fireEvent.change(document.getElementById('base-vit')!, { target: { value: '16' } });
    expect(effectiveScore('vit')).toBe('18');
    expect(screen.getByRole('alert')).toHaveTextContent(/VIT 18 exceeds the Dwarf cap of 16/i);
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeDisabled();
    expect(mocks.editCharacter).not.toHaveBeenCalled();
    expect(mocks.importSheet).not.toHaveBeenCalled();
  });

  it('saves profile edits without changing class or level', () => {
    const { onClose } = open();
    fireEvent.change(raceSelect(), { target: { value: 'dwarf' } });
    fireEvent.change(document.getElementById('base-str')!, { target: { value: '15' } });
    const levelInput = screen.getAllByRole('spinbutton').find((node) => !node.id) as HTMLInputElement;
    expect(levelInput).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(mocks.editCharacter).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'hero-1' }),
      expect.objectContaining({
        race: 'Dwarf',
        baseAttributes: expect.objectContaining({ str: 15, vit: 14 }),
        racialAttributeChoice: 'vit',
      }),
    );
    const changes = mocks.editCharacter.mock.calls[0][1];
    expect(changes).not.toHaveProperty('level');
    expect(changes).not.toHaveProperty('classId');
    expect(mocks.importSheet).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('creates with raw attributes rather than baking in racial bonuses', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    try {
      const { onClose } = open('create');
      expect(effectiveScore('str')).toBe('18'); // Human defaults to +2 STR.
      fireEvent.click(screen.getByRole('button', { name: 'Create Character' }));
      expect(mocks.createCharacter).toHaveBeenCalledWith(expect.objectContaining({
        race: 'Human',
        baseAttributes: { str: 16, vit: 14, agi: 12, int: 10, mnd: 10, chr: 8 },
        racialAttributeChoice: 'str',
      }));
      expect(mocks.importSheet).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    } finally {
      confirm.mockRestore();
    }
  });
});
