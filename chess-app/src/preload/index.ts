import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

type Difficulty = 'easy' | 'medium' | 'hard'

type EngineLine = {
  rank: number
  depth: number
  scoreCp: number | null
  scoreMate: number | null
  pv: string[]
}

// Custom APIs for renderer
const api = {
  getBestMove: (fen: string, difficulty: Difficulty): Promise<string | null> =>
    ipcRenderer.invoke('chess:getBestMove', fen, difficulty),
  analyzePosition: (fen: string, multiPv: number, depth: number): Promise<EngineLine[]> =>
    ipcRenderer.invoke('chess:analyzePosition', fen, multiPv, depth)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
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
