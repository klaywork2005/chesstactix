import { Chess, type Color, type PieceSymbol } from 'chess.js'

// How many of each piece a side starts with, and what each is worth. The king
// is omitted from both: it can never be captured, so it contributes nothing to
// either list.
const START_COUNTS: Record<string, number> = { q: 1, r: 2, b: 2, n: 2, p: 8 }
const VALUES: Record<string, number> = { q: 9, r: 5, b: 3, n: 3, p: 1 }

// Display order, strongest first -- the usual convention for a capture tray.
const DISPLAY_ORDER: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p']

const GLYPHS: Record<Color, Record<string, string>> = {
  w: { q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' },
  b: { q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
}

/** The captures and material balance implied by a position. */
export type Material = {
  /** Glyphs for the black pieces White has captured, strongest first. */
  capturedByWhite: string[]
  /** Glyphs for the white pieces Black has captured, strongest first. */
  capturedByBlack: string[]
  /**
   * Points of material White is ahead by, on the conventional 9/5/3/3/1 scale.
   * Negative means Black is ahead; zero means material is level.
   */
  advantage: number
}

/**
 * Derives captured pieces and the material balance from a position alone.
 *
 * Counts what is *missing* against the starting complement rather than
 * replaying captures, so it is correct for any FEN -- including one navigated
 * back to in the move history -- without needing the move list that produced
 * it.
 *
 * Kings are ignored (they cannot be captured), and counts are clamped at zero
 * because promotion can leave a side with more of a piece than it started with.
 *
 * @param fen - Any valid position.
 * @returns The capture trays and material advantage for that position.
 */
export function getMaterial(fen: string): Material {
  const board = new Chess(fen).board()

  const remaining: Record<Color, Record<string, number>> = {
    w: { q: 0, r: 0, b: 0, n: 0, p: 0 },
    b: { q: 0, r: 0, b: 0, n: 0, p: 0 }
  }

  for (const row of board) {
    for (const square of row) {
      if (square && square.type !== 'k') {
        remaining[square.color][square.type] += 1
      }
    }
  }

  function missing(color: Color): string[] {
    return DISPLAY_ORDER.flatMap((type) =>
      // clamped at zero because a promotion can leave a side with *more* of a
      // piece than it started with (three knights, two queens, ...)
      Array<string>(Math.max(0, START_COUNTS[type] - remaining[color][type])).fill(
        GLYPHS[color][type]
      )
    )
  }

  function points(color: Color): number {
    return DISPLAY_ORDER.reduce((sum, type) => sum + remaining[color][type] * VALUES[type], 0)
  }

  return {
    capturedByWhite: missing('b'),
    capturedByBlack: missing('w'),
    advantage: points('w') - points('b')
  }
}
