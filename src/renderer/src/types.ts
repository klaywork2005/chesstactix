// Shared renderer-side types for the AI game setup.
// Mirrored (as plain string unions) in src/preload/index.d.ts and
// src/main/stockfish.ts, since those live in a separate TS program
// (tsconfig.node.json) that doesn't include renderer sources.
/**
 * One rung of the engine strength ladder, 1 (weakest) through 8.
 *
 * The Elo each rung corresponds to and its display name live in
 * `utils/strength.ts`; how the engine is actually configured to play at it
 * lives in `src/main/stockfish.ts`.
 */
export type StrengthLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

/** Which side the human is playing. */
export type PlayerColor = 'white' | 'black'

/** The choices made on the game setup screen, before a game starts. */
export type AiOptions = {
  /** How strong the opponent should play. */
  level: StrengthLevel
  /** The colour the human takes; the engine takes the other. */
  playerColor: PlayerColor
}

/**
 * One candidate line from a MultiPV search.
 *
 * `scoreCp` and `scoreMate` are mutually exclusive, and both are relative to
 * the side to move (positive = good for whoever's turn it is), matching UCI's
 * own convention. Rendering one from White's perspective is what
 * `utils/engine.ts` is for.
 */
export type EngineLine = {
  rank: number
  depth: number
  scoreCp: number | null
  scoreMate: number | null
  pv: string[]
}
