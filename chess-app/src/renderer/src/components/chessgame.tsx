import { useEffect, useRef, useState } from 'react'
import { Chess, type Square } from 'chess.js'
import { Chessboard, type SquareHandlerArgs } from 'react-chessboard'
import type { AiOptions } from '../types'

type ChessGameProps = {
  aiOptions: AiOptions
  onNewGame: () => void
}

const ChessGame = ({ aiOptions, onNewGame }: ChessGameProps) => {
  // create a chess game using a ref to always have access to the latest game state within closures
  const chessGameRef = useRef(new Chess())
  const chessGame = chessGameRef.current

  // track the current position of the chess game in state to trigger a re-render of the chessboard
  const [chessPosition, setChessPosition] = useState(chessGame.fen())
  const [moveFrom, setMoveFrom] = useState('')
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({})

  // whether we're waiting on the Stockfish engine (main process) for a move
  const [isThinking, setIsThinking] = useState(false)
  const isThinkingRef = useRef(false)

  const playerColorLetter = aiOptions.playerColor === 'white' ? 'w' : 'b'

  // ask the Stockfish engine (running in the main process, via IPC) for a move and play it
  async function makeAiMove(): Promise<void> {
    if (isThinkingRef.current || chessGame.isGameOver()) {
      return
    }

    isThinkingRef.current = true
    setIsThinking(true)

    try {
      const uciMove = await window.api.getBestMove(chessGame.fen(), aiOptions.difficulty)

      if (uciMove && !chessGame.isGameOver()) {
        chessGame.move({
          from: uciMove.slice(0, 2),
          to: uciMove.slice(2, 4),
          promotion: (uciMove.length > 4 ? uciMove.slice(4, 5) : undefined) as
            | 'q'
            | 'r'
            | 'b'
            | 'n'
            | undefined
        })
        setChessPosition(chessGame.fen())
      }
    } catch (error) {
      console.error('Stockfish failed to produce a move:', error)
    } finally {
      isThinkingRef.current = false
      setIsThinking(false)
    }
  }

  // if the player chose to play black, the AI (white) needs to make the opening move
  useEffect(() => {
    if (chessGame.turn() !== playerColorLetter) {
      makeAiMove()
    }
    // only run once, when the game is first mounted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // get the move options for a square to show valid moves
  function getMoveOptions(square: Square) {
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

      newSquares[move.to] = {
        background:
          targetPiece && targetPiece.color !== sourcePiece?.color
            ? 'radial-gradient(circle, rgba(0,0,0,.1) 85%, transparent 85%)' // larger circle for capturing
            : 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)', // smaller circle for moving
        borderRadius: '50%'
      }
    }

    // set the square clicked to move from to yellow
    newSquares[square] = {
      background: 'rgba(255, 255, 0, 0.4)'
    }

    // set the option squares
    setOptionSquares(newSquares)

    return true
  }

  function onSquareClick({ square, piece }: SquareHandlerArgs) {
    // ignore input while the engine is thinking
    if (isThinking) {
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

    // is normal move
    try {
      chessGame.move({
        from: moveFrom,
        to: square,
        promotion: 'q'
      })
    } catch {
      const hasMoveOptions = getMoveOptions(square as Square)
      if (hasMoveOptions) {
        setMoveFrom(square)
      }
      return
    }

    // update the position state
    setChessPosition(chessGame.fen())

    // clear moveFrom and optionSquares
    setMoveFrom('')
    setOptionSquares({})

    // let the AI respond after a short delay
    setTimeout(makeAiMove, 300)
  }

  // set the chessboard options
  const chessboardOptions = {
    allowDragging: !isThinking,
    boardOrientation: aiOptions.playerColor,
    onSquareClick,
    position: chessPosition,
    squareStyles: optionSquares,
    id: 'play-vs-ai'
  }

  // render the chessboard inside a centered Tailwind container
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between text-amber-100">
        <span className="text-sm">{isThinking ? 'Stockfish is thinking…' : 'Your move'}</span>
        <button
          type="button"
          onClick={onNewGame}
          className="text-sm underline hover:text-amber-300"
        >
          New Game
        </button>
      </div>
      <Chessboard options={chessboardOptions} />
    </div>
  )
}

export default ChessGame
