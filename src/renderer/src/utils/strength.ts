import type { StrengthLevel } from '../types'

/** One rung of the engine strength ladder, as the UI presents it. */
export type Strength = {
  /** The rung's position on the ladder, 1 (weakest) through 8. */
  level: StrengthLevel
  /**
   * Approximate rating this rung plays at.
   *
   * Levels 4-7 are Stockfish's own calibrated figures; levels 1-3 and 8 are
   * estimates. See the note in `src/main/stockfish.ts` for where the numbers
   * come from and how far they can be trusted.
   */
  elo: number
  /** Plain-language handle for the rung, e.g. `'Club'`. */
  name: string
}

/**
 * The eight rungs, weakest first.
 *
 * Elo is the honest headline here; the names are just a plain-language handle
 * on the same scale.
 *
 * @remarks
 * Kept in lockstep with `STRENGTH_PRESETS` in `src/main/stockfish.ts`, which
 * lives in a separate TypeScript program and so cannot import this. Changing
 * one without the other makes the UI advertise a strength the engine does not
 * play at.
 */
export const STRENGTH_LEVELS: Strength[] = [
  { level: 1, elo: 800, name: 'Beginner' },
  { level: 2, elo: 1000, name: 'Novice' },
  { level: 3, elo: 1200, name: 'Casual' },
  { level: 4, elo: 1500, name: 'Club' },
  { level: 5, elo: 1800, name: 'Intermediate' },
  { level: 6, elo: 2100, name: 'Advanced' },
  { level: 7, elo: 2500, name: 'Expert' },
  { level: 8, elo: 3190, name: 'Full strength' }
]

/** Weakest selectable rung. */
export const MIN_LEVEL = 1

/** Strongest selectable rung. */
export const MAX_LEVEL = 8

/**
 * Looks up a rung's display data by level.
 *
 * @param level - A rung between {@link MIN_LEVEL} and {@link MAX_LEVEL}.
 * @returns The matching entry from {@link STRENGTH_LEVELS}.
 */
export function getStrength(level: StrengthLevel): Strength {
  return STRENGTH_LEVELS[level - 1]
}
