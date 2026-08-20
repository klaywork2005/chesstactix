/**
 * The app's flat backdrop.
 *
 * A fixed, negatively-stacked layer rather than a `body` background, so it
 * covers the viewport even when the landing page scrolls past it and never
 * participates in the flex layout above it.
 */
const Background = (): React.JSX.Element => {
  return <div className="fixed inset-0 -z-10 min-h-screen w-full bg-neutral-950" />
}

export default Background
