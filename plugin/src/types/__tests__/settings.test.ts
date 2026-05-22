// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

import { describe, expect, expectTypeOf, it } from 'vitest'

import { DEFAULT_SETTINGS, EarshotSettingsSchema } from '../settings.js'

import type { EarshotSettings } from '../settings.js'
import type { z } from 'zod'

function pathsOf(issues: ReadonlyArray<{ readonly path: ReadonlyArray<PropertyKey> }>): string[] {
  return issues.map((issue) => issue.path.join('.'))
}

describe('DEFAULT_SETTINGS', () => {
  it('has the four MVP fields with exact spec values', () => {
    expect(DEFAULT_SETTINGS.meetingFolder).toBe('Meetings')
    expect(DEFAULT_SETTINGS.audioFolder).toBe('Meetings/_audio')
    expect(DEFAULT_SETTINGS.captureMode).toBe('both')
    expect(DEFAULT_SETTINGS.logLevel).toBe('info')
  })

  it('exposes exactly four enumerable keys (no surprise extras)', () => {
    expect(Object.keys(DEFAULT_SETTINGS).sort((aa, bb) => aa.localeCompare(bb))).toStrictEqual([
      'audioFolder',
      'captureMode',
      'logLevel',
      'meetingFolder',
    ])
  })
})

describe('EarshotSettingsSchema — happy paths', () => {
  it('accepts DEFAULT_SETTINGS as valid', () => {
    const result = EarshotSettingsSchema.safeParse(DEFAULT_SETTINGS)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toStrictEqual(DEFAULT_SETTINGS)
    }
  })

  it('accepts a valid override (captureMode = mic) and returns parsed data equal to input', () => {
    const input = { ...DEFAULT_SETTINGS, captureMode: 'mic' as const }
    const result = EarshotSettingsSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toStrictEqual(input)
    }
  })

  it('accepts every captureMode variant', () => {
    for (const mode of ['mic', 'system', 'both'] as const) {
      const result = EarshotSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, captureMode: mode })
      expect(result.success).toBe(true)
    }
  })

  it('accepts every logLevel variant', () => {
    for (const level of ['debug', 'info', 'warn', 'error'] as const) {
      const result = EarshotSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, logLevel: level })
      expect(result.success).toBe(true)
    }
  })
})

describe('EarshotSettingsSchema — failure paths', () => {
  it('rejects empty object with issues for all four fields', () => {
    const result = EarshotSettingsSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = pathsOf(result.error.issues)
      expect(paths).toContain('meetingFolder')
      expect(paths).toContain('audioFolder')
      expect(paths).toContain('captureMode')
      expect(paths).toContain('logLevel')
    }
  })

  it('rejects a bogus captureMode value', () => {
    const result = EarshotSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, captureMode: 'bogus' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(pathsOf(result.error.issues)).toContain('captureMode')
    }
  })

  it('rejects an unknown logLevel value', () => {
    const result = EarshotSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, logLevel: 'trace' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(pathsOf(result.error.issues)).toContain('logLevel')
    }
  })

  it('rejects an empty meetingFolder string', () => {
    const result = EarshotSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, meetingFolder: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(pathsOf(result.error.issues)).toContain('meetingFolder')
    }
  })

  it('rejects an empty audioFolder string', () => {
    const result = EarshotSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, audioFolder: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(pathsOf(result.error.issues)).toContain('audioFolder')
    }
  })

  it('rejects a non-string folder value', () => {
    const result = EarshotSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, meetingFolder: 42 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(pathsOf(result.error.issues)).toContain('meetingFolder')
    }
  })
})

describe('EarshotSettingsSchema — strict mode', () => {
  it('rejects unknown keys with an unrecognized_keys issue mentioning the field', () => {
    const result = EarshotSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, surpriseField: 1 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const { issues } = result.error
      const hasSurpriseSignal = issues.some((issue) => {
        const codeMatches = issue.code === 'unrecognized_keys'
        const keysHint =
          'keys' in issue && Array.isArray(issue.keys)
            ? issue.keys.includes('surpriseField')
            : false
        const messageHint = issue.message.includes('surpriseField')
        return codeMatches || keysHint || messageHint
      })
      expect(hasSurpriseSignal).toBe(true)
    }
  })
})

describe('EarshotSettingsSchema — type contract', () => {
  it('infers an output type structurally equal to EarshotSettings', () => {
    // Compile-time check: if a field is removed from EarshotSettings but left
    // in the schema (or vice versa), this `toEqualTypeOf` fails to type-check.
    // The `satisfies z.ZodType<EarshotSettings>` clause catches additions to
    // the interface; this catches removals.
    //
    // Both sides are wrapped in `Readonly<>` because zod's `z.infer<>` strips
    // the `readonly` modifier from each property while `EarshotSettings`
    // declares them readonly. Normalizing the modifier keeps the key-set
    // equality check intact while sidestepping a spurious modifier mismatch.
    expectTypeOf<Readonly<z.infer<typeof EarshotSettingsSchema>>>().toEqualTypeOf<
      Readonly<EarshotSettings>
    >()
  })
})
