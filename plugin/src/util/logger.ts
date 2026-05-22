// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

/**
 * Minimal Logger module used by every Phase 1 module so production code never
 * reaches for `console.*` directly (banned by ESLint `no-console` and
 * `scripts/codebase-check.sh` S3). API is intentionally tiny: `createLogger`
 * returns an object with `debug/info/warn/error` that each accept a message
 * and an optional structured context. Output is filtered by level and routed
 * to an injectable sink (defaults to `globalThis.console`).
 *
 * Message format: `[earshot] [LEVEL] <message>` with `JSON.stringify(context)`
 * appended only when `context` is a non-empty object. Unserializable context
 * (e.g. circular refs) degrades to `[unserializable context]` rather than
 * throwing — logging must NEVER raise.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void
  info(message: string, context?: Record<string, unknown>): void
  warn(message: string, context?: Record<string, unknown>): void
  error(message: string, context?: Record<string, unknown>): void
}

export interface LoggerOptions {
  level: LogLevel
  /**
   * Test seam — defaults to `globalThis.console`. Production code routes
   * through this sink rather than touching `console.*` directly so tests can
   * inject a `vi.fn()` spy without monkey-patching globals.
   */
  sink?: Pick<Console, 'debug' | 'info' | 'warn' | 'error'>
}

type Sink = Pick<Console, 'debug' | 'info' | 'warn' | 'error'>

interface EmitArgs {
  readonly level: LogLevel
  readonly message: string
  readonly context: Record<string, unknown> | undefined
}

const LEVEL_PRIORITY: Readonly<Record<LogLevel, number>> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const PREFIX = '[earshot]'
const UNSERIALIZABLE = '[unserializable context]'

// DEFAULT_SINK is the ONE allowed reference to the global console anywhere in
// production code. Every Logger call routes through the (possibly injected)
// sink; nothing else here mentions `console`. Using the `globalThis.console`
// member expression avoids the bare-identifier shape `no-console` flags.
const DEFAULT_SINK: Sink = globalThis.console

export function createLogger(options: LoggerOptions): Logger {
  const sink: Sink = options.sink ?? DEFAULT_SINK
  const threshold = LEVEL_PRIORITY[options.level]

  return {
    debug: (message, context) => {
      emit(sink, threshold, { level: 'debug', message, context })
    },
    info: (message, context) => {
      emit(sink, threshold, { level: 'info', message, context })
    },
    warn: (message, context) => {
      emit(sink, threshold, { level: 'warn', message, context })
    },
    error: (message, context) => {
      emit(sink, threshold, { level: 'error', message, context })
    },
  }
}

function emit(sink: Sink, threshold: number, args: EmitArgs): void {
  if (LEVEL_PRIORITY[args.level] < threshold) {
    return
  }
  const formatted = format(args)
  try {
    sink[args.level](formatted)
  } catch {
    // The no-throw contract requires us to swallow sink failures rather than propagate them; logging is a no-op when its own output channel is broken.
  }
}

function format(args: EmitArgs): string {
  const head = `${PREFIX} [${args.level.toUpperCase()}] ${args.message}`
  const suffix = renderContext(args.context)
  return suffix === '' ? head : `${head} ${suffix}`
}

function renderContext(context: Record<string, unknown> | undefined): string {
  if (context === undefined) {
    return ''
  }
  if (Object.keys(context).length === 0) {
    return ''
  }
  try {
    return JSON.stringify(context)
  } catch {
    return UNSERIALIZABLE
  }
}
