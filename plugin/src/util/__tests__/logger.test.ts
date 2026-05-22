// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

import { afterEach, describe, expect, it, vi } from 'vitest'

import { createLogger } from '../logger.js'

import type { Logger, LoggerOptions } from '../logger.js'

interface SinkSpy {
  debug: ReturnType<typeof vi.fn>
  info: ReturnType<typeof vi.fn>
  warn: ReturnType<typeof vi.fn>
  error: ReturnType<typeof vi.fn>
}

function makeSink(): SinkSpy {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}

function makeLogger(level: LoggerOptions['level'], sink: SinkSpy): Logger {
  return createLogger({ level, sink })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createLogger shape', () => {
  it('returns an object with debug/info/warn/error function methods', () => {
    const logger = createLogger({ level: 'debug', sink: makeSink() })
    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
  })
})

describe('level filtering', () => {
  it('level=debug passes all four levels through to the sink', () => {
    const sink = makeSink()
    const logger = makeLogger('debug', sink)
    logger.debug('a')
    logger.info('b')
    logger.warn('c')
    logger.error('d')
    expect(sink.debug).toHaveBeenCalledTimes(1)
    expect(sink.info).toHaveBeenCalledTimes(1)
    expect(sink.warn).toHaveBeenCalledTimes(1)
    expect(sink.error).toHaveBeenCalledTimes(1)
  })

  it('level=info drops debug, passes info/warn/error', () => {
    const sink = makeSink()
    const logger = makeLogger('info', sink)
    logger.debug('a')
    logger.info('b')
    logger.warn('c')
    logger.error('d')
    expect(sink.debug).not.toHaveBeenCalled()
    expect(sink.info).toHaveBeenCalledTimes(1)
    expect(sink.warn).toHaveBeenCalledTimes(1)
    expect(sink.error).toHaveBeenCalledTimes(1)
  })

  it('level=warn drops debug and info, passes warn/error', () => {
    const sink = makeSink()
    const logger = makeLogger('warn', sink)
    logger.debug('a')
    logger.info('b')
    logger.warn('c')
    logger.error('d')
    expect(sink.debug).not.toHaveBeenCalled()
    expect(sink.info).not.toHaveBeenCalled()
    expect(sink.warn).toHaveBeenCalledTimes(1)
    expect(sink.error).toHaveBeenCalledTimes(1)
  })

  it('level=error drops debug, info and warn; passes error', () => {
    const sink = makeSink()
    const logger = makeLogger('error', sink)
    logger.debug('a')
    logger.info('b')
    logger.warn('c')
    logger.error('d')
    expect(sink.debug).not.toHaveBeenCalled()
    expect(sink.info).not.toHaveBeenCalled()
    expect(sink.warn).not.toHaveBeenCalled()
    expect(sink.error).toHaveBeenCalledTimes(1)
  })
})

describe('message formatting', () => {
  it('formats a plain message with prefix and uppercased level', () => {
    const sink = makeSink()
    makeLogger('debug', sink).info('hello')
    expect(sink.info).toHaveBeenCalledWith('[earshot] [INFO] hello')
  })

  it('appends JSON context when context is a non-empty object', () => {
    const sink = makeSink()
    makeLogger('debug', sink).info('hello', { key: 1 })
    expect(sink.info).toHaveBeenCalledWith('[earshot] [INFO] hello {"key":1}')
  })

  it('formats warn and error with their correct level token', () => {
    const sink = makeSink()
    const logger = makeLogger('debug', sink)
    logger.warn('w', { xx: 'y' })
    logger.error('e', { code: 42 })
    expect(sink.warn).toHaveBeenCalledWith('[earshot] [WARN] w {"xx":"y"}')
    expect(sink.error).toHaveBeenCalledWith('[earshot] [ERROR] e {"code":42}')
  })

  it('formats debug with the correct level token', () => {
    const sink = makeSink()
    makeLogger('debug', sink).debug('d')
    expect(sink.debug).toHaveBeenCalledWith('[earshot] [DEBUG] d')
  })

  it('does NOT append context suffix when context is an empty object', () => {
    const sink = makeSink()
    makeLogger('debug', sink).info('hello', {})
    expect(sink.info).toHaveBeenCalledWith('[earshot] [INFO] hello')
  })

  it('does NOT append context suffix when context is undefined', () => {
    const sink = makeSink()
    makeLogger('debug', sink).info('hello', undefined)
    expect(sink.info).toHaveBeenCalledWith('[earshot] [INFO] hello')
  })
})

describe('robustness', () => {
  it('falls back to [unserializable context] on circular references and does not throw', () => {
    const sink = makeSink()
    const circular: Record<string, unknown> = { self: undefined }
    circular['self'] = circular
    const logger = makeLogger('debug', sink)
    expect(() => {
      logger.info('boom', circular)
    }).not.toThrow()
    expect(sink.info).toHaveBeenCalledWith('[earshot] [INFO] boom [unserializable context]')
  })
})

describe('default sink', () => {
  it('writes to globalThis.console when sink is omitted', () => {
    const spy = vi.spyOn(globalThis.console, 'info').mockImplementation(() => {
      // Swallow output during the assertion.
    })
    const logger = createLogger({ level: 'info' })
    logger.info('hi', { vv: 1 })
    expect(spy).toHaveBeenCalledWith('[earshot] [INFO] hi {"vv":1}')
  })
})
