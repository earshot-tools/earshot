import { createBaseConfig } from '../tools/eslint-base.config.js'

import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import importX from 'eslint-plugin-import-x'
import sonarjs from 'eslint-plugin-sonarjs'
import unicorn from 'eslint-plugin-unicorn'

// eslint-disable-next-line import-x/no-default-export
export default createBaseConfig({
  plugins: { tsPlugin, tsParser, importX, sonarjs, unicorn },
  tsconfigRootDir: import.meta.dirname,
  enableDDDLayerRules: false,
  frontend: false,
})
