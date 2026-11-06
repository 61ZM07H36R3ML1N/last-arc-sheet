import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  rollExplodingDie,
  getModifier,
  calculateDefenses,
} from '../engine/formulas';

import {
  exportToFoundryActor,
  importFromFoundryActor,
} from '../engine/foundryAdapter';

import type { CharacterSheet } from '../types';
import { testCharacter } from '../test/fixtures';

// Restore mocked functions after each test.
afterEach(() => {
  vi.restoreAllMocks();
});

// ==================================================
// EXPLODING DICE
// ==================================================

describe('Last Arc — Exploding Dice', () => {
  it('rejects invalid dice configurations', () => {
    const invalidSides = [
      0, 1, -6, 2.5, NaN, Infinity,
    ];

    for (const sides of invalidSides) {
      expect(() => rollExplodingDie(sides))
        .toThrow(RangeError);
    }
  });

  it('rolls a normal d6 without exploding', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const result = rollExplodingDie(6);

    expect(result.rolls).toEqual([4]);
    expect(result.total).toBe(4);
  });

  it('explodes when the maximum face is rolled', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0.5);

    const result = rollExplodingDie(6);

    expect(result.rolls).toEqual([6, 4]);
    expect(result.total).toBe(10);
  });

  it('supports consecutive explosions', () => {
    vi.spyOn(Math, 'random')
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0);

    const result = rollExplodingDie(6);

    expect(result.rolls).toEqual([6, 6, 1]);
    expect(result.total).toBe(13);
  });
});

// ==================================================
// ATTRIBUTE MODIFIERS
// ==================================================

describe('Last Arc — Attribute Modifiers', () => {
  it('calculates modifiers correctly', () => {
    expect(getModifier(8)).toBe(-1);
    expect(getModifier(10)).toBe(0);
    expect(getModifier(12)).toBe(1);
    expect(getModifier(16)).toBe(3);
    expect(getModifier(18)).toBe(4);
  });

  it('rounds negative modifiers down', () => {
    expect(getModifier(7)).toBe(-2);
    expect(getModifier(9)).toBe(-1);
  });
});

// ==================================================
// DEFENSE CALCULATIONS
// ==================================================

describe('Last Arc — Defense Calculations', () => {
  it('calculates baseline Warrior defenses', () => {
    expect(calculateDefenses(testCharacter)).toEqual({
      reflex: 11,
      fortitude: 14,
      will: 11,
      breakThreshold: 14,
    });
  });

  it('applies Threshold Up', () => {
    const sheet: CharacterSheet = {
      ...testCharacter,
      technicks: ['Threshold Up'],
    };

    expect(calculateDefenses(sheet).breakThreshold)
      .toBe(19);
  });

  it('uses Charisma for Dynamism when higher', () => {
    const sheet: CharacterSheet = {
      ...testCharacter,
      baseAttributes: {
        ...testCharacter.baseAttributes,
        chr: 18,
      },
      technicks: ['Dynamism'],
    };

    expect(calculateDefenses(sheet).will).toBe(15);
  });

  it('applies Dark Dwarf racial defenses', () => {
    const sheet: CharacterSheet = {
      ...testCharacter,
      race: 'Dark Dwarf',
    };

    expect(calculateDefenses(sheet)).toEqual({
      reflex: 12,
      fortitude: 15,
      will: 12,
      breakThreshold: 15,
    });
  });

  it('takes the highest multiclass bonuses', () => {
    const sheet: CharacterSheet = {
      ...testCharacter,
      classes: [
        { name: 'Warrior', level: 2 },
        { name: 'Mage', level: 2 },
      ],
    };

    expect(calculateDefenses(sheet)).toEqual({
      reflex: 14,
      fortitude: 16,
      will: 14,
      breakThreshold: 16,
    });
  });

  it('respects armor Agility caps', () => {
    const sheet: CharacterSheet = {
      ...testCharacter,
      baseAttributes: {
        ...testCharacter.baseAttributes,
        agi: 18,
      },
      equipped: {
        armor: {
          id: 'heavy-armor',
          name: 'Heavy Armor',
          slot: 'armor',
          bulk: 3,
          maxAgiBonus: 1,
        },
      },
    };

    expect(calculateDefenses(sheet).reflex).toBe(11);
  });
});

// ==================================================
// FOUNDRY ADAPTER
// ==================================================

