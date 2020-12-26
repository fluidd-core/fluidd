# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.3.1](https://github.com/cadriel/fluidd/compare/v1.3.0...v1.3.1) (2020-12-26)


### Bug Fixes

* buttons states now update properly ([36854c4](https://github.com/cadriel/fluidd/commit/36854c4242800d0248e93dafb09725a65366c636))
* position now reflects gcode position, not toolhead position ([e76bc41](https://github.com/cadriel/fluidd/commit/e76bc41e618c8ebfdac25faf057dbdc1fbe69c3a))
* revert position back to toolhead position ([b2b83e9](https://github.com/cadriel/fluidd/commit/b2b83e97be21d9a4ccab20d32ee4cb5ba7503582))

## [1.3.0](https://github.com/cadriel/fluidd/compare/v1.2.2...v1.3.0) (2020-12-26)


### Features

* draggable dashboard cards ([5286e8e](https://github.com/cadriel/fluidd/commit/5286e8edf4c086cfc95f4b1a2783be33170280df))


### Bug Fixes

* unable to edit new files. ([25aa5b9](https://github.com/cadriel/fluidd/commit/25aa5b94e5648cc8c9f9bc89f2eb41ac41960d32))

### [1.2.2](https://github.com/cadriel/fluidd/compare/v1.2.1...v1.2.2) (2020-12-20)


### Bug Fixes

* refresh on client update ([694d472](https://github.com/cadriel/fluidd/commit/694d4727baae3ef8a52b72665062e79b9efd1500))
* you should not update or restart services during a print ([e250478](https://github.com/cadriel/fluidd/commit/e250478aa5e9249b0b6e0420c50a207cf8a7446a))

### [1.2.1](https://github.com/cadriel/fluidd/compare/v1.2.0...v1.2.1) (2020-12-20)


### Bug Fixes

* version states & add tooltip for brevity ([52a2256](https://github.com/cadriel/fluidd/commit/52a2256b86ed638d5cfcb73bbe876a1bb52adc2b))

## [1.2.0](https://github.com/cadriel/fluidd/compare/v1.1.0...v1.2.0) (2020-12-20)


### Features

* add download log buttons to configuration page ([939e9a8](https://github.com/cadriel/fluidd/commit/939e9a86a5069d48cac535e37172c2aae89ae257))
* allow creation of new files ([2adc1d0](https://github.com/cadriel/fluidd/commit/2adc1d08ac77713e195b7a9c55233f5badfb3b7b))
* console entry maintains state ([a913ee6](https://github.com/cadriel/fluidd/commit/a913ee6f3ebddd8fb64c1ce6544b981045f04c87))
* logo & printer name now link to dashboard ([793ad14](https://github.com/cadriel/fluidd/commit/793ad146196e3c2ae22ec24fdd1601b55a7d475f))
* self updates ([c9c5d63](https://github.com/cadriel/fluidd/commit/c9c5d63889a1c142430c5d51e2bc58bb469fa926))


### Bug Fixes

* ctrl-z working properly in code editor ([4ac441b](https://github.com/cadriel/fluidd/commit/4ac441b7540f70fa8ec419f50c8a57d80d87d35a))
* downloads now work irrelevant of connected printer port ([aadb6f5](https://github.com/cadriel/fluidd/commit/aadb6f580dfe28428d6ea0524d137cec1989012f))
* ensure users can't access the jobs page on klippy disconnect ([b95e177](https://github.com/cadriel/fluidd/commit/b95e17745b1c414a5db42a293115569ab89da4d2))
* fix macros not updating when selecting printers ([0cd4043](https://github.com/cadriel/fluidd/commit/0cd4043a5ac2847fd73d3ba2cc54b02fb2f55365))
* input sliders now accept clicks properly ([552eff4](https://github.com/cadriel/fluidd/commit/552eff469b11fac2008d1c6322017c7a896b7748))
* issue when closing file editor with escape ([e79feaf](https://github.com/cadriel/fluidd/commit/e79feaf757ded163f41ec3417ec0ded7ee9a352e))
* prevent null values being saved to temp presets ([2d4951d](https://github.com/cadriel/fluidd/commit/2d4951d3809ffd8341777e9491db86b138962a13))
* system versions not reliant on klippy being connected ([a510bfb](https://github.com/cadriel/fluidd/commit/a510bfb8feafa052f055da0e7c93f271b73a1656))

## [1.1.0](https://github.com/cadriel/fluidd/compare/v1.0.0...v1.1.0) (2020-12-02)


### Features

* drag and drop file uploads ([28328fd](https://github.com/cadriel/fluidd/commit/28328fdfb9f06e2ab487d7b6a8033d2adc89791d))
* enable print fan adjustment while printing ([bcf6f71](https://github.com/cadriel/fluidd/commit/bcf6f71e9d2f716859d139f965107d76de8deb0c))
* show controller / hot end fan status ([e47faa9](https://github.com/cadriel/fluidd/commit/e47faa9621ebe2711116a0453b1e42a15926d1d5))
* temperature presets ([bb72525](https://github.com/cadriel/fluidd/commit/bb725251e484b522d094f0b81a04773682257e6c))
* upload & print button ([7ae24f8](https://github.com/cadriel/fluidd/commit/7ae24f8aa515a83e0a6dbbba6a908efdc0d1774f))


### Bug Fixes

* error loading files when connected directly to moonraker port ([11e18e6](https://github.com/cadriel/fluidd/commit/11e18e6646bde0553fcf7a8d4ba0382afa405a67))
* extruder warning now a snowflake ([bd59285](https://github.com/cadriel/fluidd/commit/bd592857e5ecd4ad35a8a321863ed1f40a84aa27))
* files other than .gcode were not updating file list ([d1230ca](https://github.com/cadriel/fluidd/commit/d1230cab4eff4ca754b97a9c9db18cc334651345))
* hamburger not showing all menu items at sm breakpoint ([b247e7d](https://github.com/cadriel/fluidd/commit/b247e7da8a7ad13951e30f1862c5da8f74934357))
* re-enable title in mobile format with ellipses ([c046398](https://github.com/cadriel/fluidd/commit/c0463982fb8e541fdf28eb36591d3c3c7ef26644))
* webcam eagerly renders, avoiding data consumption when collapsed ([e1fa534](https://github.com/cadriel/fluidd/commit/e1fa534b45406017af8cf97e7e5a1f8b276246f9))

## [1.0.0](https://github.com/cadriel/fluidd/compare/v1.0.0-rc.2...v1.0.0) (2020-11-22)

## [1.0.0-rc.2](https://github.com/cadriel/fluidd/compare/v1.0.0-rc.1...v1.0.0-rc.2) (2020-11-20)


### Bug Fixes

* error deleting single file when only one exists in jobs ([ddde730](https://github.com/cadriel/fluidd/commit/ddde7305b82fa91bfb66ba8c2407fd443463c544))
* reset and reprint buttons not showing up ([1e461fd](https://github.com/cadriel/fluidd/commit/1e461fd490db99ec99295c6f7b2d58f6f74138a7))

## [1.0.0-rc.1](https://github.com/cadriel/fluidd/compare/v1.0.0-rc.0...v1.0.0-rc.1) (2020-11-18)


### Bug Fixes

* Issue where all instances were disabled ([9da4a3d](https://github.com/cadriel/fluidd/commit/9da4a3d56c207d32ff8ffce962b80eb603433a34))

## [1.0.0-rc.0](https://github.com/cadriel/fluidd/compare/v0.1.0...v1.0.0-rc.0) (2020-11-16)


### Features

* allow inverting axis ([cf6a993](https://github.com/cadriel/fluidd/commit/cf6a993b3655d349d724bdb150211ba2d4813409))
* multi-printer management ([319e3bb](https://github.com/cadriel/fluidd/commit/319e3bbe60ff25ab1dc27ed8bcf93e239c2daddb))
* support for bed_screws_adjust and screws_tilt_calculate ([6e09088](https://github.com/cadriel/fluidd/commit/6e0908826c97bf59892ff476a23ed5d4a7ade132))
* support ip camera streams ([a055bce](https://github.com/cadriel/fluidd/commit/a055bce8439004ba5a2afb2582aac91c096b716d))


### Bug Fixes

* [virtual_sd_card] -> [virtual_sdcard] ([27395bb](https://github.com/cadriel/fluidd/commit/27395bb90c552bdd5bba00719eb38b44ac4c975e))
* ensures tool tabs present properly if only one tab is available ([fcbe166](https://github.com/cadriel/fluidd/commit/fcbe166686934f12ca1d7b5ce73381a38eebecf3))
* error toasts now use the default timeout ([58385c5](https://github.com/cadriel/fluidd/commit/58385c5049515b396870b747fc53ec2ebb5c446e))
* progress uses display_status to represent M73 if configured ([b0c575c](https://github.com/cadriel/fluidd/commit/b0c575c08d71ac199404ed62e88cf05279015460))

## [0.1.0](https://github.com/cadriel/fluidd/compare/v0.0.10...v0.1.0) (2020-11-06)


### Features

* add loader to file uploads ([0bc62f4](https://github.com/cadriel/fluidd/commit/0bc62f446a62696b95b18633a7fe1f19cd077172))
* add save and close to file editor ([24bc44b](https://github.com/cadriel/fluidd/commit/24bc44b726fae0baa6d77e26b1ec994ad1fef852))
* adds settings to control jobs card and menu item ([8290ac8](https://github.com/cadriel/fluidd/commit/8290ac818470bdd2d72fa1f443928a071d2c3aa4))
* allow .ufp uploads into jobs ([7691f07](https://github.com/cadriel/fluidd/commit/7691f07d7f29de3c81a80972fb68c3ff61e8b2d3))
* file menu shows larger thumb ([156f84b](https://github.com/cadriel/fluidd/commit/156f84b681a7225f9c5044dc039117bea848a4ca))
* filter thumbs folder ([1857dee](https://github.com/cadriel/fluidd/commit/1857dee2125faef27147311aae329d09f6560d3f))
* load meta data ([c59c0a8](https://github.com/cadriel/fluidd/commit/c59c0a871d8c4faefd3161c3d4fd87b27aa41cfe))
* print pushes user to dashboard if not already ([61a4f9b](https://github.com/cadriel/fluidd/commit/61a4f9b6b65d566b6f6e4b82bda0ca105b411fa1))
* sensors now show up in graph ([4813d0b](https://github.com/cadriel/fluidd/commit/4813d0b6ad1e9c07745d5349b37149b86bc42ad5))
* support power notifications ([2e27a99](https://github.com/cadriel/fluidd/commit/2e27a99bb4d4cf464b86e52f869a93178e82e380))


### Bug Fixes

* catch a greater subset of errors to throw to the user ([eed7c71](https://github.com/cadriel/fluidd/commit/eed7c7171bde452ca3eb2951a617c9ef2365b7d0))
* change file upload icon in file browser ([bade073](https://github.com/cadriel/fluidd/commit/bade0738ab2c576cf70303b99356c449a58cf06a))
* editing files now works in safari / ios properly ([49b33e7](https://github.com/cadriel/fluidd/commit/49b33e716c0c0f35517e8916fdce0e8b4ce788ed))
* ensure current_print is updated properly ([6282753](https://github.com/cadriel/fluidd/commit/62827537cea93a0ec9565098019edeca3ffa7392))
* incorrect console timestamps ([d3fcbaf](https://github.com/cadriel/fluidd/commit/d3fcbafa0b786367419f067a4b5b1e325fbffe80))
* load plugins on socket connection ([bd7c064](https://github.com/cadriel/fluidd/commit/bd7c0649c94a5f7556502b8c8984972cd9d7cb0e))
* send MOVE=1 for z-adjust during prints ([eee510b](https://github.com/cadriel/fluidd/commit/eee510b04e313bcdb7c1b2ad7876c472dc2fde6f))
* socket client was not clearing old requests ([075377b](https://github.com/cadriel/fluidd/commit/075377bf9c7eb973dc87a840c68e9276fe201453))
* tabs not saving due to lifecycle issues, reverting ([c2de2de](https://github.com/cadriel/fluidd/commit/c2de2dedba231fe7e1aff7420b895615d39f8f27))
* time estimations display Infinity ([2caccaa](https://github.com/cadriel/fluidd/commit/2caccaa70fd77908979b10329bd95541cbb34c5f))
* unused var ([86b163f](https://github.com/cadriel/fluidd/commit/86b163f552ea8e369f862d715cccf98398101d10))
* update ref for vue-plotly ([1f7d275](https://github.com/cadriel/fluidd/commit/1f7d2758584e77026b5f906c160c7f47272cc3e0))

### [0.0.10](https://github.com/cadriel/fluidd/compare/v0.0.9...v0.0.10) (2020-10-30)


### Bug Fixes

* firefox not showing logo ([31475c5](https://github.com/cadriel/fluidd/commit/31475c5b5fe2063535b3ac040446f13f852e4911))

### [0.0.9](https://github.com/cadriel/fluidd/compare/v0.0.8...v0.0.9) (2020-10-30)


### Features

* add base logo ([906bea3](https://github.com/cadriel/fluidd/commit/906bea365c9b0436ed098d4cd4027265ed5c6e12))
* allow flipping camera horizontally or vertically ([ae20c2b](https://github.com/cadriel/fluidd/commit/ae20c2bd8d7f06abad906656d895e781712d0e63))
* camera defaults to disabled, can be toggled in settings ([d4483c9](https://github.com/cadriel/fluidd/commit/d4483c901b50627424718afc004398d30a1fcb5e))
* collapsable panels ([ed8f288](https://github.com/cadriel/fluidd/commit/ed8f2886042ca2c39b5c1acbd4e00b4f99056f37))
* enable machine limits ([762399e](https://github.com/cadriel/fluidd/commit/762399e6f53645cdbb74aba2bba3356a42dc6c01))
* initial pwa support + icon ([c624494](https://github.com/cadriel/fluidd/commit/c624494d468eb9ffb9cb06adabdc1d958bef67fa))
* max constrained width ([56ce0ca](https://github.com/cadriel/fluidd/commit/56ce0caadb246b1995c72b7b7d37c6647e3bf79e))
* move temp targets to tabbed panel ([dc326f3](https://github.com/cadriel/fluidd/commit/dc326f35ace4cfe9984e4f3bd7cec5b25eb4633e))
* moves theme switcher to settings page and json config ([524a0fa](https://github.com/cadriel/fluidd/commit/524a0fade15eb93ec8d76c7da269b9e28db46ba3))
* settings instance name ([38c563c](https://github.com/cadriel/fluidd/commit/38c563c702f734b3e2289c607baf0b09888dff0a))


### Bug Fixes

* cancel now works ([8acb24f](https://github.com/cadriel/fluidd/commit/8acb24fc6e72006512595cacc11f3d92e4f03ca2))
* ensure power plugin is available when klippy is not ([1493738](https://github.com/cadriel/fluidd/commit/1493738a12425bcd390ceeae75c0acc0fc199c7e))
* file modified dates should now be correct ([9623272](https://github.com/cadriel/fluidd/commit/9623272e0486c7c271ad4e1bc2d7ec35afff7b5a))
* first few console items should no longer spread ([728cc55](https://github.com/cadriel/fluidd/commit/728cc554d8f6b7b3723fa118df490c4dca613b64))
* invalid time estimates ([2dc4dd3](https://github.com/cadriel/fluidd/commit/2dc4dd3ba9b2915ccb30cd5a2d7c149b215470b4))
* reprint button now works ([0667cd7](https://github.com/cadriel/fluidd/commit/0667cd7baf28dc83f635c87ea82877266cc8522a))
* sliders not registering if mouse released outside of control ([8dee998](https://github.com/cadriel/fluidd/commit/8dee9983341b6820129618137a8ecb1a4132bf8c))
* z-adjust displays to 3 decimal points, as per lcd. ([05c9869](https://github.com/cadriel/fluidd/commit/05c986921387059e1d379d84e9dd0db2edd57bae))

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
