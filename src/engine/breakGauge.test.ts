import { describe, expect, it } from 'vitest';

import {
  getBreakState,
  getBreakPenalty,
  canCharacterAct,
} from './breakGauge';

describe('Break Gauge', () => {
  it.each([
    [0, 0],
    [1, -1],
    [2, -2],
    [3, -5],
    [4, -10],
  ])(
    'step %i applies penalty %i',
    (step, expected) => {
      expect(getBreakPenalty(step)).toBe(expected);
    },
  );

  it('starts in the normal state', () => {
    expect(getBreakState(0)).toEqual({
      step: 0,
      penalty: 0,
      status: 'normal',
      canAct: true,
    });
  });

  it('applies penalized status', () => {
    expect(getBreakState(3)).toEqual({
      step: 3,
      penalty: -5,
      status: 'penalized',
      canAct: true,
    });
  });

  it('prevents actions at the final step', () => {
    expect(canCharacterAct(5)).toBe(false);

    expect(getBreakState(5).status).toBe(
      'incapacitated',
    );
  });

  it('rejects invalid steps', () => {
    expect(() => getBreakState(-1)).toThrow();
    expect(() => getBreakState(6)).toThrow();
    expect(() => getBreakState(1.5)).toThrow();
  });
});