import type { Chess } from 'chess.js'

// Why a finished game ended, phrased for the status line. Shared so the play
// and analysis screens never disagree about what to call the same position.
export function gameOverLabel(game: Chess): string {
  if (game.isCheckmate()) return 'Checkmate'
  if (game.isStalemate()) return 'Stalemate'
  if (game.isDraw()) return 'Draw'
  return 'Game over'
}
