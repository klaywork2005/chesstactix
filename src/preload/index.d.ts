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

/**
 * Everything the renderer is allowed to ask the main process for, exposed on
 * `window.api` through `contextBridge`.
 *
 * This is the app's entire IPC surface. The renderer has no access to Node,
 * `ipcRenderer`, or the engine itself -- only these two functions. Positions
 * cross as FEN strings and moves as UCI strings, so there is no shared object
 * model to keep in sync across the boundary.
 *
 * Adding a channel takes three edits: the handler in `src/main/index.ts`, the
 * wrapper in `src/preload/index.ts`, and a signature here. Skipping this one
 * leaves a call that works at runtime but does not typecheck.
 */
type Api = {
  /**
   * Asks the Stockfish engine, running in the main process, for its move in a
   * position.
   *
   * @param fen - The position to move in.
   * @param level - Which rung of the strength ladder to play at.
   * @returns A UCI move string like `'e2e4'` (or `'e7e8q'` for a promotion), or
   * `null` if the game has no legal moves left.
   */
  getBestMove: (fen: string, level: StrengthLevel) => Promise<string | null>
  /**
   * Asks the engine for ranked candidate lines, for the analysis board.
   *
   * Always searched at full strength, regardless of the level any game is being
   * played at.
   *
   * @param fen - The position to analyse.
   * @param multiPv - How many candidate lines to ask for.
   * @param depth - Search depth in plies.
   * @returns Up to `multiPv` lines, best first.
   */
  analyzePosition: (fen: string, multiPv: number, depth: number) => Promise<EngineLine[]>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
