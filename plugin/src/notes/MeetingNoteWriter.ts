// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

/**
 * MeetingNoteWriter — the injectable service that creates and updates meeting
 * notes through Obsidian's Vault API. The Vault dependency is narrowed to a
 * `Pick<Vault, 'create' | 'process' | 'getAbstractFileByPath'>` shape so the
 * three methods we actually use are the only contract the host must satisfy,
 * and unit tests build a `vi.fn()` fake without booting Obsidian. A `Logger`
 * is injected for the same reason — production code never reaches for
 * `console.*` directly (banned by ESLint `no-console`).
 *
 * Behavioural contract:
 *   - `createNote(opts)` builds a sanitised path under `meetingFolder`,
 *     renders an opinionated YAML frontmatter block + H1 heading, delegates
 *     to `Vault.create`, and returns the created `TFile`. Vault errors are
 *     wrapped with file-path context and re-thrown — never swallowed.
 *   - `markCompleted(file, opts)` uses `Vault.process` for an atomic
 *     read-modify-write that preserves every existing frontmatter key in
 *     its original order, sets `status: completed`, and inserts
 *     `ended: <ISO>` immediately after `started` if present (otherwise
 *     appended at the end). When the file lacks frontmatter entirely a
 *     minimal block is synthesised and prepended.
 *
 * Pure logic relative to the framework — no module-level side effects, no
 * globals, no `console.*`. Phase-1 walking skeleton (#6).
 */

import type { CaptureMode } from '../types/settings.js'
import type { Logger } from '../util/logger.js'
import type { TFile, Vault } from 'obsidian'

export interface CreateNoteOptions {
  readonly title: string
  readonly meetingFolder: string
  readonly captureMode: CaptureMode
  readonly startedAt: Date
}

export interface MarkCompletedOptions {
  readonly endedAt: Date
}

export interface MeetingNoteWriterDeps {
  readonly vault: Pick<Vault, 'create' | 'process' | 'getAbstractFileByPath'>
  readonly logger: Logger
}

const FRONTMATTER_BLOCK = /^---\n([\s\S]*?)\n---\n/
const PATH_ILLEGAL_CHARS = /[\\/:*?"<>|#^[\]]/g
const COLLAPSE_DASHES = /-+/g
const EDGE_TRIM_CHARS = new Set(['-', '.'])

export class MeetingNoteWriter {
  private readonly vault: MeetingNoteWriterDeps['vault']

  private readonly logger: Logger

  public constructor(deps: MeetingNoteWriterDeps) {
    this.vault = deps.vault
    this.logger = deps.logger
  }

  public async createNote(opts: CreateNoteOptions): Promise<TFile> {
    const path = buildPath(opts.meetingFolder, opts.title)
    const body = renderInitialBody(opts)
    try {
      const file = await this.vault.create(path, body)
      this.logger.info('meeting note created', { path })
      return file
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      this.logger.error('failed to create meeting note', { path, reason })
      throw new Error(`cannot create meeting note at ${path}: ${reason}`)
    }
  }

  public async markCompleted(file: TFile, opts: MarkCompletedOptions): Promise<void> {
    const iso = opts.endedAt.toISOString()
    try {
      await this.vault.process(file, (content: string) => updateFrontmatter(content, iso))
      this.logger.info('meeting note marked completed', { path: file.path })
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      this.logger.error('failed to mark meeting note completed', { path: file.path, reason })
      throw error instanceof Error ? error : new Error(reason)
    }
  }
}

function buildPath(meetingFolder: string, title: string): string {
  const sanitized = sanitizeTitle(title)
  if (sanitized === '') {
    throw new Error('cannot create meeting note: title sanitized to empty string')
  }
  const fileName = `${sanitized}.md`
  return meetingFolder === '' ? fileName : `${meetingFolder}/${fileName}`
}

function sanitizeTitle(title: string): string {
  const replaced = title.replace(PATH_ILLEGAL_CHARS, '-')
  const collapsed = replaced.replace(COLLAPSE_DASHES, '-')
  return trimEdges(collapsed)
}

function trimEdges(value: string): string {
  let start = 0
  let end = value.length
  while (start < end && EDGE_TRIM_CHARS.has(value.charAt(start))) {
    start += 1
  }
  while (end > start && EDGE_TRIM_CHARS.has(value.charAt(end - 1))) {
    end -= 1
  }
  return value.slice(start, end)
}

function renderInitialBody(opts: CreateNoteOptions): string {
  const iso = opts.startedAt.toISOString()
  return (
    `---\n` +
    `status: recording\n` +
    `started: ${iso}\n` +
    `capture_mode: ${opts.captureMode}\n` +
    `---\n` +
    `\n` +
    `# ${opts.title}\n` +
    `\n`
  )
}

function updateFrontmatter(content: string, endedIso: string): string {
  const match = FRONTMATTER_BLOCK.exec(content)
  if (match === null) {
    return `---\nstatus: completed\nended: ${endedIso}\n---\n\n${content}`
  }
  // match[1] is the single capture group — guaranteed string when the regex
  // matches, but `noUncheckedIndexedAccess` narrows it to string|undefined.
  // The `?? ''` is a type-safety fallback rather than a real code path.
  const block = match[1] ?? ''
  const rest = content.slice(match[0].length)
  const updatedBlock = rewriteBlock(block, endedIso)
  return `---\n${updatedBlock}\n---\n${rest}`
}

function rewriteBlock(block: string, endedIso: string): string {
  const lines = block.split('\n')
  const entries = lines.map(parseLine)
  const withStatus = applyStatus(entries)
  return insertEnded(withStatus, endedIso)
    .map((entry) => (entry.key === null ? entry.raw : `${entry.key}: ${entry.value}`))
    .join('\n')
}

interface BlockEntry {
  readonly key: string | null
  readonly value: string
  readonly raw: string
}

function parseLine(raw: string): BlockEntry {
  const colon = raw.indexOf(':')
  if (colon === -1) {
    return { key: null, value: '', raw }
  }
  const key = raw.slice(0, colon).trim()
  const value = raw.slice(colon + 1).trim()
  if (key === '') {
    return { key: null, value: '', raw }
  }
  return { key, value, raw }
}

function applyStatus(entries: readonly BlockEntry[]): BlockEntry[] {
  const completed: BlockEntry = {
    key: 'status',
    value: 'completed',
    raw: 'status: completed',
  }
  const hasStatus = entries.some((entry) => entry.key === 'status')
  if (!hasStatus) {
    return [...entries, completed]
  }
  return entries.map((entry) => (entry.key === 'status' ? completed : entry))
}

function insertEnded(entries: readonly BlockEntry[], endedIso: string): BlockEntry[] {
  const endedEntry: BlockEntry = { key: 'ended', value: endedIso, raw: `ended: ${endedIso}` }
  const filtered = entries.filter((entry) => entry.key !== 'ended')
  const startedIndex = filtered.findIndex((entry) => entry.key === 'started')
  if (startedIndex === -1) {
    return [...filtered, endedEntry]
  }
  const head = filtered.slice(0, startedIndex + 1)
  const tail = filtered.slice(startedIndex + 1)
  return [...head, endedEntry, ...tail]
}
