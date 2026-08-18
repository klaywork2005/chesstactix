import { useCallback, useEffect, useRef, useState } from 'react'
import { Chess, type Move } from 'chess.js'

export type MoveInput = {
  from: string
  to: string
  promotion?: string
}

export type ChessHistory = {
  // the position currently being viewed, as a FEN string -- render-safe to
  // read directly (unlike a ref), and enough for a caller to build its own
  // scratch `new Chess(position)` for querying legal moves, turn, etc.
  position: string
  isAtLive: boolean
  canGoBack: boolean
  canGoForward: boolean
  goBack: () => void
  goForward: () => void
  goToStart: () => void
  goToLive: () => void
  // index of the displayed position within the history: 0 is the starting
  // position, so ply N of moveHistory is shown at viewIndex N + 1.
  viewIndex: number
  goToIndex: (index: number) => void
  pushMove: (move: MoveInput) => Move | null
  reset: (fen?: string) => void
  // SAN for each ply played so far (index 0 = move 1's White move, index 1 =
  // move 1's Black move, ...), independent of which position is currently
  // being viewed -- unlike `position`, this doesn't shrink when navigating
  // back, only when a new move branches off before the live head.
  moveHistory: string[]
}

// Shared "undo/redo through a game" state for both chessgame.tsx and
// analysis.tsx: a linear list of FEN positions (one per ply, starting with
// the initial position) plus a pointer into it. Navigating with
// goBack/goForward (or the arrow keys) never loses anything; making a move
// while behind the live head discards whatever was ahead of it and
// continues from there, the same undo/redo semantics as a text editor.
//
// Pass `navigationEnabled: false` while something else owns the position
// asynchronously (e.g. an AI move request in flight) so the user can't
// navigate the view out from under it before it resolves.
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
