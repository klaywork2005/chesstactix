import { useCallback, useEffect, useRef, useState } from 'react'
import { Chess, type Move } from 'chess.js'

/** A move to attempt, in the shape chess.js accepts. */
export type MoveInput = {
  /** Origin square, e.g. `'e2'`. */
  from: string
  /** Destination square, e.g. `'e4'`. */
  to: string
  /** Promotion piece (`'q' | 'r' | 'b' | 'n'`), required only when promoting. */
  promotion?: string
}

/** The game-history state and controls returned by {@link useChessHistory}. */
export type ChessHistory = {
  /**
   * The position currently being viewed, as a FEN string.
   *
   * Render-safe to read directly (unlike a ref), and enough for a caller to
   * build its own scratch `new Chess(position)` for querying legal moves, whose
   * turn it is, and so on.
   */
  position: string
  /** Whether the viewed position is the most recent one played. */
  isAtLive: boolean
  /** Whether there is an earlier position to step back to. */
  canGoBack: boolean
  /** Whether there is a later position to step forward to. */
  canGoForward: boolean
  /** Step back one ply. No-op at the start, or while navigation is disabled. */
  goBack: () => void
  /** Step forward one ply. No-op at the live head, or while disabled. */
  goForward: () => void
  /** Jump to the starting position. */
  goToStart: () => void
  /** Jump to the most recent position played. */
  goToLive: () => void
  /**
   * Index of the displayed position within the history. `0` is the starting
   * position, so ply *N* of {@link ChessHistory.moveHistory} is shown at
   * `viewIndex` *N + 1*.
   */
  viewIndex: number
  /** Jump to an arbitrary index; out-of-range values are clamped. */
  goToIndex: (index: number) => void
  /** Attempt a move against the viewed position. See {@link useChessHistory}. */
  pushMove: (move: MoveInput) => Move | null
  /** Start over from a fresh game, or from `fen` if given. */
  reset: (fen?: string) => void
  /**
   * SAN for each ply played so far -- index 0 is move 1's White move, index 1
   * is move 1's Black move, and so on.
   *
   * Independent of which position is being viewed: unlike
   * {@link ChessHistory.position}, this does not shrink when navigating back,
   * only when a new move branches off before the live head.
   */
  moveHistory: string[]
}

/**
 * Undo/redo-through-a-game state, shared by the play and analysis screens.
 *
 * The model is a linear array of FEN positions -- one per ply, starting with
 * the initial position -- plus a pointer into it:
 *
 * ```text
 * history:  [ start, after 1.e4, after 1...e5, after 2.Nf3 ]
 * viewIndex:              ^ 1  -- the board shows this position
 * ```
 *
 * Navigating never loses anything. Playing a move while behind the live head
 * discards whatever was ahead of it and continues from there -- the same
 * semantics as undo/redo in a text editor.
 *
 * Left and right arrow keys are bound at the window and ignored while focus is
 * in a text field.
 *
 * @param navigationEnabled - Pass `false` while something else owns the
 * position asynchronously, such as an AI move request in flight, so the user
 * cannot navigate the view out from under a move that is about to arrive.
 * @param startFen - Position to start from. Defaults to the standard opening
 * position.
 * @returns The viewed position, navigation controls, and the move list. See
 * {@link ChessHistory}.
 */
export function useChessHistory(navigationEnabled = true, startFen?: string): ChessHistory {
  const chessGameRef = useRef(new Chess(startFen))
  // computed independently rather than read from chessGameRef.current, since
  // ref values shouldn't be read during render (even just to seed state).
  const [history, setHistory] = useState<string[]>(() => [new Chess(startFen).fen()])
  const [viewIndex, setViewIndex] = useState(0)
  // SAN alongside the FEN history -- one entry per ply, always
  // history.length - 1 long, kept in lockstep with `history` in pushMove/reset.
  const [moveHistory, setMoveHistory] = useState<string[]>([])

  const position = history[viewIndex]
  const isAtLive = viewIndex === history.length - 1
  const canGoBack = viewIndex > 0
  const canGoForward = viewIndex < history.length - 1

  // keep the shared Chess instance in sync with whichever position is
  // currently being viewed, so move-generation (legal moves, highlights)
  // always reflects what's on screen instead of the live game's end state.
  useEffect(() => {
    chessGameRef.current.load(position)
  }, [position])

  const goTo = useCallback(
    (index: number) => {
      if (!navigationEnabled) {
        return
      }
      setViewIndex(Math.max(0, Math.min(history.length - 1, index)))
    },
    [navigationEnabled, history.length]
  )

  const goBack = useCallback(() => goTo(viewIndex - 1), [goTo, viewIndex])
  const goForward = useCallback(() => goTo(viewIndex + 1), [goTo, viewIndex])
  const goToStart = useCallback(() => goTo(0), [goTo])
  const goToLive = useCallback(() => goTo(history.length - 1), [goTo, history.length])

  // arrow-key navigation, ignored while focus is in a text field
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const target = event.target as HTMLElement | null
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable
      ) {
        return
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goBack()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        goForward()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [goBack, goForward])

  // attempts a move against the currently-viewed position. On success,
  // discards any history beyond the current view and appends the new
  // position as the new live head; returns the chess.js Move, or null if
  // the move was illegal.
  const pushMove = useCallback(
    (move: MoveInput): Move | null => {
      chessGameRef.current.load(position)

      let result: Move
      try {
        result = chessGameRef.current.move(move)
      } catch {
        return null
      }

      setHistory((prev) => [...prev.slice(0, viewIndex + 1), chessGameRef.current.fen()])
      setMoveHistory((prev) => [...prev.slice(0, viewIndex), result.san])
      setViewIndex(viewIndex + 1)
      return result
    },
    [position, viewIndex]
  )

  // starts over from a fresh game (or a given position), clearing history
  const reset = useCallback((fen?: string) => {
    const fresh = new Chess(fen)
    chessGameRef.current = fresh
    setHistory([fresh.fen()])
    setMoveHistory([])
    setViewIndex(0)
  }, [])

  return {
    position,
    isAtLive,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    goToStart,
    goToLive,
    viewIndex,
    goToIndex: goTo,
    pushMove,
    reset,
    moveHistory
  }
}
