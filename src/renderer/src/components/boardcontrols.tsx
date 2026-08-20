import BoardSizeSlider from './boardsizeslider'

type BoardControlsProps = {
  canGoBack: boolean
  canGoForward: boolean
  onBack: () => void
  onForward: () => void
  // the page's own destructive action -- "New Game" when playing, "Reset
  // Board" when analyzing
  actionLabel: string
  onAction: () => void
  // how large the board is drawn, as a share of the space available to it
  scale: number
  onScaleChange: (next: number) => void
  disabled?: boolean
}

const BUTTON =
  'flex items-center gap-1 rounded px-2 py-1 text-[16px] text-amber-100/80 transition-colors ' +
  'cursor-pointer hover:bg-neutral-800 hover:text-amber-100 ' +
  'disabled:pointer-events-none disabled:text-amber-100/20'

// The slim bar directly under the board. Kept to icon-and-label buttons on a
// single hairline rule so it reads as part of the board rather than a separate
// panel competing with it.
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
