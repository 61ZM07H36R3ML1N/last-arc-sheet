// @vitest-environment jsdom

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CharacterEditorModal from './CharacterEditorModal';
import { useCharacterStore } from '../../store/useCharacterStore';
import type { Equipment } from '../../types';


describe('CharacterEditorModal', () => {
  it('does not render when closed', () => {
    const { container } = render(
      <CharacterEditorModal
        isOpen={false}
        mode="create"
        onClose={vi.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the Create Character interface', () => {
    render(
      <CharacterEditorModal
        isOpen={true}
        mode="create"
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Create Character' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Create Character' })
    ).toBeInTheDocument();
  });

  it('renders the Edit Character interface', () => {
    render(
      <CharacterEditorModal
        isOpen={true}
        mode="edit"
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Edit Character' })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', { name: 'Save Changes' })
    ).toBeInTheDocument();
  });

  it('starts Create mode with an empty name', () => {
    render(
      <CharacterEditorModal
        isOpen={true}
        mode="create"
        onClose={vi.fn()}
      />
    );

    const nameInput = screen.getByPlaceholderText(
      'e.g. Kress'
    ) as HTMLInputElement;

    expect(nameInput).toHaveValue('');
  });

  it('does not modify the active character when canceled', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    const originalSheet = structuredClone(
      useCharacterStore.getState().sheet
    );

    render(
      <CharacterEditorModal
        isOpen={true}
        mode="edit"
        onClose={onClose}
      />
    );

    const nameInput = screen.getByPlaceholderText(
      'e.g. Kress'
    );

    await user.clear(nameInput);
    await user.type(nameInput, 'Unsaved Character');

    await user.click(
      screen.getByRole('button', { name: 'Cancel' })
    );

    expect(onClose).toHaveBeenCalledOnce();

    expect(useCharacterStore.getState().sheet).toEqual(
      originalSheet
    );
  });
});

it('preserves the active character when creation is rejected', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();

  const originalSheet = structuredClone(
    useCharacterStore.getState().sheet
  );

  const confirmSpy = vi
    .spyOn(window, 'confirm')
    .mockReturnValue(false);

  render(
    <CharacterEditorModal
      isOpen={true}
      mode="create"
      onClose={onClose}
    />
  );

  await user.type(
    screen.getByPlaceholderText('e.g. Kress'),
    'New Adventurer'
  );

  await user.click(
    screen.getByRole('button', { name: 'Create Character' })
  );

  expect(confirmSpy).toHaveBeenCalledOnce();

  expect(useCharacterStore.getState().sheet).toEqual(
    originalSheet
  );

  expect(onClose).not.toHaveBeenCalled();
});

it('creates a fresh character when replacement is confirmed', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();

  const originalSheet = structuredClone(
    useCharacterStore.getState().sheet
  );

  const confirmSpy = vi
    .spyOn(window, 'confirm')
    .mockReturnValue(true);

  try {
    render(
      <CharacterEditorModal
        isOpen={true}
        mode="create"
        onClose={onClose}
      />
    );

    await user.type(
      screen.getByPlaceholderText('e.g. Kress'),
      'Regression Hero'
    );

    await user.click(
      screen.getByRole('button', { name: 'Create Character' })
    );

    const newSheet = useCharacterStore.getState().sheet;

    expect(confirmSpy).toHaveBeenCalledOnce();
    expect(newSheet.name).toBe('Regression Hero');
    expect(newSheet.id).not.toBe(originalSheet.id);
    expect(newSheet.classes[0].level).toBe(1);
    expect(newSheet.inventory).toEqual([]);
    expect(newSheet.equipped).toEqual({});
    expect(newSheet.breakStep).toBe(0);
    expect(newSheet.tempHp).toBe(0);
    expect(newSheet.tempMp).toBe(0);
    expect(onClose).toHaveBeenCalledOnce();
  } finally {
    // Restore the active character after this test.
    useCharacterStore.getState().importSheet(originalSheet);
  }
});

