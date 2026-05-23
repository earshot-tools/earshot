// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { TFile } from 'obsidian'

interface CommandSpec {
  readonly id: string
  readonly name: string
  readonly callback: () => void
}

interface StatusEl {
  text: string
  readonly setText: (value: string) => void
}

const noticeCalls: string[] = []
const statusBarEls: StatusEl[] = []
const commands: CommandSpec[] = []
let mockDataStore: unknown = null
const vaultCreate = vi.fn()
const vaultProcess = vi.fn()
// Default to "folder exists" so the MeetingNoteWriter.ensureFolder step is a
// no-op in main.test.ts (the missing-folder path is exercised in
// MeetingNoteWriter.test.ts).
const vaultGetAbstractFileByPath = vi.fn().mockReturnValue({ children: [] })
const vaultCreateFolder = vi.fn().mockResolvedValue(undefined)

// Mocked Plugin shim mirrors only the subset of `obsidian.Plugin` that
// EarshotPlugin actually uses (app.vault triple, loadData/saveData,
// addStatusBarItem, addCommand). Anything beyond that is absent so production
// code reaching for new API trips the type-checker.
vi.mock('obsidian', () => {
  class PluginMock {
    public app = {
      vault: {
        create: vaultCreate,
        process: vaultProcess,
        getAbstractFileByPath: vaultGetAbstractFileByPath,
        createFolder: vaultCreateFolder,
      },
    }
    public async loadData(): Promise<unknown> {
      return mockDataStore
    }
    public async saveData(data: unknown): Promise<void> {
      mockDataStore = data
    }
    public addStatusBarItem(): StatusEl {
      const el: StatusEl = {
        text: '',
        setText(value: string): void {
          el.text = value
        },
      }
      statusBarEls.push(el)
      return el
    }
    public addCommand(cmd: CommandSpec): void {
      commands.push(cmd)
    }
  }
  class NoticeMock {
    public constructor(message: string) {
      noticeCalls.push(message)
    }
  }
  return { Plugin: PluginMock, Notice: NoticeMock }
})

const { default: EarshotPlugin } = await import('../main.js')
const { default: IndexDefault } = await import('../index.js')

type PluginInstance = InstanceType<typeof EarshotPlugin>

const START_ID = 'earshot-start-recording'
const STOP_ID = 'earshot-stop-recording'
const STATUS_IDLE = 'Earshot: idle'
const STATUS_RECORDING = 'Earshot: recording'
const NOTICE_NOT_RECORDING = 'Earshot: not currently recording'
const FAIL_START_PREFIX = 'Earshot: failed to start'
const FAIL_STOP_PREFIX = 'Earshot: failed to stop'
const SAMPLE_PATH = 'Meetings/x.md'

function makePlugin(): PluginInstance {
  // Mocked Plugin shim is zero-arg; the real ctor takes (app, manifest).
  // Cast through unknown to avoid any/!.
  const Ctor = EarshotPlugin as unknown as new () => PluginInstance
  return new Ctor()
}

function makeTFile(path: string): TFile {
  // Production only touches `file.path`; structural shim through unknown.
  return { path } as unknown as TFile
}

function findCommand(id: string): CommandSpec {
  const cmd = commands.find((entry) => entry.id === id)
  if (cmd === undefined) {
    throw new Error(`command not registered: ${id}`)
  }
  return cmd
}

function latestStatusBar(): StatusEl {
  const el = statusBarEls.at(-1)
  if (el === undefined) {
    throw new Error('no status bar element registered')
  }
  return el
}

