// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

import esbuild from 'esbuild'
import process from 'node:process'

const isProduction = process.argv[2] === 'production'

const obsidianExternals = [
  'obsidian',
  'electron',
  '@codemirror/autocomplete',
  '@codemirror/collab',
  '@codemirror/commands',
  '@codemirror/language',
  '@codemirror/lint',
  '@codemirror/search',
  '@codemirror/state',
  '@codemirror/view',
  '@lezer/common',
  '@lezer/highlight',
  '@lezer/lr',
]

const nodeBuiltinNames = [
  'fs',
  'fs/promises',
  'path',
  'http',
  'https',
  'crypto',
  'os',
  'child_process',
  'stream',
  'util',
  'events',
  'buffer',
  'url',
  'querystring',
  'zlib',
]

const nodeBuiltins = [
  ...nodeBuiltinNames,
  ...nodeBuiltinNames.map((name) => `node:${name}`),
  'node:test',
]

const banner = {
  js: '/* SPDX-License-Identifier: MIT — Copyright (c) 2026 Inoyatov Khamidulla and contributors. */',
}

const baseConfig = {
  entryPoints: ['plugin/src/main.ts'],
  bundle: true,
  outfile: 'main.js',
  format: 'cjs',
  platform: 'browser',
  target: 'es2022',
  mainFields: ['browser', 'module', 'main'],
  external: [...obsidianExternals, ...nodeBuiltins],
  logLevel: 'info',
  treeShaking: true,
  banner,
}

if (isProduction) {
  await esbuild.build({
    ...baseConfig,
    minify: false,
    sourcemap: false,
    drop: ['debugger'],
  })
  // eslint-disable-next-line no-console
  console.log('[esbuild] production build complete → main.js')
} else {
  const ctx = await esbuild.context({
    ...baseConfig,
    sourcemap: 'inline',
  })
  await ctx.watch()
  // eslint-disable-next-line no-console
  console.log('[esbuild] watching plugin/src/main.ts → main.js')
}
