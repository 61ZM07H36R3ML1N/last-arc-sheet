export const BREAK_PENALTIES = [
  0,
  -1,
  -2,
  -5,
  -10,
] as const;

export const MAX_BREAK_STEP = 5;

export type BreakStatus =
  | 'normal'
  | 'penalized'
  | 'incapacitated';

export interface BreakState {
  step: number;
  penalty: number;
  status: BreakStatus;
  canAct: boolean;
}

export function getBreakState(
  step: number,
): BreakState {
  if (
    !Number.isSafeInteger(step) ||
    step < 0 ||
    step > MAX_BREAK_STEP
  ) {
    throw new Error(
      `Invalid Break step: ${step}`,
    );
  }

  if (step === MAX_BREAK_STEP) {
    return {
      step,
      penalty: -10,
      status: 'incapacitated',
      canAct: false,
    };
  }

  return {
    step,
    penalty: BREAK_PENALTIES[step],
    status: step === 0 ? 'normal' : 'penalized',
    canAct: true,
  };
}

export function getBreakPenalty(
  step: number,
): number {
  return getBreakState(step).penalty;
}

export function canCharacterAct(
  step: number,
): boolean {
  return getBreakState(step).canAct;
}