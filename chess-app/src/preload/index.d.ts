import { ElectronAPI } from '@electron-toolkit/preload'

// Mirrored (as plain string unions) in src/renderer/src/types.ts and
// src/main/stockfish.ts, since each lives in a separate TS program.
type Difficulty = 'easy' | 'medium' | 'hard'

type Api = {
  // Asks the Stockfish engine (running in the main process) for the best
  // move in the given FEN position. Returns a UCI move string like "e2e4"
  // (or "e7e8q" for a promotion), or null if the game has no moves left.
  getBestMove: (fen: string, difficulty: Difficulty) => Promise<string | null>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
