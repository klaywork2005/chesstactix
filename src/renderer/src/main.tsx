/**
 * Renderer entry point: mounts React into the `#root` div in `index.html`.
 *
 * StrictMode is deliberate. It double-invokes effects in development, which is
 * exactly the pressure the engine-request code needs to be correct under --
 * both board screens guard against duplicate and stale searches, and those
 * guards would be easy to get wrong without it. It is a no-op in production.
 *
 * @packageDocumentation
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

// The non-null assertion is safe: #root is static markup in index.html, so if
// it were missing the app could not render at all and a crash here is the
// clearest possible signal.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