async function runCallback(id: string): Promise<void> {
  findCommand(id).callback()
  // Drain microtasks so the unawaited `void this.handleX()` and the inner
  // createNote/markCompleted promises settle before assertions run.
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

async function startSuccessfully(path = SAMPLE_PATH): Promise<PluginInstance> {
  const plugin = makePlugin()
  await plugin.onload()
  vaultCreate.mockResolvedValue(makeTFile(path))
  await runCallback(START_ID)
  return plugin
}

beforeEach(() => {
  noticeCalls.length = 0
  statusBarEls.length = 0
  commands.length = 0
  mockDataStore = null
  vaultCreate.mockReset()
  vaultProcess.mockReset()
  vaultGetAbstractFileByPath.mockReset()
  // Restore default-folder-exists behavior so non-ensureFolder tests don't
  // hit the createFolder branch unintentionally.
  vaultGetAbstractFileByPath.mockReturnValue({ children: [] })
  vaultCreateFolder.mockReset()
  vaultCreateFolder.mockResolvedValue(undefined)
})

describe('module shape', () => {
  it('exports a class constructor with the expected name', () => {
    expect(typeof EarshotPlugin).toBe('function')
    expect(EarshotPlugin.name).toBe('EarshotPlugin')
  })

  it('re-exports the same default class from index.ts', () => {
    expect(IndexDefault).toBe(EarshotPlugin)
  })
})

describe('onload basics', () => {
  it('registers exactly the two documented commands', async () => {
    await makePlugin().onload()
    expect(commands).toHaveLength(2)
    const ids = [...commands.map((cmd) => cmd.id)].sort((lhs, rhs) => lhs.localeCompare(rhs))
    expect(ids).toEqual([START_ID, STOP_ID])
    expect(findCommand(START_ID).name).toBe('Earshot: Start recording')
    expect(findCommand(STOP_ID).name).toBe('Earshot: Stop recording')
  })

  it('adds a status bar item showing the idle label', async () => {
    await makePlugin().onload()
    expect(statusBarEls).toHaveLength(1)
    expect(latestStatusBar().text).toBe(STATUS_IDLE)
  })

  it('emits a ready Notice', async () => {
    await makePlugin().onload()
    expect(noticeCalls).toContain('Earshot ready')
  })
})

describe('settings loading', () => {
  it('falls back to DEFAULT_SETTINGS when no persisted data exists', async () => {
    mockDataStore = null
    await startSuccessfully()
    const callPath: unknown = vaultCreate.mock.calls[0]?.[0]
    expect(typeof callPath === 'string' && callPath.startsWith('Meetings/')).toBe(true)
  })

  it('uses valid persisted settings when present', async () => {
    mockDataStore = {
      meetingFolder: 'Custom',
      audioFolder: 'Custom/_audio',
      captureMode: 'mic',
      logLevel: 'debug',
    }
    await startSuccessfully('Custom/x.md')
    const path: unknown = vaultCreate.mock.calls[0]?.[0]
    const body: unknown = vaultCreate.mock.calls[0]?.[1]
    expect(typeof path === 'string' && path.startsWith('Custom/')).toBe(true)
    expect(typeof body === 'string' && body.includes('capture_mode: mic')).toBe(true)
  })

  it('falls back to defaults when persisted data fails schema validation', async () => {
    mockDataStore = { meetingFolder: 'X', captureMode: 'invalid-mode' }
    await startSuccessfully()
    const path: unknown = vaultCreate.mock.calls[0]?.[0]
    expect(typeof path === 'string' && path.startsWith('Meetings/')).toBe(true)
  })

  it('does not throw when persisted data is missing (null)', async () => {
    mockDataStore = null
    await expect(makePlugin().onload()).resolves.toBeUndefined()
  })
})

describe('start command happy paths', () => {
  it('creates a meeting note, transitions to recording, notices, and uses ISO title', async () => {
    await startSuccessfully()
    expect(vaultCreate).toHaveBeenCalledTimes(1)
    const path: unknown = vaultCreate.mock.calls[0]?.[0]
    const body: unknown = vaultCreate.mock.calls[0]?.[1]
    expect(typeof path === 'string' && path.endsWith('.md')).toBe(true)
    expect(typeof path === 'string' && path.startsWith('Meetings/')).toBe(true)
    expect(typeof body === 'string' && body.includes('status: recording')).toBe(true)
    expect(typeof body === 'string' && /# \d{4}-\d{2}-\d{2}T\d{2}-\d{2} Meeting/.test(body)).toBe(
      true,
    )
    expect(latestStatusBar().text).toBe(STATUS_RECORDING)
    expect(noticeCalls).toContain('Earshot: recording started')
  })
})

describe('start command guards + failures', () => {
  it('refuses double-start and does not re-invoke vault.create', async () => {
    await startSuccessfully()
    vaultCreate.mockClear()
    await runCallback(START_ID)
    expect(vaultCreate).not.toHaveBeenCalled()
    expect(noticeCalls).toContain('Earshot: already recording')
  })

  it('surfaces vault.create Error failures via Notice and stays in idle', async () => {
    const plugin = makePlugin()
    await plugin.onload()
    vaultCreate.mockRejectedValue(new Error('disk full'))
    await runCallback(START_ID)
    expect(latestStatusBar().text).toBe(STATUS_IDLE)
    const fail = noticeCalls.find((msg) => msg.startsWith(FAIL_START_PREFIX))
    expect(fail).toBeDefined()
    expect(fail).toContain('disk full')
  })

  it('surfaces non-Error rejection values as their String() form', async () => {
    const plugin = makePlugin()
    await plugin.onload()
    vaultCreate.mockRejectedValue('plain-string-reason')
    await runCallback(START_ID)
    const fail = noticeCalls.find((msg) => msg.startsWith(FAIL_START_PREFIX))
    expect(fail).toContain('plain-string-reason')
  })
})

describe('stop command guards', () => {
  it('refuses stop when no recording is active', async () => {
    await makePlugin().onload()
    await runCallback(STOP_ID)
    expect(vaultProcess).not.toHaveBeenCalled()
    expect(noticeCalls).toContain(NOTICE_NOT_RECORDING)
  })

  it('after a failed start, stop is still treated as not-recording', async () => {
    const plugin = makePlugin()
    await plugin.onload()
    vaultCreate.mockRejectedValue(new Error('boom'))
    await runCallback(START_ID)
    noticeCalls.length = 0
    await runCallback(STOP_ID)
    expect(noticeCalls).toContain(NOTICE_NOT_RECORDING)
    expect(vaultProcess).not.toHaveBeenCalled()
  })
})

describe('stop command happy path', () => {
  it('after a successful start, stop calls vault.process with the same TFile', async () => {
    const tfile = makeTFile('Meetings/abc.md')
    const plugin = makePlugin()
    await plugin.onload()
    vaultCreate.mockResolvedValue(tfile)
    vaultProcess.mockResolvedValue(undefined)
    await runCallback(START_ID)
    await runCallback(STOP_ID)
    expect(vaultProcess).toHaveBeenCalledTimes(1)
    expect(vaultProcess.mock.calls[0]?.[0]).toBe(tfile)
  })

  it('transitions back to idle and shows a stopped Notice', async () => {
    await startSuccessfully()
    vaultProcess.mockResolvedValue(undefined)
    await runCallback(STOP_ID)
    expect(latestStatusBar().text).toBe(STATUS_IDLE)
    expect(noticeCalls).toContain('Earshot: recording stopped')
  })

  it('a fresh start after stop creates a second note', async () => {
    await startSuccessfully()
    vaultProcess.mockResolvedValue(undefined)
    await runCallback(STOP_ID)
    vaultCreate.mockResolvedValue(makeTFile('Meetings/y.md'))
    await runCallback(START_ID)
    expect(vaultCreate).toHaveBeenCalledTimes(2)
    expect(latestStatusBar().text).toBe(STATUS_RECORDING)
  })
})

describe('stop command failures', () => {
  it('surfaces vault.process Error failures and still transitions to idle', async () => {
    await startSuccessfully()
    vaultProcess.mockRejectedValue(new Error('write conflict'))
    await runCallback(STOP_ID)
    expect(latestStatusBar().text).toBe(STATUS_IDLE)
    const fail = noticeCalls.find((msg) => msg.startsWith(FAIL_STOP_PREFIX))
    expect(fail).toBeDefined()
    expect(fail).toContain('write conflict')
  })

  it('surfaces non-Error rejection from vault.process as its String() form', async () => {
    await startSuccessfully()
    vaultProcess.mockRejectedValue(42)
    await runCallback(STOP_ID)
    const fail = noticeCalls.find((msg) => msg.startsWith(FAIL_STOP_PREFIX))
    expect(fail).toContain('42')
  })
})

describe('onunload', () => {
  it('completes without throwing when no recording is active', async () => {
    const plugin = makePlugin()
    await plugin.onload()
    expect(() => {
      plugin.onunload()
    }).not.toThrow()
  })

  it('completes without throwing while a recording is active', async () => {
    const plugin = await startSuccessfully()
    expect(() => {
      plugin.onunload()
    }).not.toThrow()
  })
})
