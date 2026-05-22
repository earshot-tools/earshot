import { defineConfig } from 'vitest/config'

import { createVitestConfig } from '../tools/vitest-base.config.js'

// eslint-disable-next-line import-x/no-default-export
export default createVitestConfig({
  defineConfig,
  workspaceDir: import.meta.dirname,
  workspaceName: 'shared',
})
