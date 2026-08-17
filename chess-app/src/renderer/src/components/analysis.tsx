import { useEffect, useRef, useState } from 'react'
import { Chess, type Square } from 'chess.js'
import {
  Chessboard,
  type Arrow,
  type PieceDropHandlerArgs,
  type SquareHandlerArgs
} from 'react-chessboard'
import type { EngineLine } from '../types'

type AnalysisProps = {
  onBack: () => void
}

// How many candidate lines to ask the engine for, and how deep to search
// them -- there's no opponent waiting on this move, so it can afford to
// think longer than the AI difficulty presets in chessgame.tsx do.
const MULTI_PV = 3
const ANALYSIS_DEPTH = 16

// An alternative line only earns its own arrow if it's within this many
// centipawns of the best line. Anything further off is just a worse
// option, not a second genuinely "good" one.
const GOOD_ENOUGH_MARGIN_CP = 50

// Arrow (and line-marker) color per rank, best line first. Green for the
// top choice is the near-universal "best move" convention in chess UIs;
// the red for third reuses the same red already used for the capture ring
// in chessgame.tsx, so the two boards read as one color language.
const RANK_COLORS = ['rgb(0, 158, 71)', 'rgb(217, 119, 6)', 'rgba(220, 0, 0, 1)']

// How many plies of a line to convert to SAN for display.
const SAN_PLY_LIMIT = 12

// Collapses a line's score onto one comparable number, regardless of
// whether the engine reported it as centipawns or "mate in N": mate scores
// are pushed far outside the normal centipawn range so a forced mate always
// outranks a merely-good centipawn evaluation, while still ordering closer
// mates ahead of longer ones.
function comparableScore(line: EngineLine): number {
  if (line.scoreMate !== null) {
    const sign = line.scoreMate > 0 ? 1 : -1
    return sign * (100000 - Math.abs(line.scoreMate))
  }
  return line.scoreCp ?? 0
}

// Formats a line's evaluation from White's perspective (positive = good for
// White), the standard chess convention -- UCI itself reports scores
// relative to whoever's turn it is, so this flips the sign on Black's turn.
function formatEvaluation(line: EngineLine | undefined, sideToMove: 'w' | 'b'): string {
  if (!line) {
    return '—'
  }

  const perspective = sideToMove === 'w' ? 1 : -1

  if (line.scoreMate !== null) {
    const mateInWhitePerspective = perspective * line.scoreMate
    return mateInWhitePerspective >= 0
      ? `+M${mateInWhitePerspective}`
      : `-M${Math.abs(mateInWhitePerspective)}`
  }

  const pawns = (perspective * (line.scoreCp ?? 0)) / 100
  return `${pawns > 0 ? '+' : ''}${pawns.toFixed(2)}`
}

// Replays a UCI move list (e.g. ["e2e4", "e7e5", ...]) from `fen` and
// renders it as standard algebraic notation with move numbers, e.g.
// "12. e4 e5 13. Nf3 ..." (or "12... Nf6 13. Bg5 ..." if the line starts
// with Black to move).
function pvToSan(fen: string, pv: string[]): string {
  const sim = new Chess(fen)
  const startTurn = sim.turn()
  const startFullMove = Number(fen.split(' ')[5]) || 1

  const sanMoves: string[] = []
  for (const uciMove of pv.slice(0, SAN_PLY_LIMIT)) {
    try {
      const move = sim.move({
        from: uciMove.slice(0, 2),
        to: uciMove.slice(2, 4),
        promotion: (uciMove.length > 4 ? uciMove.slice(4, 5) : undefined) as
          | 'q'
          | 'r'
          | 'b'
          | 'n'
          | undefined
      })
      sanMoves.push(move.san)
    } catch {
      break
    }
  }

  if (sanMoves.length === 0) {
    return '—'
  }

  const parts: string[] = []
  let fullMove = startFullMove
  let turn = startTurn

  sanMoves.forEach((san, i) => {
    if (turn === 'w') {
      parts.push(`${fullMove}.`)
    } else if (i === 0) {
      parts.push(`${fullMove}...`)
    }

    parts.push(san)

    if (turn === 'b') {
      fullMove += 1
    }
    turn = turn === 'w' ? 'b' : 'w'
  })

  return parts.join(' ')
}

