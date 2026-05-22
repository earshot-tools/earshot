// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

/**
 * Earshot plugin settings: source-of-truth shape (interface), defaults, and a
 * runtime Zod validator. The `satisfies z.ZodType<EarshotSettings>` constraint
 * ties the schema to the interface so any future divergence (a field added to
 * the interface but forgotten in the schema, or vice versa) becomes a
 * TypeScript error rather than a runtime surprise. `DEFAULT_SETTINGS` is
 * likewise tied to the interface via `satisfies` so an added field without a
 * default also fails at compile time. The schema is `.strict()` so unknown
 * keys in persisted `data.json` (e.g. a typo'd field after a rename) cause
 * `safeParse` to fail with an `unrecognized_keys` issue rather than being
 * silently retained. A complementary `expectTypeOf` round-trip in the test
 * file catches the reverse drift (field removed from the interface but left
 * in the schema) which `satisfies` alone cannot detect.
 *
 * MVP fields only — `sttProvider`, diarization knobs, and preflight settings
 * are deferred to Phase 1b. This file is pure data: no I/O, no module-level
 * side effects, no globals.
 */

import { z } from 'zod'

import type { LogLevel } from '../util/logger.js'

export type CaptureMode = 'mic' | 'system' | 'both'

export interface EarshotSettings {
  readonly meetingFolder: string
  readonly audioFolder: string
  readonly captureMode: CaptureMode
  readonly logLevel: LogLevel
}

export const DEFAULT_SETTINGS: EarshotSettings = {
  meetingFolder: 'Meetings',
  audioFolder: 'Meetings/_audio',
  captureMode: 'both',
  logLevel: 'info',
}

export const EarshotSettingsSchema = z
  .object({
    meetingFolder: z.string().min(1, 'meetingFolder must not be empty'),
    audioFolder: z.string().min(1, 'audioFolder must not be empty'),
    captureMode: z.enum(['mic', 'system', 'both']),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']),
  })
  .strict() satisfies z.ZodType<EarshotSettings>
