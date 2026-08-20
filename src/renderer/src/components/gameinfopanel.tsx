import Panel from './panel'
import StatusPanel from './statuspanel'
import { getMaterial } from '../utils/material'
import { getStrength } from '../utils/strength'
import type { AiOptions } from '../types'

type GameInfoPanelProps = {
  /** The displayed position. Captures are derived from it, not from the move list. */
  position: string
  /** Status text passed through to StatusPanel. */
  status: string
  /** Whether Stockfish is picking a move, which pulses the status dot. */
  isThinking: boolean
  /** The opponent's settings, shown back to the player as Elo and level name. */
  aiOptions: AiOptions
  /** Full moves played so far, i.e. plies rounded up. */
  moveCount: number
}

/**
 * One side's capture tray: the pieces it has taken, plus its material edge.
 *
 * Rendered as piece glyphs rather than a count, so the shape of the trade -- a
 * rook for two pieces, say -- is readable at a glance. The advantage is shown
 * only on the side that actually holds it, so the two rows never contradict
 * each other.
 */
const CaptureRow = ({
  glyphs,
  advantage
}: {
  glyphs: string[]
  advantage: number
}): React.JSX.Element => {
  return (
    <div className="flex min-h-6 items-center gap-1.5">
      <span className="text-xl leading-none tracking-tight text-amber-100/60">
        {glyphs.length > 0 ? glyphs.join('') : <span className="text-amber-100/15">—</span>}
      </span>
      {advantage > 0 && <span className=" text-[11px] text-amber-200/50">+{advantage}</span>}
    </div>
  )
}

/** One label/value row in the Game panel. */
const Field = ({ label, value }: { label: string; value: string }): React.JSX.Element => (
  <div className="flex items-baseline justify-between">
    <span className="text-base text-amber-100/85">{label}</span>
    <span className=" text-sm text-amber-100/65 capitalize">{value}</span>
  </div>
)

/**
 * The play screen's right-hand rail: status, captures, and game details.
 *
 * Occupies the same slot the EnginePanel does when analysing, and is built from
 * the same Panel shell, so switching between the two screens does not change
 * the shape of the layout.
 */
const GameInfoPanel = ({
  position,
  status,
  isThinking,
  aiOptions,
  moveCount
}: GameInfoPanelProps): React.JSX.Element => {
  const { capturedByWhite, capturedByBlack, advantage } = getMaterial(position)
  const strength = getStrength(aiOptions.level)

  return (
    <div className="flex h-full min-h-0 flex-col gap-8">
      <StatusPanel status={status} isBusy={isThinking} />

      <Panel label="Captured">
        <div className="flex flex-col gap-2.5">
          <CaptureRow glyphs={capturedByWhite} advantage={advantage} />
          <div className="border-t border-neutral-800/60" />
          <CaptureRow glyphs={capturedByBlack} advantage={-advantage} />
        </div>
      </Panel>

      <Panel label="Game">
        <div className="flex flex-col gap-1.5">
          <Field label="Playing as" value={aiOptions.playerColor} />
          <Field label="Engine" value={`~${strength.elo} Elo`} />
          <Field label="Level" value={strength.name} />
          <Field label="Move" value={String(moveCount)} />
        </div>
      </Panel>
    </div>
  )
}

export default GameInfoPanel
