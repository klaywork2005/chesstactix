import { ElectronAPI } from '@electron-toolkit/preload'

// Mirrored (as plain string unions) in src/renderer/src/types.ts and
// src/main/stockfish.ts, since each lives in a separate TS program.
type StrengthLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

// Mirrors the EngineLine type in src/main/stockfish.ts.
type EngineLine = {
  rank: number
  depth: number
  scoreCp: number | null
  scoreMate: number | null
  pv: string[]
}

type Api = {
  // Asks the Stockfish engine (running in the main process) for the best
  // move in the given FEN position. Returns a UCI move string like "e2e4"
  // (or "e7e8q" for a promotion), or null if the game has no moves left.
  getBestMove: (fen: string, level: StrengthLevel) => Promise<string | null>
  // Asks the engine for up to `multiPv` ranked candidate lines (best first)
  // at the given search depth, for the Analysis page.
  analyzePosition: (fen: string, multiPv: number, depth: number) => Promise<EngineLine[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
