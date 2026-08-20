import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Three builds from one config. electron-vite already knows the entry points
// and output targets for each process, so `main` and `preload` need no options
// -- they are Node bundles with nothing to configure. Only the renderer, which
// is a real web app, needs plugins and an alias.
export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        // Mirrored in tsconfig.web.json's `paths`. Vite resolves imports at
        // build time and tsc resolves them for typechecking, so both have to be
        // told about the alias independently or one of the two will fail.
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss()]
  }
})
