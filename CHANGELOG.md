# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.0.8](https://github.com/cadriel/fluidd/compare/v0.0.7...v0.0.8) (2020-10-26)


### Features

* allow toggle for temp chart ([121e36c](https://github.com/cadriel/fluidd/commit/121e36c8a64c98ed3f6900c807c204b445ae2973))
* animate chart show / hide transition ([5dee489](https://github.com/cadriel/fluidd/commit/5dee4896d393cf88625bba3cad0fd6ccdf1ecf17))
* display printer progress and instance in doc title ([18e89a2](https://github.com/cadriel/fluidd/commit/18e89a2cf1b0ae7e815d0f40183bacaec984d7a0))
* moonraker power plugin support ([be67ba0](https://github.com/cadriel/fluidd/commit/be67ba013e70ef05add40447f09e2c8a0c3cd078))
* timestamps in console ([20793b1](https://github.com/cadriel/fluidd/commit/20793b12cde060c032ff67c1a745563ff0e10733))


### Bug Fixes

* broken image for thumbs if they don't exist ([94602e5](https://github.com/cadriel/fluidd/commit/94602e59c75886585646442cd9bafb67227a5692))
* console now fills space after host reboot ([c0a43f7](https://github.com/cadriel/fluidd/commit/c0a43f712315b97908a9a872d8b359208c0b4d28))
* previous print thumb shouldn't on next print if there's no thumb ([eeeb7d6](https://github.com/cadriel/fluidd/commit/eeeb7d6124c676618e1628e2670bac7526591a55))
* updates to reflect moonraker changes to file modified ([d71712f](https://github.com/cadriel/fluidd/commit/d71712f4103f2e79ff76d4cbbbc2d940b9732525))
* z_tilt_adjust ([0a020b1](https://github.com/cadriel/fluidd/commit/0a020b16dba0dce5379db53ebcfd372deda9b2b3))

### [0.0.7](https://github.com/cadriel/fluidd/compare/v0.0.6...v0.0.7) (2020-10-20)


### Bug Fixes

* console now properly maintains history ([2334c3f](https://github.com/cadriel/fluidd/commit/2334c3f16c4bed98e01125bb9b4c5dece98c827a))
* extrude / retract now work if min extrude temp not defined ([cbc52e2](https://github.com/cadriel/fluidd/commit/cbc52e2f8598b65092ed7ed56f7281392b09a193))
* generic heaters now work ([99fa1e6](https://github.com/cadriel/fluidd/commit/99fa1e65c0a9ee9f71c66a2d699cff96b6ad7235))
* printing within a folder ([aea8257](https://github.com/cadriel/fluidd/commit/aea8257b5b8e80f3571a04295923cbd842616663))
* sorted endstops ([dc489f5](https://github.com/cadriel/fluidd/commit/dc489f52f0816501c2b61bba0e6417b5feb2b4a2))

### [0.0.6](https://github.com/cadriel/fluidd/compare/v0.0.5...v0.0.6) (2020-10-15)


### Features

* Add console history on load ([55403da](https://github.com/cadriel/fluidd/commit/55403da8eb98dd642180a1523216f3f9f14f037d))
* add machine limits card (currently disabled..) ([b03fe61](https://github.com/cadriel/fluidd/commit/b03fe6119a932fa1625fd0079cbe9ccd4d860d6b))
* add version information to footer ([ba77c0d](https://github.com/cadriel/fluidd/commit/ba77c0dde23293c5eeae5c35810d9b3fa06c6615))
* config editing available when klipper in error ([887b5f4](https://github.com/cadriel/fluidd/commit/887b5f401a03397c0dc1d4fc7d21a8ebb1167c9f))
* git hash in footer, footer no longer fixed ([a7eea18](https://github.com/cadriel/fluidd/commit/a7eea18fbf376ce5d29106bed6f81d3ef737b004))
* mobile and tablet layouts ([f79f945](https://github.com/cadriel/fluidd/commit/f79f94549808f4d4ad7d805cfcd4b266782ddd7a))


### Bug Fixes

* adds confirm dialogs to shutdown and reboot host buttons ([f7147c6](https://github.com/cadriel/fluidd/commit/f7147c69cb5f1ec4aa027078658a6976513c8295))
* host reboot and shutdown now work ([07bc5d5](https://github.com/cadriel/fluidd/commit/07bc5d52035aa98219971cfde127a805d0b85feb))
* macros no longer disabled during print ([8b70ac4](https://github.com/cadriel/fluidd/commit/8b70ac42d206fcd4a0042536b80b802c34f20c1a))

### [0.0.5](https://github.com/cadriel/fluidd/compare/v0.0.4...v0.0.5) (2020-10-10)


### Bug Fixes

* missing / incorrect icon definitions ([0f51496](https://github.com/cadriel/fluidd/commit/0f5149698cd7025cbdca833ca2626899c121d9b3))

### [0.0.4](https://github.com/cadriel/fluidd/compare/v0.0.3...v0.0.4) (2020-10-09)


### Features

* added confirm dialog to cancel print button ([3a70c88](https://github.com/cadriel/fluidd/commit/3a70c88a79ed85c08ab1059d14ff82d3dcc843df))
* configuration file editing ([03106d8](https://github.com/cadriel/fluidd/commit/03106d8910d1d4d9019b8664ba0596d610edf073))
* console command history ([b4c8d1d](https://github.com/cadriel/fluidd/commit/b4c8d1da9513dba04e0d62ff8d4b65bb386b0fe4))
* style updates to prep for light theme ([ef1cacd](https://github.com/cadriel/fluidd/commit/ef1cacdeee92d0c83aa347703e248253f928dc8f))
* theme switching between light and dark ([f66637d](https://github.com/cadriel/fluidd/commit/f66637d95d3705db4e9739db3d3a18f4a96fb934))


### Bug Fixes

* temp sensors and probes now display ([8776fbc](https://github.com/cadriel/fluidd/commit/8776fbcb533d32fd6624fe037876e9d98a574f0b))

### [0.0.3](https://github.com/cadriel/fluidd/compare/v0.0.2...v0.0.3) (2020-10-05)


### Bug Fixes

* config now correctly applies when no valid env or config.json given ([ba8ae43](https://github.com/cadriel/fluidd/commit/ba8ae43ed1a20524fafaccb4bba00da62bb391d4))
* macro's with spaces now show in the UI correctly ([d13bb0c](https://github.com/cadriel/fluidd/commit/d13bb0cac9389efb26c7223d7d3cd7a0277d5597))

### [0.0.2](https://github.com/cadriel/fluidd/compare/v0.0.1...v0.0.2) (2020-10-04)


### Features

* bed mesh, runout sensors & end stops ([d533b99](https://github.com/cadriel/fluidd/commit/d533b99ef8eccc4744c9749376171b638bce4a20))


### Bug Fixes

* allow force refresh on socket disconnection ([4c6e316](https://github.com/cadriel/fluidd/commit/4c6e316c01991c57f13d641dd73827b453042ff9))
* cancel button during pause ([6647b25](https://github.com/cadriel/fluidd/commit/6647b250197c39265ee64c55cc5b1ed83693bca1))
* default time estimation now klipper / file based ([6f1503a](https://github.com/cadriel/fluidd/commit/6f1503a144ecb19b95236fce077b7a4ec3654057))
* time estimations no longer return nan ([d5dea3c](https://github.com/cadriel/fluidd/commit/d5dea3c9efc98e9e6560cc3f2b59d7fc48a5c7f0))

### 0.0.1 (2020-09-30)


### Features

* added new time estimations + config ([7b05b82](https://github.com/cadriel/fluidd/commit/7b05b82afeb14b9f665261da6c373ba0dabe8c14))
* Adds flash message for save and errors ([874d6e7](https://github.com/cadriel/fluidd/commit/874d6e7a4baf346b93b58784f5183f57bf190b3c))
* adds standard-version for release management ([f842c16](https://github.com/cadriel/fluidd/commit/f842c1603b2277bd896eab1a892462dde1c20b37))
* initial impl of fluidd ([e34965e](https://github.com/cadriel/fluidd/commit/e34965ec1672d160978cf45c735b5f1884f7110c))
* initial vue typescript app init ([a3b933a](https://github.com/cadriel/fluidd/commit/a3b933a7ea10791e2b6a2d3f5f632e9170244368))
* loads env for local development, and config.json elsewhere. ([456c5a6](https://github.com/cadriel/fluidd/commit/456c5a63baf3998b5df04da53fdc9c5197c9289f))


### Bug Fixes

* clear out the last type warnings ([f2ef688](https://github.com/cadriel/fluidd/commit/f2ef688bcf8a10cd5a6eb8b9f14ab95ef01a554a))
* ensure config fetches are not cached ([928695b](https://github.com/cadriel/fluidd/commit/928695b0141d7bfcfec42c27ce8964e76be2b268))
* toolhead / extruder moves now work properly ([816eb35](https://github.com/cadriel/fluidd/commit/816eb3509bcd880799dbb731eabf6988c84aa757))
