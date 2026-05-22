// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

/**
 * Hardening tests for MeetingNoteWriter — separated from the main spec to
 * keep both files under the 300-line cap. Covers two CONCERNs from the
 * code-quality review of 12e8caf:
 *
 *   1. sanitizeTitle previously missed control characters (\n, \r, \t, NUL).
 *      A title with embedded newlines could inject a second frontmatter
 *      block into the rendered body — these tests pin the path-level and
 *      H1-level mitigations.
 *
 *   2. rewriteBlock previously re-serialised every entry as `key: value`,
 *      dropping indentation on nested mappings (e.g. dataview/templater
 *      plugins emit `position:\n  start: 0\n  end: 100`). The test below
 *      asserts that nested keys retain their EXACT indentation after
 *      markCompleted runs.
 */

import { beforeEach, expect, it, vi } from 'vitest'

import { MeetingNoteWriter } from '../MeetingNoteWriter.js'

import type { Logger } from '../../util/logger.js'
import type { CreateNoteOptions, MeetingNoteWriterDeps } from '../MeetingNoteWriter.js'
import type { TFile, Vault } from 'obsidian'

interface FakeVault {
  create: ReturnType<typeof vi.fn>
  process: ReturnType<typeof vi.fn>
  getAbstractFileByPath: ReturnType<typeof vi.fn>
}

interface LoggerSpy {
  debug: ReturnType<typeof vi.fn>
  info: ReturnType<typeof vi.fn>
  warn: ReturnType<typeof vi.fn>
  error: ReturnType<typeof vi.fn>
}

const STARTED_ISO = '2026-05-22T10:00:00.000Z'
const ENDED_ISO = '2026-05-22T11:30:00.000Z'
const FIXED_END = new Date(ENDED_ISO)
const HORIZONTAL_RULE = '---\n'
const STARTED_LINE = `started: ${STARTED_ISO}\n`
const ENDED_LINE = `ended: ${ENDED_ISO}\n`
const STATUS_COMPLETED_LINE = 'status: completed\n'
const STATUS_RECORDING_LINE = 'status: recording\n'

const BASE_OPTS: CreateNoteOptions = {
  title: 'Team standup',
  meetingFolder: 'Meetings',
  captureMode: 'both',
  startedAt: new Date(STARTED_ISO),
}

function makeLogger(): LoggerSpy {
  return { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() }
}

function makeVault(): FakeVault {
  return { create: vi.fn(), process: vi.fn(), getAbstractFileByPath: vi.fn() }
}

function makeWriter(vault: FakeVault, logger: Logger): MeetingNoteWriter {
  const deps: MeetingNoteWriterDeps = {
    vault: vault as unknown as Pick<Vault, 'create' | 'process' | 'getAbstractFileByPath'>,
    logger,
  }
  return new MeetingNoteWriter(deps)
}

function makeTFile(path: string): TFile {
  return { path } as unknown as TFile
}

function captureProcessResult(vault: FakeVault, initial: string): { read: () => string | null } {
  let observed: string | null = null
  vault.process.mockImplementation(async (_file: TFile, fn: (s: string) => string) => {
    observed = fn(initial)
    return observed
  })
  return { read: () => observed }
}

beforeEach(() => {
  vi.restoreAllMocks()
})

it('createNote strips control chars from path AND H1 (newline, tab, CR, NUL)', async () => {
  const vault = makeVault()
  const writer = makeWriter(vault, makeLogger())
  vault.create.mockResolvedValue(makeTFile('x'))
  await writer.createNote({ ...BASE_OPTS, title: 'hello\nworld\ttab\rcr\u0000nul' })
  expect(vault.create).toHaveBeenCalledWith(
    'Meetings/hello-world-tab-cr-nul.md',
    expect.stringContaining('# hello world tab cr nul\n'),
  )
})

it('createNote prevents body-injection via title with frontmatter delimiters', async () => {
  const vault = makeVault()
  const writer = makeWriter(vault, makeLogger())
  vault.create.mockResolvedValue(makeTFile('x'))
  await writer.createNote({ ...BASE_OPTS, title: 'safe\n---\ninjected: true\n---\n' })
  const callBody: unknown = vault.create.mock.calls[0]?.[1]
  expect(typeof callBody).toBe('string')
  if (typeof callBody === 'string') {
    const lines = callBody.split('\n')
    expect(lines.filter((line) => line === '---').length).toBe(2)
    expect(lines.some((line) => line.trim() === 'injected: true')).toBe(false)
  }
})

it('markCompleted preserves nested-mapping frontmatter with exact indentation', async () => {
  const vault = makeVault()
  const writer = makeWriter(vault, makeLogger())
  const file = makeTFile('Notes/nested.md')
  const NESTED_BLOCK =
    'custom_key: value\nposition:\n  start: 0\n  end: 100\ncreated: 2026-05-22T10:00:00Z\n'
  const initial =
    HORIZONTAL_RULE +
    NESTED_BLOCK +
    STARTED_LINE +
    STATUS_RECORDING_LINE +
    HORIZONTAL_RULE +
    '\nbody\n'
  const probe = captureProcessResult(vault, initial)
  await writer.markCompleted(file, { endedAt: FIXED_END })
  const expected =
    HORIZONTAL_RULE +
    NESTED_BLOCK +
    STARTED_LINE +
    ENDED_LINE +
    STATUS_COMPLETED_LINE +
    HORIZONTAL_RULE +
    '\nbody\n'
  expect(probe.read()).toBe(expected)
})
