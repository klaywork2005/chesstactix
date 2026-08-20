import BoardSizeSlider from './boardsizeslider'

type BoardControlsProps = {
  /** Whether there is an earlier position to step back to. */
  canGoBack: boolean
  /** Whether there is a later position to step forward to. */
  canGoForward: boolean
  /** Step back one ply. */
  onBack: () => void
  /** Step forward one ply. */
  onForward: () => void
  /** The screen's own destructive action: `'New Game'` playing, `'Reset Board'` analysing. */
  actionLabel: string
  /** Invoked by the action button. Not disabled by `disabled` -- see the component. */
  onAction: () => void
  /** How large the board is drawn, as a share of the space available to it. */
  scale: number
  /** Called as the size slider moves. */
  onScaleChange: (next: number) => void
  /** Locks navigation while the engine owns the position. Defaults to `false`. */
  disabled?: boolean
}

const BUTTON =
  'flex items-center gap-1 rounded px-2 py-1 text-[16px] text-amber-100/80 transition-colors ' +
  'cursor-pointer hover:bg-neutral-800 hover:text-amber-100 ' +
  'disabled:pointer-events-none disabled:text-amber-100/20'

/**
 * The slim control bar directly under the board.
 *
 * Kept to icon-and-label buttons on a single rule so it reads as part of the
 * board rather than a separate panel competing with it.
 *
 * The action button is deliberately left enabled when `disabled` is set: the
 * navigation buttons are locked while the engine is thinking, but starting a
 * new game or resetting the board must always be possible -- that is the escape
 * hatch if a search ever hangs.
 */
const BoardControls = ({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  actionLabel,
  onAction,
  scale,
  onScaleChange,
  disabled = false
}: BoardControlsProps): React.JSX.Element => {
  return (
    <div className="flex items-center justify-between border border-neutral-700 rounded-lg bg-neutral-900 p-1">
      <div className="flex items-center">
        <button
          type="button"
          onClick={onBack}
          disabled={!canGoBack || disabled}
          className={BUTTON}
          aria-label="Previous move"
        >
          <i className="fa-solid fa-chevron-left text-[9px]" />
          Prev
        </button>
        <button
          type="button"
          onClick={onForward}
          disabled={!canGoForward || disabled}
          className={BUTTON}
          aria-label="Next move"
        >
          Next
          <i className="fa-solid fa-chevron-right text-[9px]" />
        </button>
      </div>

      <BoardSizeSlider scale={scale} onChange={onScaleChange} />

      <button type="button" onClick={onAction} className={BUTTON}>
        <i className="fa-solid fa-rotate-left text-[9px]" />
        {actionLabel}
      </button>
    </div>
  )
}

export default BoardControls
