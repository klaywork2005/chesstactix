/**
 * The preload script: the only bridge between the renderer and the main
 * process.
 *
 * Runs in an isolated context with access to both Node and the page, and hands
 * the renderer a deliberately tiny surface -- two functions, no `ipcRenderer`,
 * no engine, no Node. Everything the UI can ask the main process for is in the
 * `api` object below.
 *
 * The type signatures the renderer actually sees live in `./index.d.ts`, which
 * is where these functions are documented.
 *
 * @packageDocumentation
 */

import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Duplicated from src/main/stockfish.ts and src/renderer/src/types.ts on
// purpose: main/preload and the renderer are separate TypeScript programs and
// cannot import from each other. All three copies must change together.
type StrengthLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

type EngineLine = {
  rank: number
  depth: number
  scoreCp: number | null
  scoreMate: number | null
  pv: string[]
}

// Thin `invoke` wrappers -- no logic lives here, so the contract stays a
// straight mapping from a renderer call to a main-process handler. The channel
// names are the only place these strings appear outside src/main/index.ts.
const api = {
  getBestMove: (fen: string, level: StrengthLevel): Promise<string | null> =>
    ipcRenderer.invoke('chess:getBestMove', fen, level),
  analyzePosition: (fen: string, multiPv: number, depth: number): Promise<EngineLine[]> =>
    ipcRenderer.invoke('chess:analyzePosition', fen, multiPv, depth)
}

// With context isolation on -- which it is, and should stay -- the preload's
// globals are not the page's globals, so anything the renderer needs has to be
// handed across explicitly by contextBridge. The fallback branch covers a build
// with isolation disabled, where assigning to `window` directly is the only
// option; it exists for completeness rather than because this app uses it.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
