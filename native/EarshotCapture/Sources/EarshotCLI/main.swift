// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

import EarshotCapture
import EarshotCore
import Foundation

// Skeleton: print version + exit. CLI parsing arrives in P4 (PLAN.md).
private let version = EarshotCoreConstants.version
private let scaffoldAt = EarshotCapture.scaffoldedAt
print("EarshotCapture helper v\(version) (scaffold marker: \(scaffoldAt))")
