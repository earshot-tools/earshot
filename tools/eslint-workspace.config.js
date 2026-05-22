// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.
//
// Per-workspace ESLint flat-config wrapper.
//
// ESLint's flat-config resolver discovers `eslint.config.{js,mjs}` per
// workspace; we cannot share one file across workspaces directly. But
// for Node+TS workspaces (plugin/, shared/) the BOILERPLATE is identical:
// same plugins, same call to `createBaseConfig`, same options. jscpd
// rightly flags the duplication.
//
// This helper centralises the boilerplate. A workspace's eslint.config.js
// becomes a one-liner:
//
//   export default createWorkspaceConfig({ tsconfigRootDir: import.meta.dirname })
//
// If a workspace later needs DDD layers, React, or other workspace-specific
// rules, it can either pass extra options here or stop using this helper.

import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import importX from 'eslint-plugin-import-x'
import sonarjs from 'eslint-plugin-sonarjs'
import unicorn from 'eslint-plugin-unicorn'

import { createBaseConfig } from './eslint-base.config.js'

/**
 * Build a workspace ESLint config with the standard Node+TS profile.
 *
 * @param {object} opts
 * @param {string} opts.tsconfigRootDir - Pass `import.meta.dirname` from the
 *   calling workspace.
 * @param {boolean} [opts.enableDDDLayerRules=false] - Enable DDD layer
 *   restrictions in `createBaseConfig`.
 * @param {boolean} [opts.frontend=false] - Enable React+a11y rules.
 * @returns {Array} ESLint flat config
 */
export function createWorkspaceConfig({
  tsconfigRootDir,
  enableDDDLayerRules = false,
  frontend = false,
}) {
  return createBaseConfig({
    plugins: { tsPlugin, tsParser, importX, sonarjs, unicorn },
    tsconfigRootDir,
    enableDDDLayerRules,
    frontend,
  })
}
