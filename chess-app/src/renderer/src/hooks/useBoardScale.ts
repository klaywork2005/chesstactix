import { useState } from 'react'

// The board size slider's range, as a fraction of the largest board the
// window can currently fit. 1 means "as big as it goes" -- the size the
// layout picks on its own -- so the slider only ever scales the board down
// from the fit, and can never push it off screen.
export const MIN_BOARD_SCALE = 0.5
export const MAX_BOARD_SCALE = 1
export const BOARD_SCALE_STEP = 0.01

const STORAGE_KEY = 'chesstactix:board-scale'

function clamp(value: number): number {
  return Math.min(Math.max(value, MIN_BOARD_SCALE), MAX_BOARD_SCALE)
}

// localStorage is wrapped because the renderer is loaded from file:// in a
// packaged build, where storage can be unavailable -- a board that forgets
// its size is a far better outcome than a screen that fails to render.
function readStoredScale(): number {
  try {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY))
    return Number.isFinite(stored) && stored > 0 ? clamp(stored) : MAX_BOARD_SCALE
  } catch {
    return MAX_BOARD_SCALE
  }
}

function writeStoredScale(scale: number): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(scale))
  } catch {
    // preference simply won't persist
  }
}

// How large the user wants the board, kept as a preference rather than as
// per-screen state so it carries across Play and Analyze (which mount
// separate boards) and across restarts.
export function useBoardScale(): [number, (next: number) => void] {
  const [scale, setScale] = useState(readStoredScale)

  function updateScale(next: number): void {
    const clamped = clamp(next)
    setScale(clamped)
    writeStoredScale(clamped)
  }

  return [scale, updateScale]
}
