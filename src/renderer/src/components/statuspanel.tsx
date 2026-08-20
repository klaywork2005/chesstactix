import Panel from './panel'

type StatusPanelProps = {
  /** What the screen is doing: `'Your move'`, `'Analyzing…'`, or the game-over result. */
  status: string
  /** Whether the engine is working, which makes the dot pulse. */
  isBusy: boolean
}

/**
 * The status line at the top of the right-hand rail.
 *
 * Shared verbatim by the play and analysis screens so the two read as the same
 * app; the only difference between them is the text each feeds in.
 */
const StatusPanel = ({ status, isBusy }: StatusPanelProps): React.JSX.Element => {
  return (
    <Panel label="Status">
      <div className="flex items-center gap-2">
        <span
          className={`h-1.5 w-1.5 flex-none rounded-full ${
            isBusy ? 'animate-pulse bg-amber-400' : 'bg-amber-400/40'
          }`}
          aria-hidden="true"
        />
        <span className="text-sm text-amber-100/90">{status}</span>
      </div>
    </Panel>
  )
}

export default StatusPanel
