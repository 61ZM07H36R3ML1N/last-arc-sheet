import { describe, expect, it } from 'vitest';
import { createCharacter, editCharacter, BASE_CLASSES } from './characterLifecycle';
import { resolveWeaponProficiency } from './weaponProficiency';

const options = {
  id: 'test-hero',
  name: '  Kress  ',
  race: 'Human',
  ethos: 'Pure Good',
  zodiacSign: 'Aries' as const,
  classId: 'warrior',
  level: 1,
  racialAttributeChoice: 'str' as const,
  baseAttributes: {
    str: 16,
    vit: 14,
    agi: 12,
    int: 10,
    mnd: 10,
    chr: 8,
  },
};

describe('character lifecycle', () => {
  it('requires a flexible racial attribute choice for Humans', () => {
  expect(() =>
    createCharacter({
      ...options,
      racialAttributeChoice: undefined,
    })
  ).toThrow('A racial attribute choice is required for this race.');
});

it('preserves raw attributes and the racial choice on creation', () => {
  const sheet = createCharacter(options);

  expect(sheet.racialAttributeChoice).toBe('str');

  // Racial bonuses must not be baked into the raw attributes.
  expect(sheet.baseAttributes).toEqual(options.baseAttributes);
});

  it('excludes advanced classes from new character choices', () => {
    expect(BASE_CLASSES).toHaveLength(6);
    expect(BASE_CLASSES.every((entry) => entry.type !== 'advanced')).toBe(true);
  });
  it('creates a new Warrior with starting proficiencies', () => {
    const sheet = createCharacter(options);
    expect(sheet.name).toBe('Kress');
    expect(sheet.classes).toEqual([{ name: 'Warrior', level: 1 }]);
    expect(resolveWeaponProficiency(sheet, 'swords').penalty).toBe(0);
    expect(resolveWeaponProficiency(sheet, 'bows').penalty).toBe(-5);
  });
  it('starts with empty inventory and no inherited progression', () => {
    const sheet = createCharacter(options);
    expect(sheet.inventory).toEqual([]);
    expect(sheet.equipped).toEqual({});
    expect(sheet.talents).toEqual([]);
    expect(sheet.focusedSkills).toEqual([]);
    expect(sheet.breakStep).toBe(0);
  });
  it('initializes HP, MP and gold from class and attributes', () => {
    const sheet = createCharacter(options);
    expect(sheet.currentHp).toBe(32);
    expect(sheet.currentMp).toBe(6);
    expect(sheet.gold).toBe(1000);
  });
  it('rejects advanced classes and invalid levels', () => {
    expect(() => createCharacter({ ...options, classId: 'scholar' })).toThrow('Unknown base class');
    expect(() => createCharacter({ ...options, level: 0 })).toThrow('Character level');
  });
  it('creates independent instances', () => {
    const a = createCharacter(options);
    const b = createCharacter(options);
    a.technicks.push('Weapon Proficiency (bows)');
    a.baseAttributes.str = 8;
    expect(b.technicks).not.toContain('Weapon Proficiency (bows)');
    expect(b.baseAttributes.str).toBe(16);
  });
  it('preserves combat resources and progression when editing', () => {
    const sheet = createCharacter(options);
    sheet.currentHp = 7;
    sheet.currentMp = 1;
    sheet.technicks.push('Power Attack');
    sheet.inventory.push({ id: 'sword', name: 'Sword', slot: 'mainHand', bulk: 1 });
    const edited = editCharacter(sheet, { name: '  Renamed  ', notes: 'New notes' });
    expect(edited.name).toBe('Renamed');
    expect(edited.notes).toBe('New notes');
    expect(edited.currentHp).toBe(7);
    expect(edited.currentMp).toBe(1);
    expect(edited.technicks).toContain('Power Attack');
    expect(edited.inventory).toHaveLength(1);
    expect(sheet.name).toBe('Kress');
  });
  it('rejects implicit class changes', () => {
    const sheet = createCharacter(options);
    expect(() => editCharacter(sheet, {
      classes: [{ name: 'Mage', level: 1 }],
    } as unknown as Parameters<typeof editCharacter>[1])).toThrow('Cannot edit classes');
  });
});
