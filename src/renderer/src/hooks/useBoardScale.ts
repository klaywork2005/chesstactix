import { useState } from 'react'

/**
 * Smallest board the slider allows, as a fraction of the largest board that
 * fits.
 *
 * @remarks
 * The scale is always a share of the available space, never an absolute size.
 * {@link MAX_BOARD_SCALE} of `1` means "as big as it goes" -- the size the
 * layout picks on its own -- so the slider can only ever scale the board *down*
 * from the fit and can never push it off screen.
 */
export const MIN_BOARD_SCALE = 0.5

/** Largest board the slider allows: the full fit. See {@link MIN_BOARD_SCALE}. */
export const MAX_BOARD_SCALE = 1

/** Slider granularity, in the same fractional units. */
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

/**
 * How large the user wants the board drawn, persisted across screens and
 * restarts.
 *
 * Held as a preference rather than per-screen state so it carries between Play
 * and Analyse, which mount separate boards, and survives a relaunch.
 *
 * Persistence is best-effort: in a packaged build the renderer loads from
 * `file://`, where `localStorage` can be unavailable. Every access is wrapped,
 * because a board that forgets its size is a far better failure than a screen
 * that does not render.
 *
 * @returns A tuple of the current scale and a setter that clamps to
 * `[{@link MIN_BOARD_SCALE}, {@link MAX_BOARD_SCALE}]` and writes the
 * preference through.
 */
export function useBoardScale(): [number, (next: number) => void] {
  const [scale, setScale] = useState(readStoredScale)

  function updateScale(next: number): void {
    const clamped = clamp(next)
    setScale(clamped)
    writeStoredScale(clamped)
  }

  return [scale, updateScale]
}
