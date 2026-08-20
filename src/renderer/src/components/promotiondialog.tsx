import { chessColumnToColumnIndex, chessRowToRowIndex, defaultPieces } from 'react-chessboard'

// Queen first: it is what nearly every promotion wants, so it sits nearest
// the promoting square where the cursor already is.
export const PROMOTION_PIECES = ['q', 'r', 'n', 'b'] as const

/** A piece a pawn may promote to: queen, rook, knight, or bishop. */
export type PromotionPiece = (typeof PROMOTION_PIECES)[number]

const PIECE_NAMES: Record<PromotionPiece, string> = {
  q: 'Queen',
  r: 'Rook',
  n: 'Knight',
  b: 'Bishop'
}

// A chessboard is 8x8 and always square, so a square is exactly an eighth of
// it in each direction. Sizing the dialog in percentages rather than measured
// pixels means it needs no DOM reads and stays correct when the window (and
// so the board) resizes underneath it.
const BOARD_SQUARES = 8
const SQUARE_PCT = 100 / BOARD_SQUARES

type PromotionDialogProps = {
  /** The square the pawn is promoting onto, e.g. `'e8'`. */
  targetSquare: string
  /** The side doing the promoting, so the choices are drawn in its own colour. */
  color: 'w' | 'b'
  /** Which way the board faces, which decides where the promotion rank is drawn. */
  boardOrientation: 'white' | 'black'
  /** Called with the chosen piece. The caller is what actually plays the move. */
  onSelect: (piece: PromotionPiece) => void
  /** Dismisses without promoting, leaving the move unplayed. */
  onCancel: () => void
}

/**
 * The choice of promotion piece, drawn as a column hanging off the promotion
 * square itself.
 *
 * Renders inside the board's own relatively-positioned container and sizes
 * itself in percentages, so it stays aligned at any board size without reading
 * the DOM.
 *
 * While this is open the move has **not** been played -- the caller holds it
 * pending, and only `onSelect` commits it.
 */
const PromotionDialog = ({
  targetSquare,
  color,
  boardOrientation,
  onSelect,
  onCancel
}: PromotionDialogProps): React.JSX.Element => {
  const file = /^[a-z]+/.exec(targetSquare)?.[0] ?? 'a'
  const rank = /\d+$/.exec(targetSquare)?.[0] ?? '1'

  const columnIndex = chessColumnToColumnIndex(file, BOARD_SQUARES, boardOrientation)
  const rowIndex = chessRowToRowIndex(rank, BOARD_SQUARES, boardOrientation)

  // A pawn can only promote on the far rank, which is drawn either at the very
  // top or the very bottom depending on which way the board faces. Anchor the
  // column to whichever edge that is and let it grow inward, so it is always
  // on the board rather than hanging off it.
  const growsDownward = rowIndex === 0

  return (
    <>
      {/* Click-anywhere-else to cancel. Also swallows clicks that would
          otherwise land on the board underneath while the choice is open. */}
      <div
        className="absolute inset-0 z-[1000] bg-neutral-950/50"
        onClick={onCancel}
        onContextMenu={(event) => {
          event.preventDefault()
          onCancel()
        }}
        role="presentation"
      />

      <div
        className={`absolute z-[1001] flex overflow-hidden rounded bg-neutral-900 shadow-xl ring-1 ring-amber-400/40 ${
          growsDownward ? 'flex-col' : 'flex-col-reverse'
        }`}
        style={{
          left: `${columnIndex * SQUARE_PCT}%`,
          width: `${SQUARE_PCT}%`,
          top: growsDownward ? 0 : undefined,
          bottom: growsDownward ? undefined : 0
        }}
        role="dialog"
        aria-label="Choose promotion piece"
      >
        {PROMOTION_PIECES.map((piece) => (
          <button
            key={piece}
            type="button"
            onClick={() => onSelect(piece)}
            onContextMenu={(event) => event.preventDefault()}
            title={PIECE_NAMES[piece]}
            aria-label={`Promote to ${PIECE_NAMES[piece]}`}
            className="aspect-square w-full cursor-pointer border-0 bg-transparent p-0.5 transition-colors hover:bg-amber-400/20"
          >
            {defaultPieces[`${color}${piece.toUpperCase()}`]()}
          </button>
        ))}
      </div>
    </>
  )
}

export default PromotionDialog
