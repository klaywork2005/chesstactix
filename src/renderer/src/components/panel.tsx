type PanelProps = {
  /**
   * The small tracked-out heading. Optional: a caller that wants to draw the
   * whole header row itself can omit it and pass `trailing` alone.
   */
  label?: string
  /**
   * Right-aligned content on the label rule -- a count, an eval, a depth. Given
   * the full width of the row when `label` is omitted.
   */
  trailing?: React.ReactNode
  /** The panel body, laid out as a column below the rule. */
  children: React.ReactNode
  /** Extra classes for the section itself, typically `min-h-0 flex-1` to let it scroll. */
  className?: string
}

/**
 * The shared shell for every side-rail section.
 *
 * Deliberately not a card: no border box, no fill, no rounding -- just a small
 * tracked-out label above a hairline rule, sitting directly on the page
 * background. Every rail on every screen is built from this, so the app reads
 * as one surface rather than a scattering of floating panels.
 */
const Panel = ({ label, trailing, children, className = '' }: PanelProps): React.JSX.Element => {
  return (
    <section className={`flex min-h-0 flex-col ${className}`}>
      <div className="flex flex-none items-baseline justify-between gap-2 border-b border-neutral-800 pb-1.5">
        {label !== undefined && (
          <h2 className="text-[10px] font-semibold tracking-[0.18em] text-amber-200/40 uppercase">
            {label}
          </h2>
        )}
        {trailing !== undefined && (
          <div className={label === undefined ? 'min-w-0 flex-1' : 'min-w-0'}>{trailing}</div>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col pt-2.5">{children}</div>
    </section>
  )
}

export default Panel
