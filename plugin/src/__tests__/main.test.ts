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
  it('shows a Notice on onload()', async () => {
    await makePlugin().onload()
    expect(noticeCalls).toHaveLength(1)
    expect(noticeCalls[0]).toMatch(/Earshot plugin loaded/)
  })
})

describe('EarshotPlugin.onunload', () => {
  it('completes without throwing', () => {
    expect(() => makePlugin().onunload()).not.toThrow()
  })
})

function makePlugin(): InstanceType<typeof EarshotPlugin> {
  // The 'obsidian' module is mocked to a no-arg Plugin shim, but the public
  // type signature requires (app, manifest). Cast through a typed helper so we
  // can call the test-time constructor without leaking `any` into the suite.
  const Ctor = EarshotPlugin as unknown as new () => InstanceType<typeof EarshotPlugin>
  return new Ctor()
}
