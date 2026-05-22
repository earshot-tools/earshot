import { beforeEach, describe, expect, it, vi } from 'vitest'

const noticeCalls: string[] = []

vi.mock('obsidian', () => ({
  Plugin: class {},
  Notice: class {
    public constructor(message: string) {
      noticeCalls.push(message)
    }
  },
}))

const { default: EarshotPlugin } = await import('../main.js')
const { default: IndexDefault } = await import('../index.js')

beforeEach(() => {
  noticeCalls.length = 0
  vi.restoreAllMocks()
})

describe('EarshotPlugin shape', () => {
  it('is a class (function) constructor', () => {
    expect(typeof EarshotPlugin).toBe('function')
  })

  it('has the expected class name', () => {
    expect(EarshotPlugin.name).toBe('EarshotPlugin')
  })

  it('re-exports the same default class from index.ts', () => {
    expect(IndexDefault).toBe(EarshotPlugin)
  })
})

describe('EarshotPlugin.onload', () => {
  it('shows a Notice and logs with NODE_ENV set', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const previous = process.env.NODE_ENV
    process.env.NODE_ENV = 'test'
    try {
      await makePlugin().onload()
    } finally {
      restoreNodeEnv(previous)
    }
    expect(noticeCalls).toHaveLength(1)
    expect(noticeCalls[0]).toMatch(/Earshot plugin loaded/)
    expect(infoSpy).toHaveBeenCalledWith('[Earshot] onload', 'test')
  })

  it('falls back to "unknown" when NODE_ENV is undefined', async () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const previous = process.env.NODE_ENV
    delete process.env.NODE_ENV
    try {
      await makePlugin().onload()
    } finally {
      restoreNodeEnv(previous)
    }
    expect(infoSpy).toHaveBeenCalledWith('[Earshot] onload', 'unknown')
  })
})

describe('EarshotPlugin.onunload', () => {
  it('logs on onunload()', () => {
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    makePlugin().onunload()
    expect(infoSpy).toHaveBeenCalledWith('[Earshot] onunload')
  })
})

function makePlugin(): InstanceType<typeof EarshotPlugin> {
  // The 'obsidian' module is mocked to a no-arg Plugin shim, but the public
  // type signature requires (app, manifest). Cast through a typed helper so we
  // can call the test-time constructor without leaking `any` into the suite.
  const Ctor = EarshotPlugin as unknown as new () => InstanceType<typeof EarshotPlugin>
  return new Ctor()
}

function restoreNodeEnv(previous: string | undefined): void {
  if (previous === undefined) {
    delete process.env.NODE_ENV
  } else {
    process.env.NODE_ENV = previous
  }
}
