import { useEffect, useRef, useState } from 'react'
import { Chess, type Square } from 'chess.js'
import {
  Chessboard,
  type Arrow,
  type PieceDropHandlerArgs,
  type SquareHandlerArgs
} from 'react-chessboard'
import { useChessHistory } from '../hooks/useChessHistory'
import { useBoardScale } from '../hooks/useBoardScale'
import BoardLayout from './boardlayout'
import BoardControls from './boardcontrols'
import MoveHistory from './movehistory'
import EnginePanel from './enginepanel'
import PromotionDialog, { type PromotionPiece } from './promotiondialog'
import { comparableScore } from '../utils/engine'
import { gameOverLabel } from '../utils/gamestatus'
import type { EngineLine } from '../types'

// How many candidate lines to ask the engine for, and how deep to search
// them -- there's no opponent waiting on this move, so it can afford to
// think longer than the AI difficulty presets in chessgame.tsx do.
const MULTI_PV = 3
const ANALYSIS_DEPTH = 16

// An alternative line only earns its own arrow if it's within this many
// centipawns of the best line. Anything further off is just a worse
// option, not a second genuinely "good" one.
const GOOD_ENOUGH_MARGIN_CP = 50

// Arrow (and line-marker) color per rank, best line first. Green for the top
// choice is the near-universal "best move" convention in chess UIs; the ranks
// below it step down in saturation so the eye reads the ordering without
// having to consult the panel.
const RANK_COLORS = ['rgb(34, 197, 94)', 'rgb(56, 189, 248)', 'rgb(148, 163, 184)']

/**
 * The analysis board: a free board that re-evaluates itself as you move.
 *
 * Built from the same parts as the play screen -- board, controls, move list,
 * history model -- but with no opponent. Both sides are played by hand, and
 * every position reached, whether by playing a move or by navigating back
 * through the game, triggers a fresh MultiPV search.
 *
 * Because there is no opponent racing the board, navigation is never locked.
 * Staleness is handled instead by an incrementing request id: rapidly clicking
 * through history starts several searches, and only the newest is allowed to
 * write its result.
 */
