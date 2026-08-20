import { BOARD_SCALE_STEP, MAX_BOARD_SCALE, MIN_BOARD_SCALE } from '../hooks/useBoardScale'

type BoardSizeSliderProps = {
  scale: number
  onChange: (next: number) => void
}

// The board-size control in the middle of the control bar. Flanked by a small
// and a large board icon rather than labelled with a number, because the value
// is a share of the available space and not a measurement the user would have
// any use for -- what matters is which way is bigger.
const BoardSizeSlider = ({ scale, onChange }: BoardSizeSliderProps): React.JSX.Element => {
  const progress = (scale - MIN_BOARD_SCALE) / (MAX_BOARD_SCALE - MIN_BOARD_SCALE)

  return (
    // flexible rather than fixed so that on a narrow board it is the slider
    // that gives up width, not the buttons either side of it
    <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-2 text-amber-100/40">
      <i className="fa-solid fa-chess-board shrink-0 text-[9px]" aria-hidden="true" />
      <input
        type="range"
        min={MIN_BOARD_SCALE}
        max={MAX_BOARD_SCALE}
        step={BOARD_SCALE_STEP}
        value={scale}
        onChange={(event) => onChange(Number(event.target.value))}
        // double-click snaps back to the largest board that fits
        onDoubleClick={() => onChange(MAX_BOARD_SCALE)}
        aria-label="Board size"
        aria-valuetext={`${Math.round(scale * 100)}% of the available space`}
        className="app-slider app-slider-sm w-full max-w-24 min-w-8"
        style={{ '--progress': `${progress * 100}%` } as React.CSSProperties}
      />
      <i className="fa-solid fa-chess-board shrink-0 text-[15px]" aria-hidden="true" />
    </div>
  )
}

export default BoardSizeSlider
