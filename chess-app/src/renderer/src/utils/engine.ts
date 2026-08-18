import { Chess } from 'chess.js'
import type { EngineLine } from '../types'

// How many plies of a line to convert to SAN for display.
const SAN_PLY_LIMIT = 12

// Collapses a line's score onto one comparable number, regardless of
// whether the engine reported it as centipawns or "mate in N": mate scores
// are pushed far outside the normal centipawn range so a forced mate always
// outranks a merely-good centipawn evaluation, while still ordering closer
// mates ahead of longer ones.
export function comparableScore(line: EngineLine): number {
  if (line.scoreMate !== null) {
    const sign = line.scoreMate > 0 ? 1 : -1
    return sign * (100000 - Math.abs(line.scoreMate))
  }
  return line.scoreCp ?? 0
}

// Formats a line's evaluation from White's perspective (positive = good for
// White), the standard chess convention -- UCI itself reports scores
// relative to whoever's turn it is, so this flips the sign on Black's turn.
export function formatEvaluation(line: EngineLine | undefined, sideToMove: 'w' | 'b'): string {
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

// Maps an evaluation onto the 0..1 fill of an eval bar, where 1 is winning for
// White. Centipawns are run through the standard logistic used for expected
// score, so the bar moves a lot around equality and saturates gently once a
// position is already decided -- a linear scale would peg the bar at either end
// almost immediately.
export function whiteShare(line: EngineLine | undefined, sideToMove: 'w' | 'b'): number {
  if (!line) {
    return 0.5
  }

  const perspective = sideToMove === 'w' ? 1 : -1

  if (line.scoreMate !== null) {
    return perspective * line.scoreMate >= 0 ? 1 : 0
  }

  const cp = perspective * (line.scoreCp ?? 0)
  return 1 / (1 + Math.pow(10, -cp / 400))
}

// Replays a UCI move list (e.g. ["e2e4", "e7e5", ...]) from `fen` and
// renders it as standard algebraic notation with move numbers, e.g.
// "12. e4 e5 13. Nf3 ..." (or "12... Nf6 13. Bg5 ..." if the line starts
// with Black to move).
export function pvToSan(fen: string, pv: string[]): string {
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
          'q' | 'r' | 'b' | 'n' | undefined
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