const Analysis = (): React.JSX.Element => {
  // linear position history + a viewIndex pointer into it (see the hook for
  // the full undo/redo model). Analysis has no async opponent racing the
  // board, so navigation is always enabled and making a move while behind
  // the live head just branches from there.
  const {
    position,
    isAtLive,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    viewIndex,
    goToIndex,
    pushMove,
    reset,
    moveHistory
  } = useChessHistory()

  // a disposable, render-safe instance for querying the displayed position
  // (legal moves, turn, game-over status, ...) -- built fresh from
  // `position` each render rather than held onto, since it's only ever
  // read from, never mutated. Moves are applied via pushMove() instead.
  const chessGame = new Chess(position)

  // how large to draw the board, driven by the slider in the control bar
  const [boardScale, setBoardScale] = useBoardScale()

  const [moveFrom, setMoveFrom] = useState('')
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({})

  // a promotion the user has started but not yet chosen a piece for; the move
  // is not played until the dialog resolves
  const [promotionMove, setPromotionMove] = useState<{ from: string; to: string } | null>(null)

  // ranked candidate lines from the last completed search, and whether one is in flight
  const [engineLines, setEngineLines] = useState<EngineLine[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // any in-progress square selection belongs to whichever position it was
  // made on, so drop it whenever the displayed position changes for any
  // reason (a move, or navigating history). This adjusts state during
  // render rather than in an effect -- React's recommended way to reset
  // state in response to a changing value without an extra render pass.
  const [selectionPosition, setSelectionPosition] = useState(position)
  if (selectionPosition !== position) {
    setSelectionPosition(position)
    setMoveFrom('')
    setOptionSquares({})
    // a half-finished promotion belongs to the position it was started from
    setPromotionMove(null)
  }

  // guards against a stale search's result landing after a newer one has
  // already started (e.g. rapidly clicking through history) -- only the
  // most recently started request is allowed to update state when it
  // resolves, the same role isThinkingRef plays in chessgame.tsx.
  const analysisRequestIdRef = useRef(0)

  /**
   * Searches `fen` and stores the result, unless a newer search has begun.
   *
   * `requestId` is compared in both the success and the `finally` path, so a
   * superseded search can neither overwrite the current lines nor clear the
   * spinner that belongs to the newer one.
   */
  async function runAnalysis(fen: string, requestId: number): Promise<void> {
    setIsAnalyzing(true)

    try {
      const lines = await window.api.analyzePosition(fen, MULTI_PV, ANALYSIS_DEPTH)
      if (analysisRequestIdRef.current === requestId) {
        setEngineLines(lines)
      }
    } catch (error) {
      console.error('Stockfish failed to analyze the position:', error)
    } finally {
      if (analysisRequestIdRef.current === requestId) {
        setIsAnalyzing(false)
      }
    }
  }

  // re-run the engine every time the displayed position changes -- this
  // covers both making a new move and navigating through history, so
  // reviewing past positions shows their live analysis too. A game-over
  // position just skips the search entirely; the render below already
  // treats a game-over position as having no lines, so there's nothing to
  // reset here.
  useEffect(() => {
    if (new Chess(position).isGameOver()) {
      return
    }

    const requestId = analysisRequestIdRef.current + 1
    analysisRequestIdRef.current = requestId
    runAnalysis(position, requestId)
  }, [position])

  /**
   * Highlights every legal destination for a square, for click-to-move.
   *
   * @returns Whether the square had any legal moves. The callers use this to
   * decide whether the click counts as selecting a piece -- clicking a pinned
   * piece with nowhere to go should not arm a move.
   */
  function getMoveOptions(square: Square): boolean {
    const moves = chessGame.moves({
      square,
      verbose: true
    })

    if (moves.length === 0) {
      setOptionSquares({})
      return false
    }

    // Built fresh rather than merged into the previous highlights, so the old
    // selection's dots cannot survive into the new one.
    const newSquares: Record<string, React.CSSProperties> = {}

    for (const move of moves) {
      const targetPiece = chessGame.get(move.to as Square)
      const sourcePiece = chessGame.get(square)
      const isCapture = targetPiece && targetPiece.color !== sourcePiece?.color

      newSquares[move.to] = isCapture
        ? {
            // opaque ring around the edge — a piece sits here, so we outline it
            // instead of covering it, and it never blends with the square color.
            boxShadow: 'inset 0 0 0 4px rgba(220, 0, 0, 1)'
          }
        : {
            // opaque dot in the center — the target square is empty, so filling
            // it doesn't hide anything.
            background: 'radial-gradient(circle, rgba(128, 96, 0, 1) 25%, transparent 25%)'
          }
    }

    // The selected square itself — same opaque-ring trick, so the piece the
    // user picked up stays fully visible.
    newSquares[square] = {
      boxShadow: 'inset 0 0 0 4px rgb(250, 204, 21)'
    }

    setOptionSquares(newSquares)

    return true
  }

  // Whether moving from -> to would be a promotion, per chess.js rather than
  // guessed from the rank.
  function isPromotion(from: string, to: string): boolean {
    return chessGame
      .moves({ square: from as Square, verbose: true })
      .some((move) => move.to === to && move.promotion)
  }

  function onPromotionSelect(piece: PromotionPiece): void {
    if (promotionMove) {
      pushMove({ from: promotionMove.from, to: promotionMove.to, promotion: piece })
    }
    setPromotionMove(null)
  }

  function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean {
    if (!targetSquare) {
      return false
    }

    // a promotion needs a piece chosen first; report success so the pawn stays
    // put on the promotion square while the dialog is open
    if (isPromotion(sourceSquare, targetSquare)) {
      setPromotionMove({ from: sourceSquare, to: targetSquare })
      return true
    }

    // attempt the move; reject the drop (piece snaps back) if illegal.
    // If we were reviewing an earlier position, this branches from here,
    // discarding whatever moves came after it.
    return pushMove({ from: sourceSquare, to: targetSquare }) !== null
  }

  function onSquareClick({ square, piece }: SquareHandlerArgs): void {
    // First click: arm a move from this square, but only if the piece on it
    // actually has somewhere to go.
    if (!moveFrom && piece) {
      const hasMoveOptions = getMoveOptions(square as Square)

      if (hasMoveOptions) {
        setMoveFrom(square)
      }

      return
    }

    // Second click: is this square a legal destination from the armed one?
    const moves = chessGame.moves({
      square: moveFrom as Square,
      verbose: true
    })
    const foundMove = moves.find((m) => m.from === moveFrom && m.to === square)

    // Not a destination, so treat the click as selecting a different piece
    // instead of as a failed move -- otherwise switching pieces would take two
    // clicks, one to clear and one to select.
    if (!foundMove) {
      const hasMoveOptions = getMoveOptions(square as Square)
      setMoveFrom(hasMoveOptions ? square : '')
      return
    }

    // is a promotion -- hand off to the dialog instead of assuming a queen
    if (foundMove.promotion) {
      setPromotionMove({ from: moveFrom, to: square })
      setMoveFrom('')
      setOptionSquares({})
      return
    }

    // An ordinary move. If it somehow fails anyway, fall back to re-selecting,
    // so a rejected click never leaves the board with a stale armed square.
    if (!pushMove({ from: moveFrom, to: square })) {
      const hasMoveOptions = getMoveOptions(square as Square)
      if (hasMoveOptions) {
        setMoveFrom(square)
      }
    }
  }

  // Clearing the lines is not redundant with `reset()`: the effect above skips
  // the search on a game-over position, so without this an old evaluation could
  // outlive the position it described.
  function handleReset(): void {
    reset()
    setEngineLines([])
  }

  // a finished position has no lines to show, regardless of whatever the
  // last (possibly now-stale) search returned.
  const effectiveEngineLines = chessGame.isGameOver() ? [] : engineLines

  // only the lines within GOOD_ENOUGH_MARGIN_CP of the best one get an arrow —
  // a sharp position with one clear best move may show just a single arrow
  const bestScore = effectiveEngineLines[0] ? comparableScore(effectiveEngineLines[0]) : null
  const goodLines =
    bestScore === null
      ? []
      : effectiveEngineLines.filter(
          (line) => bestScore - comparableScore(line) <= GOOD_ENOUGH_MARGIN_CP
        )

  // One arrow per good line, coloured to match its marker in the panel. A line
  // with an empty PV is dropped rather than drawn from a1 to a1.
  const arrows: Arrow[] = goodLines
    .map((line, i) => {
      const move = line.pv[0]
      if (!move) {
        return null
      }
      return {
        startSquare: move.slice(0, 2),
        endSquare: move.slice(2, 4),
        color: RANK_COLORS[i] ?? RANK_COLORS[RANK_COLORS.length - 1]
      }
    })
    .filter((arrow): arrow is Arrow => arrow !== null)

  const chessboardOptions = {
    position,
    squareStyles: optionSquares,
    arrows,
    allowDrawingArrows: true,
    dropSquareStyle: {
      boxShadow: 'inset 0px 0px 0px 4px orange'
    },
    onSquareClick,
    onPieceDrop,
    id: 'analysis-board'
  }

  // Same precedence as the play screen: result first, then engine activity,
  // then where in the game the board is sitting.
  const status = chessGame.isGameOver()
    ? gameOverLabel(chessGame)
    : isAnalyzing
      ? 'Analyzing…'
      : isAtLive
        ? 'Ready'
        : 'Reviewing'

  return (
    <BoardLayout
      scale={boardScale}
      left={<MoveHistory moves={moveHistory} viewIndex={viewIndex} onSelectIndex={goToIndex} />}
      right={
        <EnginePanel
          position={position}
          sideToMove={chessGame.turn()}
          lines={goodLines}
          rankColors={RANK_COLORS}
          isAnalyzing={isAnalyzing}
          isGameOver={chessGame.isGameOver()}
          status={status}
          depth={ANALYSIS_DEPTH}
        />
      }
      controls={
        <BoardControls
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onBack={goBack}
          onForward={goForward}
          scale={boardScale}
          onScaleChange={setBoardScale}
          actionLabel="Reset Board"
          onAction={handleReset}
        />
      }
    >
      <>
        <Chessboard options={chessboardOptions} />
        {promotionMove && (
          <PromotionDialog
            targetSquare={promotionMove.to}
            color={chessGame.turn()}
            boardOrientation="white"
            onSelect={onPromotionSelect}
            onCancel={() => setPromotionMove(null)}
          />
        )}
      </>
    </BoardLayout>
  )
}

export default Analysis
