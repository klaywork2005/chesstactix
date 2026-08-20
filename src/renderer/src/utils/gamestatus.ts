import type { Chess } from 'chess.js'

/**
 * Describes why a finished game ended, phrased for the status line.
 *
 * Shared by both board screens so the play and analysis views never disagree
 * about what to call the same position.
 *
 * @param game - A position already known to be over. On a live position the
 * result is the fallback `'Game over'`, which is not a useful label -- check
 * `game.isGameOver()` first.
 * @returns One of `'Checkmate'`, `'Stalemate'`, `'Draw'`, or `'Game over'`.
 */
export function gameOverLabel(game: Chess): string {
  if (game.isCheckmate()) return 'Checkmate'
  if (game.isStalemate()) return 'Stalemate'
  if (game.isDraw()) return 'Draw'
  return 'Game over'
}
