// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

import EarshotAudio
import EarshotCore

/// Marker namespace for ScreenCaptureKit + AVAudioEngine capture engines.
///
/// Concrete engines (`ScreenCaptureKitEngine`, `MicrophoneEngine`) arrive in
/// Phase 5/6. See PLAN.md.
public enum EarshotCapture {
  /// Scaffold marker tying the capture module to the core version.
  public static let scaffoldedAt = EarshotCoreConstants.version
}
