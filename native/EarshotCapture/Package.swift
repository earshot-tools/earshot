// swift-tools-version: 6.0
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Inoyatov Khamidulla and contributors.

import PackageDescription

private let ferrariSwiftSettings: [SwiftSetting] = [
  .swiftLanguageMode(.v6),
  .enableUpcomingFeature("ExistentialAny"),
  .enableUpcomingFeature("InternalImportsByDefault")
]

internal let package = Package(
  name: "EarshotCapture",
  platforms: [.macOS(.v14)],
  products: [
    .executable(name: "EarshotCLI", targets: ["EarshotCLI"]),
    .library(name: "EarshotCapture", targets: ["EarshotCapture"]),
    .library(name: "EarshotAudio", targets: ["EarshotAudio"]),
    .library(name: "EarshotCore", targets: ["EarshotCore"])
  ],
  targets: [
    .target(name: "EarshotCore", swiftSettings: ferrariSwiftSettings),
    .target(
      name: "EarshotAudio",
      dependencies: ["EarshotCore"],
      swiftSettings: ferrariSwiftSettings
    ),
    .target(
      name: "EarshotCapture",
      dependencies: ["EarshotCore", "EarshotAudio"],
      swiftSettings: ferrariSwiftSettings
    ),
    .executableTarget(
      name: "EarshotCLI",
      dependencies: ["EarshotCore", "EarshotAudio", "EarshotCapture"],
      swiftSettings: ferrariSwiftSettings
    ),
    .testTarget(
      name: "EarshotCoreTests",
      dependencies: ["EarshotCore"],
      swiftSettings: ferrariSwiftSettings
    ),
    .testTarget(
      name: "EarshotAudioTests",
      dependencies: ["EarshotAudio"],
      swiftSettings: ferrariSwiftSettings
    ),
    .testTarget(
      name: "EarshotCaptureTests",
      dependencies: ["EarshotCapture"],
      swiftSettings: ferrariSwiftSettings
    )
  ]
)
