// Shared renderer-side types for the AI game setup.
// Mirrored (as plain string unions) in src/preload/index.d.ts and
// src/main/stockfish.ts, since those live in a separate TS program
// (tsconfig.node.json) that doesn't include renderer sources.
export type Difficulty = 'easy' | 'medium' | 'hard'
export type PlayerColor = 'white' | 'black'

export type AiOptions = {
  difficulty: Difficulty
  playerColor: PlayerColor
}
