import { defineConfig } from 'eslint/config'
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'

// Flat config, applied in order -- later entries override earlier ones.
export default defineConfig(
  // Build output and generated docs are not source and must never be linted.
  { ignores: ['**/node_modules', '**/dist', '**/out', 'docs/api'] },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  // Drops the rule requiring React to be in scope: the JSX transform means
  // components never import it just to render.
  eslintPluginReact.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules
    }
  },
  // Last on purpose. This turns off every stylistic rule that would fight
  // Prettier, and reports formatting violations as lint problems instead --
  // which is why `npm run lint` catches things `npm run format` then fixes.
  eslintConfigPrettier
)
