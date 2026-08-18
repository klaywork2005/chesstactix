import type { StrengthLevel } from '../types'

export type Strength = {
  level: StrengthLevel
  // approximate rating this rung plays at -- see the note in
  // src/main/stockfish.ts for where these numbers come from and how far
  // they can be trusted
  elo: number
  name: string
}

// The eight rungs, weakest first. Kept in lockstep with STRENGTH_PRESETS in
// src/main/stockfish.ts, which is a separate TS program and so can't import
// this. Elo is the honest headline here; the names are just a plain-language
// handle on the same scale.
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

export const MIN_LEVEL = 1
export const MAX_LEVEL = 8

export function getStrength(level: StrengthLevel): Strength {
  return STRENGTH_LEVELS[level - 1]
}