const Analysis = ({ onBack }: AnalysisProps) => {
  // create a chess game using a ref to always have access to the latest game state within closures
  const chessGameRef = useRef(new Chess())
  const chessGame = chessGameRef.current

  // track the current position of the chess game in state to trigger a re-render of the chessboard
  const [chessPosition, setChessPosition] = useState(chessGame.fen())
  const [moveFrom, setMoveFrom] = useState('')
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({})

  // ranked candidate lines from the last completed search, and whether one is in flight
  const [engineLines, setEngineLines] = useState<EngineLine[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // re-run the engine every time the position changes
  useEffect(() => {
    if (chessGame.isGameOver()) {
      setEngineLines([])
      setIsAnalyzing(false)
      return
    }

    let cancelled = false
    setIsAnalyzing(true)

    window.api
      .analyzePosition(chessPosition, MULTI_PV, ANALYSIS_DEPTH)
      .then((lines) => {
        if (!cancelled) {
          setEngineLines(lines)
        }
      })
      .catch((error) => {
        console.error('Stockfish failed to analyze the position:', error)
      })
      .finally(() => {
        if (!cancelled) {
          setIsAnalyzing(false)
        }
      })

    // ignore this search's result if the position moves on before it resolves
    return () => {
      cancelled = true
    }
  }, [chessPosition])

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

    // set the square clicked to move from — same opaque-ring trick
    newSquares[square] = {
      boxShadow: 'inset 0 0 0 4px rgb(250, 204, 21)'
    }

    // set the option squares
    setOptionSquares(newSquares)

    return true
  }

  function onPieceDrop({ sourceSquare, targetSquare }: PieceDropHandlerArgs): boolean {
    if (!targetSquare) {
      return false
    }

    // attempt the move; reject the drop (piece snaps back) if illegal
    try {
      chessGame.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      })
    } catch {
      return false
    }

    setChessPosition(chessGame.fen())
    setMoveFrom('')
    setOptionSquares({})

    return true
  }

  function onSquareClick({ square, piece }: SquareHandlerArgs) {
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

    setChessPosition(chessGame.fen())
    setMoveFrom('')
    setOptionSquares({})
  }

  function handleReset() {
    chessGameRef.current = new Chess()
    setChessPosition(chessGameRef.current.fen())
    setMoveFrom('')
    setOptionSquares({})
    setEngineLines([])
  }

  function gameOverLabel(game: Chess): string {
    if (game.isCheckmate()) return 'Checkmate'
    if (game.isStalemate()) return 'Stalemate'
    if (game.isDraw()) return 'Draw'
    return 'Game over'
  }

  // only the lines within GOOD_ENOUGH_MARGIN_CP of the best one get an arrow —
  // a sharp position with one clear best move may show just a single arrow
  const bestScore = engineLines[0] ? comparableScore(engineLines[0]) : null
  const goodLines =
    bestScore === null
      ? []
      : engineLines.filter((line) => bestScore - comparableScore(line) <= GOOD_ENOUGH_MARGIN_CP)

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

  // set the chessboard options
  const chessboardOptions = {
    position: chessPosition,
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

  // a render-safe snapshot for the JSX below — chessGameRef is mutated
  // imperatively in handlers/effects, so its .current shouldn't be read
  // directly during render; this derives the same info from state instead.
  const displayGame = new Chess(chessPosition)

  // render the chessboard inside a centered Tailwind container
  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between text-amber-200">
        <span className="text-sm select-none">
          {displayGame.isGameOver()
            ? gameOverLabel(displayGame)
            : isAnalyzing
              ? 'Stockfish is analyzing…'
              : 'Analysis ready'}
        </span>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={handleReset}
            className="text-sm underline hover:text-amber-400"
          >
            Reset Board
          </button>
          <button type="button" onClick={onBack} className="text-sm underline hover:text-amber-400">
            Back
          </button>
        </div>
      </div>

      <Chessboard options={chessboardOptions} />

      <div className="flex w-full flex-col gap-2">
        <span className="select-none text-sm font-bold text-amber-200">
          Evaluation: {formatEvaluation(engineLines[0], displayGame.turn())}
        </span>

        {goodLines.length === 0 ? (
          <p className="select-none text-sm text-amber-100/60">
            {displayGame.isGameOver() ? 'No moves left in this position.' : 'Waiting for the first line…'}
          </p>
        ) : (
          goodLines.map((line, i) => (
            <div key={line.rank} className="flex items-start gap-2 text-sm">
              <span
                className="mt-1 h-2.5 w-2.5 flex-none rounded-full"
                style={{ background: RANK_COLORS[i] ?? RANK_COLORS[RANK_COLORS.length - 1] }}
                aria-hidden="true"
              />
              <span className="text-amber-100/90">{pvToSan(chessPosition, line.pv)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Analysis