describe('Last Arc — Foundry Adapter', () => {
  it('exports character identity', () => {
    const actor = exportToFoundryActor(testCharacter);

    expect(actor.name).toBe('Kress');
    expect(actor.type).toBe('character');
  });

  it('exports all six attributes', () => {
    const actor = exportToFoundryActor(testCharacter);

    expect(actor.system.attributes).toEqual({
      str: { value: 16 },
      vit: { value: 14 },
      agi: { value: 12 },
      int: { value: 10 },
      mnd: { value: 10 },
      chr: { value: 8 },
    });
  });

  it('preserves equipped armor during a Foundry round trip', () => {
  const original: CharacterSheet = {
    ...testCharacter,
    equipped: {
      armor: {
        id: 'heavy-armor',
        name: 'Heavy Armor',
        slot: 'armor',
        bulk: 3,
        maxAgiBonus: 1,
      },
    },
  };

  const actor = exportToFoundryActor(original);

  const restored = importFromFoundryActor(
    actor,
    testCharacter
  );

  expect(restored.equipped).toEqual(original.equipped);
});

  it('preserves zero HP during import', () => {
    const actor = exportToFoundryActor(testCharacter);

    actor.system.health = {
      value: 0,
      max: 32,
    };

    const result = importFromFoundryActor(
      actor,
      testCharacter
    );

    expect(result.currentHp).toBe(0);
  });

  it('preserves intentionally empty notes', () => {
  const actor = exportToFoundryActor(testCharacter);

  if (actor.system.details) {
    actor.system.details.notes = '';
  }

  const fallback: CharacterSheet = {
    ...testCharacter,
    notes: 'Previous campaign notes',
  };

  const result = importFromFoundryActor(actor, fallback);

  expect(result.notes).toBe('');
});

  it('preserves Break Gauge when missing', () => {
  const actor = exportToFoundryActor(testCharacter);
  delete actor.system.breakGauge;

  const fallback: CharacterSheet = {
    ...testCharacter,
    breakStep: 3,
  };

  const result = importFromFoundryActor(actor, fallback);

  expect(result.breakStep).toBe(3);
});

  it('imports modified attributes', () => {
    const actor = exportToFoundryActor(testCharacter);

    if (actor.system.attributes) {
      actor.system.attributes.str = { value: 20 };
    }

    const result = importFromFoundryActor(
      actor,
      testCharacter
    );

    expect(result.baseAttributes.str).toBe(20);
    expect(result.baseAttributes.vit).toBe(14);
  });

  it('preserves character progression in exported flags', () => {
  const actor = exportToFoundryActor(testCharacter);

  expect(actor.flags?.lastArc).toEqual(
    expect.objectContaining({
      schemaVersion: 1,
      classes: testCharacter.classes,
      trainedSkills: testCharacter.trainedSkills,
      focusedSkills: testCharacter.focusedSkills,
      technicks: testCharacter.technicks,
      talents: testCharacter.talents,
      heroPoints: 1,
      gold: 1000,
    })
  );
});

  it('exports trained skills and abilities', () => {
    const actor = exportToFoundryActor({
      ...testCharacter,
      trainedSkills: ['Athletics'],
      technicks: ['Power Attack'],
      talents: ['Provoke'],
    });

    expect(actor.items).toEqual(
      expect.arrayContaining([
        {
          name: 'Athletics',
          type: 'skill',
          system: { trained: true },
        },
        {
          name: 'Power Attack',
          type: 'technick',
          system: {},
        },
        {
          name: 'Provoke',
          type: 'talent',
          system: {},
        },
      ])
    );
  });
});

it('preserves character progression during a round trip', () => {
  const original: CharacterSheet = {
    ...testCharacter,
    classes: [
      { name: 'Warrior', level: 3 },
      { name: 'Mage', level: 2 },
    ],
    trainedSkills: ['Athletics', 'Arcana'],
    focusedSkills: ['Athletics'],
    technicks: ['Power Attack', 'Dynamism'],
    talents: ['Provoke'],
    heroPoints: 3,
    gold: 2750,
  };

  const actor = exportToFoundryActor(original);

  // Import into a different fallback to detect data loss.
  const restored = importFromFoundryActor(
    actor,
    testCharacter
  );

  expect(restored.classes).toEqual(original.classes);
  expect(restored.trainedSkills)
    .toEqual(original.trainedSkills);
  expect(restored.focusedSkills)
    .toEqual(original.focusedSkills);
  expect(restored.technicks)
    .toEqual(original.technicks);
  expect(restored.talents)
    .toEqual(original.talents);
  expect(restored.heroPoints)
    .toBe(original.heroPoints);
  expect(restored.gold)
    .toBe(original.gold);
});

it('prioritizes Foundry item edits over saved flags', () => {
  const original: CharacterSheet = {
    ...testCharacter,
    trainedSkills: ['Athletics'],
    technicks: ['Power Attack'],
    talents: ['Provoke'],
  };

  const actor = exportToFoundryActor(original);

  // Simulate edits made inside Foundry VTT.
  actor.items = [
    {
      name: 'Arcana',
      type: 'skill',
      system: { trained: true },
    },
    {
      name: 'Dynamism',
      type: 'technick',
      system: {},
    },
    {
      name: 'New Talent',
      type: 'talent',
      system: {},
    },
  ];

  const restored = importFromFoundryActor(
    actor,
    testCharacter
  );

  expect(restored.trainedSkills).toEqual(['Arcana']);
  expect(restored.technicks).toEqual(['Dynamism']);
  expect(restored.talents).toEqual(['New Talent']);
});

