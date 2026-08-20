import { useElementSize } from '../hooks/useElementSize'

type BoardLayoutProps = {
  /** Contents of the left rail -- the move list, on both screens. */
  left: React.ReactNode
  /** Contents of the right rail: game info when playing, engine lines when analysing. */
  right: React.ReactNode
  /** The control bar drawn under the board. Measured, so its height need not be known here. */
  controls: React.ReactNode
  /**
   * Fraction of the largest board that fits to actually draw, from the size
   * slider in the control bar. `1` is the full fit.
   */
  scale: number
  /** The board itself, plus any overlay positioned against it. */
  children: React.ReactNode
}

// px between the board and each rail, and between the board and its controls
const RAIL_GAP = 24
const CONTROLS_GAP = 12

// The rails take a share of the window's width, bounded at both ends: wide
// enough that a move list and an eval stay readable, never so wide that they
// starve the board. RAIL_FLOOR is what they shrink to on a window too narrow
// for even that -- the rails give up width before the board does.
const RAIL_SHARE = 0.17
const RAIL_MIN = 176
const RAIL_MAX = 256
const RAIL_FLOOR = 132

// below this the board stops shrinking to fit and the layout is simply allowed
// to be bigger than the window (the app sets a minimum window size well above
// it). BOARD_FLOOR is the hard lower bound once the slider has scaled the
// board down as well: below roughly this the control bar under the board no
// longer fits on one line, and the pieces stop being readable anyway.
const BOARD_MIN = 288
const BOARD_FLOOR = 320

// height fallback for the control bar, used only for the very first frame if
// it has not been measured yet
const CONTROLS_FALLBACK = 44

/** Constrains a value to an inclusive range. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * The three-column game screen: a square board with a rail either side of it.
 *
 * Every size here is computed from space measured on screen rather than from
 * viewport arithmetic, because the board must satisfy two constraints at once
 * -- fit the width the rails leave, and fit the height the header and control
 * bar leave -- and CSS alone can express only one of those for a square element.
 * Measuring gives the board `min(...)` of both, and lets the rails be pinned to
 * exactly the board's height, so the three columns stay one block at any window
 * size.
 *
 * Used by both board screens, which differ only in what they pass as `right`.
 */
const BoardLayout = ({
  left,
  right,
  controls,
  scale,
  children
}: BoardLayoutProps): React.JSX.Element => {
  const [areaRef, area] = useElementSize<HTMLDivElement>()
  const [controlsRef, controlsSize] = useElementSize<HTMLDivElement>()

  const controlsHeight = controlsSize.height || CONTROLS_FALLBACK

  // the rails' preferred width, then capped again by whatever is left once the
  // board has claimed its minimum
  const preferredRail = clamp(Math.round(area.width * RAIL_SHARE), RAIL_MIN, RAIL_MAX)
  const affordableRail = (area.width - BOARD_MIN - 2 * RAIL_GAP) / 2
  const rail = Math.round(Math.max(RAIL_FLOOR, Math.min(preferredRail, affordableRail)))

  // the largest board the window can hold, then the user's chosen share of it
  const widthForBoard = area.width - 2 * rail - 2 * RAIL_GAP
  const heightForBoard = area.height - controlsHeight - CONTROLS_GAP
  const fittedBoard = Math.max(BOARD_MIN, Math.floor(Math.min(widthForBoard, heightForBoard)))
  const board = Math.max(BOARD_FLOOR, Math.round(fittedBoard * scale))

  // nothing is measured yet on the very first render; drawing at a guessed
  // size would flash a wrong-sized board, so wait one frame instead
  const isMeasured = area.width > 0 && area.height > 0

  const railClass =
    'min-h-0 flex-none overflow-hidden rounded-lg border border-neutral-700 bg-neutral-900 p-4'

  return (
    <div
      ref={areaRef}
      className="flex w-full self-stretch flex-col items-center justify-center px-6 py-6"
    >
      <div
        className="flex items-start"
        style={{ gap: RAIL_GAP, visibility: isMeasured ? 'visible' : 'hidden' }}
      >
        <aside className={railClass} style={{ width: rail, height: board }}>
          {left}
        </aside>

        <div className="flex flex-col" style={{ width: board, gap: CONTROLS_GAP }}>
          {/* `relative` so an overlay sized in percentages -- the promotion
              dialog -- can line itself up against the board's own box. */}
          <div className="relative" style={{ width: board, height: board }}>
            {children}
          </div>
          <div ref={controlsRef}>{controls}</div>
        </div>

        <aside className={railClass} style={{ width: rail, height: board }}>
          {right}
        </aside>
      </div>
    </div>
  )
}

export default BoardLayout
