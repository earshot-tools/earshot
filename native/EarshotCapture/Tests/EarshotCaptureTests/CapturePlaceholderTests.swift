// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

import EarshotCore
import Testing

@testable import EarshotCapture

@Test internal func captureScaffoldMatchesCoreVersion() {
  #expect(EarshotCapture.scaffoldedAt == EarshotCoreConstants.version)
}
