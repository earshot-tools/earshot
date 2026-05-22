# Changelog

## [1.2.0](https://github.com/earshot-tools/earshot/compare/v1.1.0...v1.2.0) (2026-05-22)


### Features

* **plugin:** wire main.ts plugin lifecycle + start/stop commands ([#11](https://github.com/earshot-tools/earshot/issues/11)) ([ff44ebb](https://github.com/earshot-tools/earshot/commit/ff44ebb8e36623fb6e3d5c63fe9ed4b8cfce32d5)), closes [#4](https://github.com/earshot-tools/earshot/issues/4)


### Bug Fixes

* **devops:** close devops-branch loophole + require owner approval everywhere ([#9](https://github.com/earshot-tools/earshot/issues/9)) ([cb9bda8](https://github.com/earshot-tools/earshot/commit/cb9bda8c1e5dec9bdfedfa4f36e9f58b5adc4f3a))

## [1.1.0](https://github.com/earshot-tools/earshot/compare/v1.0.0...v1.1.0) (2026-05-22)


### Features

* **devops:** add 5 missing asal-world quality gates ([3e8a41b](https://github.com/earshot-tools/earshot/commit/3e8a41bb92dffd87b51b699a014f9f0f22f279e8))
* **devops:** add bats-core gate tests + skill content-preservation ([41c32d9](https://github.com/earshot-tools/earshot/commit/41c32d953a2bda47068b660e432beaeaf2e56bf6))
* **devops:** close 4 asal-world ferrari gate lowerings ([63f0c16](https://github.com/earshot-tools/earshot/commit/63f0c1678ea7eed6e854d1db50a570069b97097d))
* **devops:** close 6 remaining lefthook-vs-ci-local gates + adr ([1248f2f](https://github.com/earshot-tools/earshot/commit/1248f2f73474b05080941a3029426f876e0d7479))
* **devops:** close all 5 residual asal-world ferrari gate gaps ([c79adfe](https://github.com/earshot-tools/earshot/commit/c79adfe07f4fb4120bf21b74316abe82ef2e99cb))
* **devops:** wire stryker ci + bin/setup + brewfile ([082179d](https://github.com/earshot-tools/earshot/commit/082179d4f4cbca05db4fa7a05987ec7b14a1f339))


### Bug Fixes

* **ci:** check out pr head sha so head~1 matches local semantics ([ee51ea5](https://github.com/earshot-tools/earshot/commit/ee51ea5937571cbc51f934ebbe787db2667fe42a))
* **devops:** inline-suppressions reviewer findings (scope + trailer + reset) ([ed51cfd](https://github.com/earshot-tools/earshot/commit/ed51cfdf0999cd6747bbddf75ddd3f7d431a7ee7))

## 1.0.0 (2026-05-22)


### Bug Fixes

* **devops:** replace gitleaks-action with free cli invocation ([194e6c0](https://github.com/earshot-tools/earshot/commit/194e6c06e0ea1e3327b6a668fc947a5675c4caef))
* **devops:** scope ci shellcheck to tools/ only ([f18ac07](https://github.com/earshot-tools/earshot/commit/f18ac07f2907f23871c54b9054a3e93ab7f95493))
