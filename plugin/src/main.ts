// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

import { Notice, Plugin } from 'obsidian'

import { MeetingNoteWriter } from './notes/MeetingNoteWriter.js'
import { DEFAULT_SETTINGS, EarshotSettingsSchema } from './types/settings.js'
import { createLogger } from './util/logger.js'

import type { EarshotSettings } from './types/settings.js'
import type { Logger } from './util/logger.js'
import type { TFile } from 'obsidian'

interface CurrentRecording {
  readonly file: TFile
  readonly startedAt: Date
}

const STATUS_TEXT = {
  idle: 'Earshot: idle',
  recording: 'Earshot: recording',
} as const

const COMMAND_IDS = {
  start: 'earshot-start-recording',
  stop: 'earshot-stop-recording',
} as const

const COMMAND_NAMES = {
  start: 'Earshot: Start recording',
  stop: 'Earshot: Stop recording',
} as const

// Obsidian loads plugins via a default export — this is a framework requirement.
// eslint-disable-next-line import-x/no-default-export
export default class EarshotPlugin extends Plugin {
  private settings: EarshotSettings = DEFAULT_SETTINGS

  private logger: Logger = createLogger({ level: 'info' })

  private writer: MeetingNoteWriter | null = null

  private statusBarEl: HTMLElement | null = null

  private currentRecording: CurrentRecording | null = null

  public override async onload(): Promise<void> {
    await this.loadSettings()
    this.logger = createLogger({ level: this.settings.logLevel })
    this.writer = new MeetingNoteWriter({ vault: this.app.vault, logger: this.logger })

    this.statusBarEl = this.addStatusBarItem()
    this.renderStatus('idle')

    this.addCommand({
      id: COMMAND_IDS.start,
      name: COMMAND_NAMES.start,
      callback: () => {
        void this.handleStart()
      },
    })

    this.addCommand({
      id: COMMAND_IDS.stop,
      name: COMMAND_NAMES.stop,
      callback: () => {
        void this.handleStop()
      },
    })

    this.logger.info('earshot plugin loaded', {
      meetingFolder: this.settings.meetingFolder,
      captureMode: this.settings.captureMode,
    })
    new Notice('Earshot ready')
  }

  public override onunload(): void {
    this.logger.info('earshot plugin unloaded', {
      recording: this.currentRecording !== null,
    })
  }

  private async loadSettings(): Promise<void> {
    const raw: unknown = await this.loadData()
    const result = EarshotSettingsSchema.safeParse(raw)
    if (result.success) {
      this.settings = result.data
      return
    }
    this.settings = DEFAULT_SETTINGS
    if (raw !== null && raw !== undefined) {
      // Persisted data exists but doesn't validate — log and fall back.
      this.logger.warn('settings failed schema validation; using defaults', {
        issues: result.error.issues.map((issue) => issue.path.join('.')),
      })
    }
  }

  private renderStatus(state: keyof typeof STATUS_TEXT): void {
    if (this.statusBarEl !== null) {
      this.statusBarEl.setText(STATUS_TEXT[state])
    }
  }

  private async handleStart(): Promise<void> {
    if (this.writer === null) {
      this.logger.error('start invoked before writer initialised')
      return
    }
    if (this.currentRecording !== null) {
      new Notice('Earshot: already recording')
      return
    }
    const startedAt = new Date()
    const title = formatMeetingTitle(startedAt)
    try {
      const file = await this.writer.createNote({
        title,
        meetingFolder: this.settings.meetingFolder,
        captureMode: this.settings.captureMode,
        startedAt,
      })
      this.currentRecording = { file, startedAt }
      this.renderStatus('recording')
      new Notice('Earshot: recording started')
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      new Notice(`Earshot: failed to start — ${reason}`)
    }
  }

  private async handleStop(): Promise<void> {
    if (this.writer === null || this.currentRecording === null) {
      new Notice('Earshot: not currently recording')
      return
    }
    const { file } = this.currentRecording
    try {
      await this.writer.markCompleted(file, { endedAt: new Date() })
      new Notice('Earshot: recording stopped')
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error)
      new Notice(`Earshot: failed to stop — ${reason}`)
    } finally {
      this.currentRecording = null
      this.renderStatus('idle')
    }
  }
}

function formatMeetingTitle(date: Date): string {
  const iso = date.toISOString()
  // Strip seconds + milliseconds for a stable, readable title (YYYY-MM-DDTHH-MM).
  const dt = iso.slice(0, 16).replace(':', '-')
  return `${dt} Meeting`
}
