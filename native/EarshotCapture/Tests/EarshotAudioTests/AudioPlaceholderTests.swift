// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

import EarshotCore
import Testing

@testable import EarshotAudio

@Test internal func audioScaffoldMatchesCoreVersion() {
  #expect(EarshotAudio.scaffoldedAt == EarshotCoreConstants.version)
}
