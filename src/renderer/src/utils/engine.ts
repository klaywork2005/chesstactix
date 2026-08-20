import { Chess } from 'chess.js'
import type { EngineLine } from '../types'

/** How many plies of a line to convert to SAN for display. */
const SAN_PLY_LIMIT = 12

/**
 * Collapses a line's score onto one sortable number, whether the engine
 * reported it as centipawns or as "mate in N".
 *
 * Mate scores are pushed far outside the normal centipawn range, so a forced
 * mate always outranks a merely-good centipawn evaluation while shorter mates
 * still order ahead of longer ones.
 *
 * @param line - A candidate line from a MultiPV search.
 * @returns A number comparable against any other line's score, in the same
 * side-to-move perspective the engine reported (**not** White's perspective --
 * use {@link formatEvaluation} for display).
 */
export function comparableScore(line: EngineLine): number {
  if (line.scoreMate !== null) {
    const sign = line.scoreMate > 0 ? 1 : -1
    return sign * (100000 - Math.abs(line.scoreMate))
  }
  return line.scoreCp ?? 0
}

/**
 * Formats a line's evaluation for display, from White's perspective.
 *
 * UCI reports scores relative to whoever is to move; the standard chess
 * convention states them from White's perspective (positive = good for White).
 * This bridges the two, which is why `sideToMove` is required rather than
 * optional -- omitting the flip produces a sign error that is invisible on
 * White's move and so survives casual testing.
 *
 * @param line - The line to format, or `undefined` before a search has
 * returned.
 * @param sideToMove - Whose turn it is in the analysed position.
 * @returns `'+1.25'` / `'-0.40'` for centipawn scores, `'+M3'` / `'-M2'` for
 * mates, or an em dash when `line` is `undefined`.
 */
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

/**
 * Maps an evaluation onto the fill fraction of the eval bar.
 *
 * Centipawns are run through the standard logistic used for expected score
 * (`1 / (1 + 10^(-cp/400))`), so the bar moves a lot around equality and
 * saturates gently once a position is decided. A linear scale would peg the bar
 * at one end almost immediately and stop carrying information.
 *
 * Like {@link formatEvaluation}, this converts to White's perspective.
 *
 * @param line - The line to render, or `undefined` before a search has
 * returned.
 * @param sideToMove - Whose turn it is in the analysed position.
 * @returns A value in `[0, 1]`: `1` is winning for White, `0.5` is equality
 * (and the fallback when `line` is `undefined`). Mate scores return exactly
 * `1` or `0`.
 */
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

/**
 * Replays a UCI move list from a position and renders it as numbered standard
 * algebraic notation.
 *
 * Truncated to the first 12 plies, and stops cleanly at the first move
 * that fails to apply rather than throwing -- a principal variation from a
 * cancelled or stale search can contain moves that are not legal in the
 * position it is being rendered against.
 *
 * @param fen - The position the line starts from.
 * @param pv - The line as UCI move strings, e.g. `['e2e4', 'e7e5']`.
 * @returns Notation such as `'12. e4 e5 13. Nf3'`, or `'12... Nf6 13. Bg5'`
 * when the line begins on Black's move. An em dash if no move could be applied.
 */
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
