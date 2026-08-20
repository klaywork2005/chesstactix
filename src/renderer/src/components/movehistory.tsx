import { useEffect, useRef } from 'react'
import Panel from './panel'

type MoveHistoryProps = {
  /** SAN, one entry per ply: index 0 is move 1 White, index 1 is move 1 Black. */
  moves: string[]
  /**
   * History index of the displayed position. `0` is the starting position, so
   * ply *N* is being viewed at `viewIndex` *N + 1* -- which is where the
   * off-by-one conversions in this component come from.
   */
  viewIndex: number
  /** Jumps the board to a history index. Given `ply + 1`, per the offset above. */
  onSelectIndex: (index: number) => void
  /** Blocks jumping while the engine owns the position. Defaults to `false`. */
  disabled?: boolean
}

/**
 * The game so far in standard notation, one row per full move.
 *
 * Clicking a ply jumps the board to the position immediately after it, which
 * makes this the primary way to move around a game -- the prev/next buttons and
 * the arrow keys are just the pointer-free version of the same thing.
 *
 * The list follows the active ply as the game advances or history is navigated,
 * so the current move is always on screen without the user scrolling.
 */
const MoveHistory = ({
  moves,
  viewIndex,
  onSelectIndex,
  disabled = false
}: MoveHistoryProps): React.JSX.Element => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const activeRef = useRef<HTMLButtonElement>(null)

  // Follow the active ply as the game advances (or as history is navigated),
  // so the current move is always on screen without the user scrolling. The
  // scrolling is done on the list itself rather than with scrollIntoView,
  // which would also scroll every scrollable ancestor -- the list is the only
  // thing here that should ever move.
  useEffect(() => {
    const list = scrollRef.current
    const active = activeRef.current
    if (!list || !active) {
      return
    }

    // offsetTop is measured against the list because the list is positioned
    const top = active.offsetTop
    const bottom = top + active.offsetHeight

    if (top < list.scrollTop) {
      list.scrollTop = top
    } else if (bottom > list.scrollTop + list.clientHeight) {
      list.scrollTop = bottom - list.clientHeight
    }
  }, [viewIndex, moves.length])

  // Pair the flat ply list into display rows of White/Black. The trailing
  // `null` covers a game ending on White's move, so the row keeps its columns
  // instead of collapsing to a single cell.
  const rows: { number: number; plies: (number | null)[] }[] = []
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({ number: i / 2 + 1, plies: [i, i + 1 < moves.length ? i + 1 : null] })
  }

  // viewIndex 0 is the starting position, which no ply corresponds to
  const activePly = viewIndex - 1

  function plyClass(ply: number): string {
    const base = 'rounded px-1.5 py-0.5 text-left font-mono text-[13px] transition-colors'
    if (ply === activePly) {
      return `${base} bg-amber-400/15 text-amber-200`
    }
    return disabled
      ? `${base} text-amber-100/70`
      : `${base} cursor-pointer text-amber-100/70 hover:bg-neutral-800 hover:text-amber-100`
  }

  return (
    <Panel
      trailing={
        <div className="flex justify-between text-xl text-amber-200/80">
          <div className="">MOVES</div>
          <div>{moves.length > 0 ? `${Math.ceil(moves.length / 2)}` : ''}</div>
        </div>
      }
      className="h-full min-h-0"
    >
      {rows.length === 0 ? (
        <p className="text-[13px] text-amber-100/25 select-none">No moves yet.</p>
      ) : (
        <div ref={scrollRef} className="scrollbar-hide relative min-h-0 flex-1 overflow-y-auto">
          <div className="grid grid-cols-[1.75rem_1fr_1fr] items-center gap-x-1 gap-y-0.5">
            {rows.map((row) => (
              <div key={row.number} className="contents">
                <span className="font-mono text-[11px] text-amber-200/25 select-none">
                  {row.number}
                </span>
                {row.plies.map((ply, i) =>
                  ply === null ? (
                    <span key={i} />
                  ) : (
                    <button
                      key={i}
                      ref={ply === activePly ? activeRef : undefined}
                      type="button"
                      disabled={disabled}
                      onClick={() => onSelectIndex(ply + 1)}
                      className={plyClass(ply)}
                    >
                      {moves[ply]}
                    </button>
                  )
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </Panel>
  )
}

export default MoveHistory
