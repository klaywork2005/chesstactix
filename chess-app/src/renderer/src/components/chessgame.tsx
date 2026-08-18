import { useEffect, useRef, useState } from 'react'
import { Chess, type Square } from 'chess.js'
import { Chessboard, type PieceDropHandlerArgs, type SquareHandlerArgs } from 'react-chessboard'
import { useChessHistory } from '../hooks/useChessHistory'
import { useBoardScale } from '../hooks/useBoardScale'
import BoardLayout from './boardlayout'
import BoardControls from './boardcontrols'
import MoveHistory from './movehistory'
import GameInfoPanel from './gameinfopanel'
import PromotionDialog, { type PromotionPiece } from './promotiondialog'
import { gameOverLabel } from '../utils/gamestatus'
import type { AiOptions } from '../types'

type ChessGameProps = {
  aiOptions: AiOptions
  onNewGame: () => void
}

// how long to pause before the AI replies, purely so its move doesn't feel
// instantaneous -- applies whether it's replying to a player move or making
// the opening move (when the player chose to play Black).
const AI_MOVE_DELAY_MS = 300

const ChessGame = ({ aiOptions, onNewGame }: ChessGameProps): React.JSX.Element => {
  // whether we're waiting on the Stockfish engine (main process) for a move
  const [isThinking, setIsThinking] = useState(false)
  const isThinkingRef = useRef(false)

  // linear position history + a viewIndex pointer into it (see the hook for
  // the full undo/redo model). Navigation is disabled while the engine is
  // thinking, so the AI's response always lands on the position it was
  // actually asked about, never on a position the user navigated away to
  // in the meantime.
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
    moveHistory
  } = useChessHistory(!isThinking)

  // how large to draw the board, driven by the slider in the control bar
  const [boardScale, setBoardScale] = useBoardScale()

  const [moveFrom, setMoveFrom] = useState('')
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({})

  // a disposable, render-safe instance for querying the displayed position
  // (legal moves, turn, game-over status, ...) -- built fresh from
  // `position` each render rather than held onto, since it's only ever
  // read from here. Moves are applied via pushMove() instead.
  const chessGame = new Chess(position)

  // the promotion the player has started but not yet chosen a piece for. While
  // this is set the move has NOT been played -- the dialog is what decides
  // which piece it promotes to, so nothing is pushed until it resolves.
  const [promotionMove, setPromotionMove] = useState<{ from: string; to: string } | null>(null)

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
    // a half-finished promotion belongs to the position it was started from,
    // so navigating away (or the move landing) closes the dialog
    setPromotionMove(null)
  }

  const playerColorLetter = aiOptions.playerColor === 'white' ? 'w' : 'b'

  // ask the Stockfish engine (running in the main process, via IPC) for a
  // move in the given position and play it
  async function makeAiMove(fen: string): Promise<void> {
    if (isThinkingRef.current) {
      return
    }

    isThinkingRef.current = true
    setIsThinking(true)

    try {
      const uciMove = await window.api.getBestMove(fen, aiOptions.level)

      if (uciMove) {
        pushMove({
          from: uciMove.slice(0, 2),
          to: uciMove.slice(2, 4),
          promotion: uciMove.length > 4 ? uciMove.slice(4, 5) : undefined
        })
      }
    } catch (error) {
      console.error('Stockfish failed to produce a move:', error)
    } finally {
      isThinkingRef.current = false
      setIsThinking(false)
    }
  }

  // whenever it becomes the AI's turn at the live position -- whether
  // because the player just moved, or because the player chose to play
  // Black and the AI has to open -- let it respond after a short delay.
  useEffect(() => {
    if (!isAtLive || chessGame.isGameOver() || chessGame.turn() === playerColorLetter) {
      return
    }

    const timeoutId = setTimeout(() => {
      makeAiMove(position)
    }, AI_MOVE_DELAY_MS)

    return () => clearTimeout(timeoutId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position, isAtLive])

  // get the move options for a square to show valid moves
  function getMoveOptions(square: Square): boolean {
    const moves = chessGame.moves({
      square,
      verbose: true
    })

    // if no moves, clear the option squares
    if (moves.length === 0) {
      setOptionSquares({})
      return false
    }

    // create a new object to store the option squares
    const newSquares: Record<string, React.CSSProperties> = {}

    // loop through the moves and set the option squares
    for (const move of moves) {
      const targetPiece = chessGame.get(move.to as Square)
      const sourcePiece = chessGame.get(square)
      const isCapture = targetPiece && targetPiece.color !== sourcePiece?.color

      newSquares[move.to] = isCapture
        ? {
            // opaque ring around the edge — a piece sits here, so we outline it
            // instead of covering it. boxShadow paints on top of the square, so
            // it never blends with the square's own light/dark color underneath.
            boxShadow: 'inset 0 0 0 4px rgba(220, 0, 0, 1)'
          }
        : {
            // opaque dot in the center — the target square is empty for a quiet
            // move, so filling it doesn't hide anything. Alpha is 1 (fully
            // opaque) so the dot looks identical on light and dark squares alike.
            background: 'radial-gradient(circle, rgba(121, 103, 0, 1) 25%, transparent 25%)'
          }
    }

    // set the square clicked to move from — same opaque-ring trick, so the
    // selected piece stays fully visible instead of being tinted yellow.
    newSquares[square] = {
      boxShadow: 'inset 0 0 0 4px rgb(250, 204, 21)'
    }

    // set the option squares
    setOptionSquares(newSquares)

    return true
  }

  // Whether moving from -> to would be a promotion. Asked of chess.js rather
  // than inferred from the rank, so it is only true when a pawn is actually
  // the piece arriving there and the move is legal to begin with.
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
    // ignore drops while the engine is thinking, while reviewing history
    // (jump back to live to keep playing), or if dropped off the board
    if (isThinking || !isAtLive || !targetSquare) {
      return false
    }

    // a promotion needs a piece chosen before it can be played, so hand off to
    // the dialog and report success -- returning false here would snap the
    // pawn back off the promotion square while the choice is still open
    if (isPromotion(sourceSquare, targetSquare)) {
      setPromotionMove({ from: sourceSquare, to: targetSquare })
      return true
    }

    // attempt the move; reject the drop (piece snaps back) if illegal
    return pushMove({ from: sourceSquare, to: targetSquare }) !== null
  }

  function onSquareClick({ square, piece }: SquareHandlerArgs): void {
    // ignore input while the engine is thinking, or while reviewing history
    if (isThinking || !isAtLive) {
      return
    }

    // piece clicked to move
    if (!moveFrom && piece) {
      const hasMoveOptions = getMoveOptions(square as Square)

      if (hasMoveOptions) {
        setMoveFrom(square)
      }

      return
    }

    // square clicked to move to, check if valid move
    const moves = chessGame.moves({
      square: moveFrom as Square,
      verbose: true
    })
    const foundMove = moves.find((m) => m.from === moveFrom && m.to === square)

    // not a valid move
    if (!foundMove) {
      const hasMoveOptions = getMoveOptions(square as Square)
      setMoveFrom(hasMoveOptions ? square : '')
      return
    }

    // is a promotion -- same hand-off to the dialog as the drag path
    if (foundMove.promotion) {
      setPromotionMove({ from: moveFrom, to: square })
      setMoveFrom('')
      setOptionSquares({})
      return
    }

    // is normal move
    if (!pushMove({ from: moveFrom, to: square })) {
      const hasMoveOptions = getMoveOptions(square as Square)
      if (hasMoveOptions) {
        setMoveFrom(square)
      }
    }
  }

  // set the chessboard options
  const chessboardOptions = {
    boardOrientation: aiOptions.playerColor,
    position,
    squareStyles: optionSquares,
    allowDrawingArrows: true,
    // only draggable at the live position — reviewing an earlier position
    // is read-only until you navigate back to the live head
    allowDragging: isAtLive,
    dropSquareStyle: {
      boxShadow: 'inset 0px 0px 0px 4px orange'
    },
    onSquareClick,
    onPieceDrop,
    id: 'play-vs-ai'
  }

  const status = chessGame.isGameOver()
    ? gameOverLabel(chessGame)
    : isThinking
      ? 'Stockfish is thinking…'
      : isAtLive
        ? 'Your move'
        : 'Reviewing'

  return (
    <BoardLayout
      scale={boardScale}
      left={
        <MoveHistory
          moves={moveHistory}
          viewIndex={viewIndex}
          onSelectIndex={goToIndex}
          disabled={isThinking}
        />
      }
      right={
        <GameInfoPanel
          position={position}
          status={status}
          isThinking={isThinking}
          aiOptions={aiOptions}
          moveCount={Math.ceil(moveHistory.length / 2)}
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
          actionLabel="New Game"
          onAction={onNewGame}
          disabled={isThinking}
        />
      }
    >
      <>
        <Chessboard options={chessboardOptions} />
        {promotionMove && (
          <PromotionDialog
            targetSquare={promotionMove.to}
            color={playerColorLetter}
            boardOrientation={aiOptions.playerColor}
            onSelect={onPromotionSelect}
            onCancel={() => setPromotionMove(null)}
          />
        )}
      </>
    </BoardLayout>
  )
}

export default ChessGame
