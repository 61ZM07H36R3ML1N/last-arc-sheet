import {
  describe,
  expect,
  it,
  vi,
  afterEach
} from 'vitest';

import { rollExplodingDie } from '../engine/formulas';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('rollExplodingDie', () => {
  it('rejects invalid dice configurations', () => {
    const invalidSides = [
      0, 1, -6, 2.5, NaN, Infinity
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