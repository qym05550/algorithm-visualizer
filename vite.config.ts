import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// The single canonical source of the application's version (Version
// Badge task): package.json's "version" field. Read once, here, at
// config-load time — never duplicated as a second hardcoded string
// anywhere else in the project.
const packageJson = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Substitutes __APP_VERSION__ with the literal version string at build
  // time (both `vite build` and `vite`/dev server) — a plain compile-time
  // constant, not a runtime fetch of package.json and not a dependency.
  // See src/vite-env.d.ts for the corresponding ambient type declaration,
  // and src/components/VersionBadge.tsx for the only place it's read.
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
