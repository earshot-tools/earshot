// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

import EarshotCore

/// Marker namespace for the audio pipeline.
///
/// Concrete `AudioFrame`, `AudioRingBuffer`, resampler, mixer types arrive in
/// later phases (see PLAN.md §"Phase 4 — Native helper skeleton").
public enum EarshotAudio {
  /// Scaffold marker tying the audio module to the core version.
  public static let scaffoldedAt = EarshotCoreConstants.version
}
