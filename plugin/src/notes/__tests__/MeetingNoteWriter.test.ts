// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

import { beforeEach, expect, it, vi } from 'vitest'

import { MeetingNoteWriter } from '../MeetingNoteWriter.js'

import type { Logger } from '../../util/logger.js'
import type { CreateNoteOptions, MeetingNoteWriterDeps } from '../MeetingNoteWriter.js'
import type { TFile, Vault } from 'obsidian'

interface FakeVault {
  create: ReturnType<typeof vi.fn>
  process: ReturnType<typeof vi.fn>
  getAbstractFileByPath: ReturnType<typeof vi.fn>
  createFolder: ReturnType<typeof vi.fn>
}

type FakeVaultDep = Pick<Vault, 'create' | 'process' | 'getAbstractFileByPath' | 'createFolder'>

interface LoggerSpy {
  debug: ReturnType<typeof vi.fn>
  info: ReturnType<typeof vi.fn>
  warn: ReturnType<typeof vi.fn>
  error: ReturnType<typeof vi.fn>
}

interface Harness {
  readonly vault: FakeVault
  readonly logger: LoggerSpy
  readonly writer: MeetingNoteWriter
}

const DEFAULT_PATH = 'Meetings/Team standup.md'
const STARTED_ISO = '2026-05-22T10:00:00.000Z'
const ENDED_ISO = '2026-05-22T11:30:00.000Z'
const FIXED_START = new Date(STARTED_ISO)
const FIXED_END = new Date(ENDED_ISO)
const HORIZONTAL_RULE = '---\n'
const STATUS_COMPLETED_LINE = 'status: completed\n'
const STARTED_LINE = `started: ${STARTED_ISO}\n`
const ENDED_LINE = `ended: ${ENDED_ISO}\n`
const CAPTURE_BOTH_LINE = 'capture_mode: both\n'
const STATUS_RECORDING_LINE = 'status: recording\n'
const SCRATCH_PATH = 'Meetings/x.md'
const BODY_TAIL = '\n# Team standup\n\nbody content\n'
const PROCESS_NAME = 'meeting note marked completed'
const CREATE_NAME = 'meeting note created'
const CREATE_ERROR_NAME = 'failed to create meeting note'
const PROCESS_ERROR_NAME = 'failed to mark meeting note completed'

const BASE_OPTS: CreateNoteOptions = {
  title: 'Team standup',
  meetingFolder: 'Meetings',
  captureMode: 'both',
  startedAt: FIXED_START,
}

function makeLogger(): LoggerSpy {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}

function makeVault(): FakeVault {
  return {
    create: vi.fn(),
    process: vi.fn(),
    // Default to "folder already exists" so existing tests do not need to
    // worry about ensureFolder side effects; tests that need the missing-
    // folder path set this to return null explicitly.
    getAbstractFileByPath: vi.fn().mockReturnValue({ children: [] }),
    createFolder: vi.fn().mockResolvedValue(undefined),
  }
}

function makeWriter(vault: FakeVault, logger: Logger): MeetingNoteWriter {
  // The FakeVault structurally satisfies the narrow Pick<Vault, ...> contract
  // MeetingNoteWriterDeps demands. A focused cast through `unknown` keeps the
  // test suite free of `any` while acknowledging the structural shim.
  const deps: MeetingNoteWriterDeps = {
    vault: vault as unknown as FakeVaultDep,
    logger,
  }
  return new MeetingNoteWriter(deps)
}

function makeHarness(): Harness {
  const vault = makeVault()
  const logger = makeLogger()
  return { vault, logger, writer: makeWriter(vault, logger) }
}