it('rejects malformed attribute values during import', () => {
  const actor = exportToFoundryActor(testCharacter);

  // Simulate malformed external JSON.
  const corruptedActor: unknown = {
    ...actor,
    system: {
      ...actor.system,
      attributes: {
        ...actor.system.attributes,
        str: { value: '999' },
        vit: { value: null },
        agi: { value: Number.POSITIVE_INFINITY },
      },
    },
  };

  const restored = importFromFoundryActor(
    corruptedActor,
    testCharacter
  );

  expect(restored.baseAttributes.str).toBe(
    testCharacter.baseAttributes.str
  );

  expect(restored.baseAttributes.vit).toBe(
    testCharacter.baseAttributes.vit
  );

  expect(restored.baseAttributes.agi).toBe(
    testCharacter.baseAttributes.agi
  );
});

it('rejects malformed resource values during import', () => {
  const actor = exportToFoundryActor(testCharacter);

  const corruptedActor: unknown = {
    ...actor,
    system: {
      ...actor.system,
      health: { value: '999', max: 999 },
      mana: { value: Number.POSITIVE_INFINITY, max: 100 },
      breakGauge: { value: -1 },
    },
  };

  const restored = importFromFoundryActor(
    corruptedActor,
    testCharacter
  );

  expect(restored.currentHp).toBe(testCharacter.currentHp);
  expect(restored.currentMp).toBe(testCharacter.currentMp);
  expect(restored.breakStep).toBe(testCharacter.breakStep);
});

it('safely handles malformed Foundry items', () => {
  const actor = exportToFoundryActor(testCharacter);

  const corruptedActor: unknown = {
    ...actor,
    items: [
      null,
      42,
      'invalid item',
      { type: 'skill', name: null, system: null },
      { type: 'technick', name: 123, system: {} },
      { type: 'talent', name: '', system: {} },
    ],
  };

  expect(() =>
    importFromFoundryActor(corruptedActor, testCharacter)
  ).not.toThrow();

  const restored = importFromFoundryActor(
    corruptedActor,
    testCharacter
  );

  expect(restored.trainedSkills)
    .toEqual(testCharacter.trainedSkills);

  expect(restored.technicks)
    .toEqual(testCharacter.technicks);

  expect(restored.talents)
    .toEqual(testCharacter.talents);
});

it('rejects malformed progression flags during import', () => {
  const actor = exportToFoundryActor(testCharacter);

  const corruptedActor: unknown = {
    ...actor,
    flags: {
      lastArc: {
        ...(typeof actor.flags?.lastArc === 'object'
          && actor.flags.lastArc !== null
          ? actor.flags.lastArc
          : {}),
        classes: [
          { name: 'Warrior', level: -5 },
        ],
        focusedSkills: 'corrupted',
        heroPoints: Number.POSITIVE_INFINITY,
        gold: -100,
      },
    },
  };

  const restored = importFromFoundryActor(
    corruptedActor,
    testCharacter
  );

  expect(restored.classes).toEqual(testCharacter.classes);
  expect(restored.focusedSkills)
    .toEqual(testCharacter.focusedSkills);
  expect(restored.heroPoints)
    .toBe(testCharacter.heroPoints);
  expect(restored.gold).toBe(testCharacter.gold);
});

it('preserves progression when class data is partially corrupted', () => {
  const actor = exportToFoundryActor(testCharacter);

  const corruptedActor: unknown = {
    ...actor,
    flags: {
      lastArc: {
        ...(typeof actor.flags?.lastArc === 'object'
          && actor.flags.lastArc !== null
          ? actor.flags.lastArc
          : {}),
        classes: [
          { name: 'Warrior', level: 3 },
          { name: 'Mage', level: -2 },
        ],
      },
    },
  };

  const restored = importFromFoundryActor(
    corruptedActor,
    testCharacter
  );

  expect(restored.classes).toEqual(testCharacter.classes);
});

it('rejects malformed equipped data during import', () => {
  const actor = exportToFoundryActor(testCharacter);

  const corruptedActor: unknown = {
    ...actor,
    flags: {
      lastArc: {
        ...(typeof actor.flags?.lastArc === 'object'
          && actor.flags.lastArc !== null
          ? actor.flags.lastArc
          : {}),
        equipped: 'corrupted',
      },
    },
  };

  const restored = importFromFoundryActor(
    corruptedActor,
    testCharacter
  );

  expect(restored.equipped).toEqual(
    testCharacter.equipped
  );
});

it('preserves equipped accessories during Foundry round trips', () => {
  const sheet: CharacterSheet = {
    ...testCharacter,
    equipped: {
      ...testCharacter.equipped,
      accessory1: {
        id: 'ring-1',
        name: 'Silver Ring',
        slot: 'accessory',
        bulk: 0,
        reflexBonus: 1,
      },
    },
  };

  const actor = exportToFoundryActor(sheet);
  const restored = importFromFoundryActor(
    actor,
    testCharacter
  );

  expect(restored.equipped).toEqual(sheet.equipped);
});