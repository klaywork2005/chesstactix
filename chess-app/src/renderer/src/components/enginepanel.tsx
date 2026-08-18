import Panel from './panel'
import StatusPanel from './statuspanel'
import { formatEvaluation, pvToSan, whiteShare } from '../utils/engine'
import type { EngineLine } from '../types'

type EnginePanelProps = {
  // the position the lines were searched from, needed to render them as SAN
  position: string
  sideToMove: 'w' | 'b'
  // best line first; already filtered to the ones worth showing
  lines: EngineLine[]
  // arrow color per rank, shared with the board so the dot next to a line
  // matches the arrow drawn for it
  rankColors: string[]
  isAnalyzing: boolean
  isGameOver: boolean
  status: string
  depth: number
}

// A horizontal eval bar. White's share of the bar fills from the left, so the
// split point sits where the evaluation does -- centered at equality, sliding
// toward whoever is better.
const EvalBar = ({ share }: { share: number }): React.JSX.Element => (
  <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
    <div
      className="bg-amber-100/80 transition-[width] duration-300"
      style={{ width: `${share * 100}%` }}
    />
  </div>
)

const EnginePanel = ({
  position,
  sideToMove,
  lines,
  rankColors,
  isAnalyzing,
  isGameOver,
  status,
  depth
}: EnginePanelProps): React.JSX.Element => {
  const best = lines[0]

  return (
    <div className="flex h-full min-h-0 flex-col gap-7">
      <StatusPanel status={status} isBusy={isAnalyzing} />

      <Panel
        label="Evaluation"
        trailing={
          <span className="font-mono text-[11px] text-amber-200/30">
            {isGameOver ? '' : `d${depth}`}
          </span>
        }
      >
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-2xl leading-none text-amber-100">
            {isGameOver ? '—' : formatEvaluation(best, sideToMove)}
          </span>
          <EvalBar share={isGameOver ? 0.5 : whiteShare(best, sideToMove)} />
        </div>
      </Panel>

      <Panel label="Best lines" className="min-h-0 flex-1">
        {lines.length === 0 ? (
          <p className="text-[13px] text-amber-100/25 select-none">
            {isGameOver ? 'No moves left.' : 'Searching…'}
          </p>
        ) : (
          <ol className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto">
            {lines.map((line, i) => (
              <li key={line.rank} className="flex items-start gap-2">
                <span
                  className="mt-[0.3rem] h-2 w-2 flex-none rounded-full"
                  style={{ background: rankColors[i] ?? rankColors[rankColors.length - 1] }}
                  aria-hidden="true"
                />
                <span className="font-mono text-[12px] leading-relaxed text-amber-100/75">
                  {pvToSan(position, line.pv)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Panel>
    </div>
  )
}

export default EnginePanel