function makeTFile(path: string): TFile {
  // Production code only touches `file.path`; everything else on TFile is
  // irrelevant here and casting through unknown keeps the shim tight.
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

it('createNote writes the expected body via Vault.create and returns the resulting TFile', async () => {
  const { vault, writer } = makeHarness()
  const tfile = makeTFile(DEFAULT_PATH)
  vault.create.mockResolvedValue(tfile)

  const result = await writer.createNote(BASE_OPTS)

  expect(result).toBe(tfile)
  expect(vault.create).toHaveBeenCalledTimes(1)
  const expectedBody =
    HORIZONTAL_RULE +
    STATUS_RECORDING_LINE +
    STARTED_LINE +
    CAPTURE_BOTH_LINE +
    HORIZONTAL_RULE +
    '\n# Team standup\n\n'
  expect(vault.create).toHaveBeenCalledWith(DEFAULT_PATH, expectedBody)
})

it('createNote sanitizes path-illegal chars in the title (slash, colon, etc.)', async () => {
  const { vault, writer } = makeHarness()
  vault.create.mockResolvedValue(makeTFile('x'))

  await writer.createNote({ ...BASE_OPTS, title: 'Q1 plan / strategy: 2026' })

  expect(vault.create).toHaveBeenCalledWith(
    'Meetings/Q1 plan - strategy- 2026.md',
    expect.stringContaining('# Q1 plan / strategy: 2026'),
  )
})

it('createNote collapses runs of dashes from repeated illegal chars', async () => {
  const { vault, writer } = makeHarness()
  vault.create.mockResolvedValue(makeTFile('x'))

  await writer.createNote({ ...BASE_OPTS, title: '/// /// ///' })

  // Each `///` collapses to a single `-`; the leading and trailing dashes
  // are trimmed off the edges, leaving the ` - ` middle chunk.
  expect(vault.create).toHaveBeenCalledWith('Meetings/ - .md', expect.any(String))
})

it('createNote produces a leading-slash-free path when meetingFolder is empty', async () => {
  const { vault, writer } = makeHarness()
  vault.create.mockResolvedValue(makeTFile('x'))

  await writer.createNote({ ...BASE_OPTS, meetingFolder: '' })

  const callPath: unknown = vault.create.mock.calls[0]?.[0]
  expect(callPath).toBe('Team standup.md')
  expect(typeof callPath === 'string' && callPath.startsWith('/')).toBe(false)
})

it('createNote throws when the sanitized title collapses to the empty string', async () => {
  const { vault, writer } = makeHarness()

  await expect(writer.createNote({ ...BASE_OPTS, title: '###' })).rejects.toThrow(
    'cannot create meeting note: title sanitized to empty string',
  )
  expect(vault.create).not.toHaveBeenCalled()
})

it('createNote logs info with the resolved path on success', async () => {
  const { vault, logger, writer } = makeHarness()
  vault.create.mockResolvedValue(makeTFile(DEFAULT_PATH))

  await writer.createNote(BASE_OPTS)

  expect(logger.info).toHaveBeenCalledWith(CREATE_NAME, { path: DEFAULT_PATH })
  expect(logger.error).not.toHaveBeenCalled()
})

it.each([
  ['Error rejections', new Error('file exists'), 'file exists'],
  ['non-Error rejections (string)', 'disk full', 'disk full'],
] as const)(
  'createNote wraps Vault.create %s with path context',
  async (_label, thrown, reason) => {
    const { vault, logger, writer } = makeHarness()
    vault.create.mockRejectedValue(thrown)

    await expect(writer.createNote(BASE_OPTS)).rejects.toThrow(
      `cannot create meeting note at ${DEFAULT_PATH}: ${reason}`,
    )
    expect(logger.error).toHaveBeenCalledWith(CREATE_ERROR_NAME, {
      path: DEFAULT_PATH,
      reason,
    })
  },
)

it('markCompleted preserves every existing frontmatter key and inserts ended after started', async () => {
  const { vault, writer } = makeHarness()
  const file = makeTFile(DEFAULT_PATH)
  const initial =
    HORIZONTAL_RULE +
    STATUS_RECORDING_LINE +
    STARTED_LINE +
    CAPTURE_BOTH_LINE +
    'custom_key: keep me\n' +
    HORIZONTAL_RULE +
    BODY_TAIL
  const probe = captureProcessResult(vault, initial)

  await writer.markCompleted(file, { endedAt: FIXED_END })

  const expected =
    HORIZONTAL_RULE +
    STATUS_COMPLETED_LINE +
    STARTED_LINE +
    ENDED_LINE +
    CAPTURE_BOTH_LINE +
    'custom_key: keep me\n' +
    HORIZONTAL_RULE +
    BODY_TAIL
  expect(probe.read()).toBe(expected)
})

it('markCompleted appends ended at the end when started is absent', async () => {
  const { vault, writer } = makeHarness()
  const file = makeTFile('Notes/no-started.md')
  const initial =
    HORIZONTAL_RULE + 'status: recording\n' + 'capture_mode: mic\n' + HORIZONTAL_RULE + 'body\n'
  const probe = captureProcessResult(vault, initial)

  await writer.markCompleted(file, { endedAt: FIXED_END })

  const expected =
    HORIZONTAL_RULE +
    STATUS_COMPLETED_LINE +
    'capture_mode: mic\n' +
    ENDED_LINE +
    HORIZONTAL_RULE +
    'body\n'
  expect(probe.read()).toBe(expected)
})

it('markCompleted replaces an existing ended value rather than duplicating it', async () => {
  const { vault, writer } = makeHarness()
  const file = makeTFile('Notes/already-ended.md')
  const initial =
    HORIZONTAL_RULE +
    STATUS_RECORDING_LINE +
    STARTED_LINE +
    'ended: 2026-05-22T10:30:00.000Z\n' +
    HORIZONTAL_RULE +
    'body\n'
  const probe = captureProcessResult(vault, initial)

  await writer.markCompleted(file, { endedAt: FIXED_END })

  const expected =
    HORIZONTAL_RULE + STATUS_COMPLETED_LINE + STARTED_LINE + ENDED_LINE + HORIZONTAL_RULE + 'body\n'
  expect(probe.read()).toBe(expected)
})

it('markCompleted synthesizes and prepends a minimal block when frontmatter is absent', async () => {
  const { vault, writer } = makeHarness()
  const file = makeTFile('Notes/raw.md')
  const initial = '# raw note\n\nsome body\n'
  const probe = captureProcessResult(vault, initial)

  await writer.markCompleted(file, { endedAt: FIXED_END })

  const expected =
    HORIZONTAL_RULE +
    STATUS_COMPLETED_LINE +
    ENDED_LINE +
    HORIZONTAL_RULE +
    '\n# raw note\n\nsome body\n'
  expect(probe.read()).toBe(expected)
})

it('markCompleted preserves frontmatter lines that lack a colon (treats them as opaque)', async () => {
  const { vault, writer } = makeHarness()
  const file = makeTFile('Notes/odd.md')
  const initial =
    HORIZONTAL_RULE +
    STATUS_RECORDING_LINE +
    STARTED_LINE +
    'opaque-line\n' +
    HORIZONTAL_RULE +
    'body\n'
  const probe = captureProcessResult(vault, initial)

  await writer.markCompleted(file, { endedAt: FIXED_END })

  const result = probe.read()
  expect(result).toContain('opaque-line')
  expect(result).toContain('status: completed')
  expect(result).toContain(`ended: ${ENDED_ISO}`)
})

it('markCompleted appends status when existing frontmatter lacks it entirely', async () => {
  const { vault, writer } = makeHarness()
  const file = makeTFile('Notes/no-status.md')
  const initial = HORIZONTAL_RULE + STARTED_LINE + HORIZONTAL_RULE + 'body\n'
  const probe = captureProcessResult(vault, initial)

  await writer.markCompleted(file, { endedAt: FIXED_END })

  const expected =
    HORIZONTAL_RULE + STARTED_LINE + ENDED_LINE + STATUS_COMPLETED_LINE + HORIZONTAL_RULE + 'body\n'
  expect(probe.read()).toBe(expected)
})

it('markCompleted treats colon-prefixed lines (empty key) as opaque', async () => {
  const { vault, writer } = makeHarness()
  const file = makeTFile('Notes/colon-prefix.md')
  const initial =
    HORIZONTAL_RULE +
    STATUS_RECORDING_LINE +
    STARTED_LINE +
    ': empty key line\n' +
    HORIZONTAL_RULE +
    'body\n'
  const probe = captureProcessResult(vault, initial)

  await writer.markCompleted(file, { endedAt: FIXED_END })

  const result = probe.read()
  expect(result).toContain(': empty key line')
  expect(result).toContain('status: completed')
})

it('markCompleted logs info with the file path on success', async () => {
  const { vault, logger, writer } = makeHarness()
  const file = makeTFile(SCRATCH_PATH)
  vault.process.mockResolvedValue('whatever')

  await writer.markCompleted(file, { endedAt: FIXED_END })

  expect(logger.info).toHaveBeenCalledWith(PROCESS_NAME, { path: SCRATCH_PATH })
  expect(logger.error).not.toHaveBeenCalled()
})

it.each([
  ['Error rejections', new Error('locked'), 'locked'],
  ['non-Error rejections (string)', 'boom', 'boom'],
] as const)('markCompleted re-throws Vault.process %s', async (_label, thrown, reason) => {
  const { vault, logger, writer } = makeHarness()
  const file = makeTFile(SCRATCH_PATH)
  vault.process.mockRejectedValue(thrown)

  await expect(writer.markCompleted(file, { endedAt: FIXED_END })).rejects.toThrow(reason)
  expect(logger.error).toHaveBeenCalledWith(PROCESS_ERROR_NAME, {
    path: SCRATCH_PATH,
    reason,
  })
})
