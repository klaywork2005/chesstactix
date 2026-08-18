// Shared renderer-side types for the AI game setup.
// Mirrored (as plain string unions) in src/preload/index.d.ts and
// src/main/stockfish.ts, since those live in a separate TS program
// (tsconfig.node.json) that doesn't include renderer sources.
// One rung of the engine strength ladder. The Elo each rung corresponds to,
// and its display name, live in utils/strength.ts; how the engine is actually
// configured to play at it lives in src/main/stockfish.ts.
export type StrengthLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type PlayerColor = 'white' | 'black'

export type AiOptions = {
  level: StrengthLevel
  playerColor: PlayerColor
}

// Mirrors the EngineLine type in src/main/stockfish.ts and src/preload/index.d.ts.
export type EngineLine = {
  rank: number
  depth: number
  scoreCp: number | null
  scoreMate: number | null
  pv: string[]
}
