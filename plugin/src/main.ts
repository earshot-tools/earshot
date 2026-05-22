// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

import { Notice, Plugin } from 'obsidian'

// Obsidian loads plugins via a default export — this is a framework requirement.
// eslint-disable-next-line import-x/no-default-export
export default class EarshotPlugin extends Plugin {
  public override async onload(): Promise<void> {
    new Notice('Earshot plugin loaded (skeleton — feature work pending)')
    return Promise.resolve()
  }

  public override onunload(): void {
    // No-op; real teardown lands with capture/STT in Phase 1.
  }
}
