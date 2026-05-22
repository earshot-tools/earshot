// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

import Testing

@testable import EarshotCore

@Test internal func versionIsNonEmpty() {
  #expect(!EarshotCoreConstants.version.isEmpty)
}

@Test internal func versionMatchesSemverPattern() {
  let pattern = #/^\d+\.\d+\.\d+$/#
  #expect(EarshotCoreConstants.version.wholeMatch(of: pattern) != nil)
}
