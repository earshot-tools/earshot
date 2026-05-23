// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

/**
 * ensureFolder tests for MeetingNoteWriter — separated from the main spec to
 * keep both files under the 300-line cap.
 *
 * Issue surfaced by the first dogfood install (#13): Obsidian's `Vault.create`
 * requires the parent folder to already exist; it does not auto-create
 * intermediate folders. A fresh vault without `Meetings/` produced
 * "Folder does not exist" on Start. `createNote` now pre-creates the folder
 * via `Vault.createFolder` when `getAbstractFileByPath` returns null.
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
  createFolder: ReturnType<typeof vi.fn>
}

type FakeVaultDep = Pick<Vault, 'create' | 'process' | 'getAbstractFileByPath' | 'createFolder'>

interface LoggerSpy {
  debug: ReturnType<typeof vi.fn>
  info: ReturnType<typeof vi.fn>
  warn: ReturnType<typeof vi.fn>
  error: ReturnType<typeof vi.fn>
}

const DEFAULT_PATH = 'Meetings/Team standup.md'
const STARTED_ISO = '2026-05-23T12:00:00.000Z'

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
  return {
    create: vi.fn(),
    process: vi.fn(),
    getAbstractFileByPath: vi.fn(),
    createFolder: vi.fn().mockResolvedValue(undefined),
  }
}

function makeWriter(vault: FakeVault, logger: Logger): MeetingNoteWriter {
  const deps: MeetingNoteWriterDeps = {
    vault: vault as unknown as FakeVaultDep,
    logger,
  }
  return new MeetingNoteWriter(deps)
}

function makeTFile(path: string): TFile {
  return { path } as unknown as TFile
}

beforeEach(() => {
  vi.restoreAllMocks()
})

it('createNote creates the meeting folder when getAbstractFileByPath returns null', async () => {
  const vault = makeVault()
  const logger = makeLogger()
  vault.getAbstractFileByPath.mockReturnValue(null)
  vault.create.mockResolvedValue(makeTFile(DEFAULT_PATH))

  await makeWriter(vault, logger).createNote(BASE_OPTS)

  expect(vault.getAbstractFileByPath).toHaveBeenCalledWith('Meetings')
  expect(vault.createFolder).toHaveBeenCalledWith('Meetings')
  expect(vault.create).toHaveBeenCalledWith(DEFAULT_PATH, expect.any(String))
  expect(logger.info).toHaveBeenCalledWith('created meeting folder', {
    meetingFolder: 'Meetings',
  })
})

it('createNote skips createFolder when the meeting folder already exists', async () => {
  const vault = makeVault()
  vault.getAbstractFileByPath.mockReturnValue({ children: [] })
  vault.create.mockResolvedValue(makeTFile(DEFAULT_PATH))

  await makeWriter(vault, makeLogger()).createNote(BASE_OPTS)

  expect(vault.getAbstractFileByPath).toHaveBeenCalledWith('Meetings')
  expect(vault.createFolder).not.toHaveBeenCalled()
  expect(vault.create).toHaveBeenCalledTimes(1)
})

it('createNote skips folder check entirely when meetingFolder is empty', async () => {
  const vault = makeVault()
  vault.create.mockResolvedValue(makeTFile('Team standup.md'))

  await makeWriter(vault, makeLogger()).createNote({ ...BASE_OPTS, meetingFolder: '' })

  expect(vault.getAbstractFileByPath).not.toHaveBeenCalled()
  expect(vault.createFolder).not.toHaveBeenCalled()
  expect(vault.create).toHaveBeenCalledWith('Team standup.md', expect.any(String))
})

it.each([
  ['Error rejections', new Error('permission denied'), 'permission denied'],
  ['non-Error rejections (string)', 'EACCES', 'EACCES'],
] as const)(
  'createNote wraps Vault.createFolder %s with folder context',
  async (_label, thrown, reason) => {
    const vault = makeVault()
    const logger = makeLogger()
    vault.getAbstractFileByPath.mockReturnValue(null)
    vault.createFolder.mockRejectedValue(thrown)

    await expect(makeWriter(vault, logger).createNote(BASE_OPTS)).rejects.toThrow(
      `cannot create meeting folder Meetings: ${reason}`,
    )
    expect(logger.error).toHaveBeenCalledWith('failed to create meeting folder', {
      meetingFolder: 'Meetings',
      reason,
    })
    expect(vault.create).not.toHaveBeenCalled()
  },
)
