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

export type Material = {
  // glyphs for the black pieces White has captured, and vice versa
  capturedByWhite: string[]
  capturedByBlack: string[]
  // points of material White is ahead by; negative means Black is ahead
  advantage: number
}

// Derives captured pieces and the material balance purely from the position,
// so it works for any FEN -- including one navigated to in history -- without
// needing the move list that produced it.
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
