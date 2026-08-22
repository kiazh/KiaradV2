import next from 'eslint-config-next'
import coreWebVitals from 'eslint-config-next/core-web-vitals'

/**
 * `eslint` and `eslint-config-next` were already dependencies and package.json
 * already had a `lint` script, but no config file existed, so `npm run lint`
 * failed outright. This is the flat config ESLint 9+ expects.
 */
const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      // Local diagnostic scripts, already gitignored.
      '*-probe.mjs',
      // Vendored tooling, not our source.
      '.kiro/**',
      '.impeccable/**',
    ],
  },
  ...next,
  ...coreWebVitals,
]

export default config