it('preserves progression and equipment when editing a name', async () => {
  const user = userEvent.setup();
  const onClose = vi.fn();

  // Backup the original character for cleanup.
  const originalSheet = structuredClone(
    useCharacterStore.getState().sheet
  );

  // Create a character with non-default resource values.
 const fixture = structuredClone(originalSheet);

// Non-default character resources
fixture.name = 'Veteran Adventurer';
fixture.currentHp = 7;
fixture.currentMp = 3;
fixture.tempHp = 5;
fixture.tempMp = 2;
fixture.breakStep = 2;
fixture.gold = 137;
fixture.heroPoints = 2;

fixture.technicks = [
  ...new Set([
    ...fixture.technicks,
    'Regression Test Technick',
  ]),
];

// Equipped weapon
const testSword: Equipment = {
  id: 'regression-weapon-001',
  name: 'Veteran Longsword',
  slot: 'mainHand',
  bulk: 2,
  damageDice: '1d8',
  damageType: 'slashing',
  atkBonus: 2,
};

// Equipped armor
const testArmor: Equipment = {
  id: 'regression-armor-001',
  name: 'Veteran Chainmail',
  slot: 'armor',
  bulk: 4,
  reflexBonus: 1,
  dr: 3,
  maxAgiBonus: 2,
  checkPenalty: -2,
};

// Equipped accessory
const testAccessory: Equipment = {
  id: 'regression-accessory-001',
  name: 'Veteran Signet',
  slot: 'accessory',
  bulk: 0,
  specialText: 'A keepsake from an earlier adventure',
};

fixture.equipped = {
  mainHand: testSword,
  armor: testArmor,
  accessory1: testAccessory,
};

// Inventory items
fixture.inventory = [
  {
    id: 'regression-inventory-001',
    name: 'Spare Dagger',
    slot: 'mainHand',
    bulk: 1,
    damageDice: '1d4',
    damageType: 'piercing',
  },
  {
    id: 'regression-inventory-002',
    name: 'Traveler Cloak',
    slot: 'armor',
    bulk: 1,
    specialText: 'A weathered traveling cloak',
  },
];

  try {
    // Load the fixture before rendering the editor.
    useCharacterStore.getState().importSheet(fixture);

    render(
      <CharacterEditorModal
        isOpen={true}
        mode="edit"
        onClose={onClose}
      />
    );

    const nameInput = screen.getByPlaceholderText('e.g. Kress');

    expect(nameInput).toHaveValue('Veteran Adventurer');

    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Hero');

    await user.click(
      screen.getByRole('button', { name: 'Save Changes' })
    );

    const updatedSheet = useCharacterStore.getState().sheet;

    // Only the character name should change.
    expect(updatedSheet.name).toBe('Updated Hero');

    // Character identity and progression
    expect(updatedSheet.id).toBe(fixture.id);
    expect(updatedSheet.classes).toEqual(fixture.classes);
    expect(updatedSheet.technicks).toEqual(fixture.technicks);
    expect(updatedSheet.talents).toEqual(fixture.talents);

    // Combat resources
    expect(updatedSheet.currentHp).toBe(fixture.currentHp);
    expect(updatedSheet.currentMp).toBe(fixture.currentMp);
    expect(updatedSheet.tempHp).toBe(fixture.tempHp);
    expect(updatedSheet.tempMp).toBe(fixture.tempMp);
    expect(updatedSheet.breakStep).toBe(fixture.breakStep);
    expect(updatedSheet.heroPoints).toBe(fixture.heroPoints);

    // Equipment and inventory
expect(updatedSheet.inventory).toEqual(fixture.inventory);
expect(updatedSheet.equipped).toEqual(fixture.equipped);
expect(updatedSheet.gold).toBe(fixture.gold);

// Verify equipped items individually
expect(updatedSheet.equipped.mainHand).toEqual(testSword);
expect(updatedSheet.equipped.armor).toEqual(testArmor);
expect(updatedSheet.equipped.accessory1).toEqual(testAccessory);

// Verify inventory item identities
expect(updatedSheet.inventory).toHaveLength(2);

expect(updatedSheet.inventory.map((item) => item.id)).toEqual([
  'regression-inventory-001',
  'regression-inventory-002',
]);

    expect(onClose).toHaveBeenCalledOnce();

    // Ensure the fixture was not mutated.
    expect(fixture.name).toBe('Veteran Adventurer');
  } finally {
    // Always restore the original character.
    useCharacterStore.getState().importSheet(originalSheet);
  }
});

it('discards unsaved changes when the modal is reopened', async () => {
  const user = userEvent.setup();
  const originalSheet = structuredClone(
    useCharacterStore.getState().sheet
  );

  const { rerender } = render(
    <CharacterEditorModal
      isOpen={true}
      mode="edit"
      onClose={vi.fn()}
    />
  );

  const nameInput = screen.getByPlaceholderText('e.g. Kress');

  expect(nameInput).toHaveValue(originalSheet.name);

  await user.clear(nameInput);
  await user.type(nameInput, 'Unsaved Draft');

  expect(nameInput).toHaveValue('Unsaved Draft');

  // Closing the modal unmounts the editor form.
  rerender(
    <CharacterEditorModal
      isOpen={false}
      mode="edit"
      onClose={vi.fn()}
    />
  );

  expect(
    screen.queryByRole('heading', { name: 'Edit Character' })
  ).not.toBeInTheDocument();

  // Reopening should initialize from the active character.
  rerender(
    <CharacterEditorModal
      isOpen={true}
      mode="edit"
      onClose={vi.fn()}
    />
  );

  expect(
    screen.getByPlaceholderText('e.g. Kress')
  ).toHaveValue(originalSheet.name);

  expect(useCharacterStore.getState().sheet).toEqual(
    originalSheet
  );
});

it('allows editing level, ancestry, and base class', () => {
  const { container } = render(
    <CharacterEditorModal
      isOpen={true}
      mode="edit"
      onClose={vi.fn()}
    />
  );

  const findControl = (
    labelText: string
  ): HTMLInputElement | HTMLSelectElement => {
    const label = Array.from(
      container.querySelectorAll('label')
    ).find((element) =>
      element.textContent?.trim() === labelText
    );

    expect(label, `Missing label: ${labelText}`).toBeDefined();

    const control = label?.parentElement?.querySelector(
      'input, select'
    );

    expect(control, `Missing control: ${labelText}`).not.toBeNull();

    return control as HTMLInputElement | HTMLSelectElement;
  };

  expect(findControl('Level')).toBeEnabled();
  expect(findControl('Race & Ancestry')).toBeEnabled();
  expect(findControl('Base Class')).toBeEnabled();

  const standardArrayButton = screen.getByRole('button', {
    name: /Load Standard Array/,
  });

  expect(standardArrayButton).toBeEnabled();

  // Six attribute inputs must be read-only in Edit mode.
  const attributeInputs = Array.from(
    container.querySelectorAll('input[type="number"]')
  ).filter((input) => input !== findControl('Level'));

  expect(attributeInputs).toHaveLength(6);

  for (const input of attributeInputs) {
    expect(input).toBeDisabled();
  }
});