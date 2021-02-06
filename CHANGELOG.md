# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [1.6.3](https://github.com/cadriel/fluidd/compare/v1.6.2...v1.6.3) (2021-02-06)


### Bug Fixes

* fan value display not having a fixed decimal ([8a14ac6](https://github.com/cadriel/fluidd/commit/8a14ac65828f158176cce49ddc1f796ce025ebec))
* websocket data bleed ([cff0077](https://github.com/cadriel/fluidd/commit/cff00771988fc240520a4d977ab00fbe2e3bad85))

### [1.6.2](https://github.com/cadriel/fluidd/compare/v1.6.1...v1.6.2) (2021-02-05)


### Bug Fixes

* package-lock ([02d50e1](https://github.com/cadriel/fluidd/commit/02d50e126876054e24586ad23988a4c05101c3cd))
* temp store with no targets won't break chart ([ddefcf7](https://github.com/cadriel/fluidd/commit/ddefcf7ac287b7fe2c855e333dbc0d2cc505f676))

### [1.6.1](https://github.com/cadriel/fluidd/compare/v1.6.0...v1.6.1) (2021-01-24)


### Bug Fixes

* resolve display warning being shown when it should not be ([622c660](https://github.com/cadriel/fluidd/commit/622c66004ea0d09e2b4c31de31b026fe80c93b21))

## [1.6.0](https://github.com/cadriel/fluidd/compare/v1.5.1...v1.6.0) (2021-01-24)


### Features

* display heater applied power ([4259e18](https://github.com/cadriel/fluidd/commit/4259e183de7b1ef6fc1211de3486ddbc9f16ae6f))
* ensures compatibility with latest moonraker changes ([5fbcb63](https://github.com/cadriel/fluidd/commit/5fbcb63053a4b8316085ea3f066ee247189625bb))
* gcodes now available after first connection to klippy ([c3a89bc](https://github.com/cadriel/fluidd/commit/c3a89bc961957bf796d8d833974f27bbaf5cac42))
* power plugin now respects locked_while_printing flag ([9034968](https://github.com/cadriel/fluidd/commit/9034968b55e8787f8f7d19911704a6b9826b48db))
* refactored warnings to include failed moonraker plugins ([069adb5](https://github.com/cadriel/fluidd/commit/069adb51f1abe87684f865c058b7adc960d6cafe))
* swap tab titles around so the instance name is first ([e7867b5](https://github.com/cadriel/fluidd/commit/e7867b5a7ac13632d5deb21d6446ac32013cf5b4))


### Bug Fixes

* add correct validators to extruder length and speed ([046a0da](https://github.com/cadriel/fluidd/commit/046a0da5f33cfc7eae7649d47054515f11ad1e30))
* ensure klippy card gracefully displays on mobile layout ([e2e1f4c](https://github.com/cadriel/fluidd/commit/e2e1f4cc7a8d42c84c48df1619530e00fbcae554))
* Ensure the filament mm length is fixed to a single decimal ([a34d149](https://github.com/cadriel/fluidd/commit/a34d1495b826690f24e48f2316000af5b5ba57d0))
* ensure we clear the cam url on collapse / destroy ([e9dbd2f](https://github.com/cadriel/fluidd/commit/e9dbd2fcb72f807cd28f1d1d9f3dc0df9b500d6f))
* file editor now won't break if the file is empty ([0d5ae1b](https://github.com/cadriel/fluidd/commit/0d5ae1b451b428544cc5855d6402ee4e5f853e77))
* minor klippy card layout issue ([fe76e8e](https://github.com/cadriel/fluidd/commit/fe76e8ea753343cdfd45e44df08b8f6a28281c46))
* no longer shows you have updates if skip client updates === false ([5851669](https://github.com/cadriel/fluidd/commit/5851669e0f624ea727cd955149c073bb43eb5a5b))
* opening console from a collapsed state fires scroll event properly ([373aea3](https://github.com/cadriel/fluidd/commit/373aea30da9e160a485433d1de00f2b346dc6ad8))
* part speed fan not allowing a 0 in the input ([1cc404e](https://github.com/cadriel/fluidd/commit/1cc404ea7deaa04a4100915c7d25a520e0e6d680))
* plus / minus buttons now adhere to step value ([0ef8d4b](https://github.com/cadriel/fluidd/commit/0ef8d4bdff7fbcb62af1aec6e1f007aeb1e45289))
* pwm boolean case now no longer breaks output pins ([f8e23a8](https://github.com/cadriel/fluidd/commit/f8e23a8ced4016c8f280935cf0f236eba7c36ad9))
* readjust some tool layout to prevent wrapping at 1280 ([fc577bd](https://github.com/cadriel/fluidd/commit/fc577bd78ee276c750a1b141bff963fe6748491d))
* rules now properly apply for limits and speed / flow ([ee1191e](https://github.com/cadriel/fluidd/commit/ee1191ee7b5779715330a4258473870939e480cc))
* some console clicks weren't registering ([98a1e74](https://github.com/cadriel/fluidd/commit/98a1e744589be290cd7855bf10d088f6fd1e5230))
* temp inputs can no longer send NaN ([5d21718](https://github.com/cadriel/fluidd/commit/5d21718752720d17df834f92f10eb42921ff5c8b))
* update response output ([f680525](https://github.com/cadriel/fluidd/commit/f680525e5cab9fea77088080aca408f04284e25c))

### [1.5.1](https://github.com/cadriel/fluidd/compare/v1.5.0...v1.5.1) (2021-01-17)


### Bug Fixes

* console not scrolled when navigating pages ([68018f2](https://github.com/cadriel/fluidd/commit/68018f24430b168a8d578ffd5dea70ae83bf2903))

## [1.5.0](https://github.com/cadriel/fluidd/compare/v1.4.3...v1.5.0) (2021-01-17)


### Features

* add basic icons representing types in thermals card ([e6db221](https://github.com/cadriel/fluidd/commit/e6db2211d6c121b196076dc36825d5c275fa6797))
* add requested speed to toolhead ([066e59f](https://github.com/cadriel/fluidd/commit/066e59f32798c9c9aa2d6b90384f77cd6a2d0104))
* add UI to control output pins ([5a2d4df](https://github.com/cadriel/fluidd/commit/5a2d4df87956b68f9e7fe2cfaecbb36a6d60b077))
* adjust layout of fans ([10e9c3c](https://github.com/cadriel/fluidd/commit/10e9c3c5c8ac5614764d0a732ae6a08f67253fad))
* allow input values for sliders ([7a1c63d](https://github.com/cadriel/fluidd/commit/7a1c63dd2e87761689d89f01b5f55a626c2c37b7))
* automated deploys ([359af43](https://github.com/cadriel/fluidd/commit/359af43ffb6b42c93c5822cec98fff147a0c93f3))
* implements console command history ([06560fe](https://github.com/cadriel/fluidd/commit/06560fe2d1534824e39810ea972e64f785f95415))
* new icon for outputs ([b6613b8](https://github.com/cadriel/fluidd/commit/b6613b8dc3bf05b3d6fbf9a0462d7e4c28be2414))
* releases are now linked to their respective github pages ([2807559](https://github.com/cadriel/fluidd/commit/280755999e2778ea248e3e9eb2b40d096021fff1))
* removes unnecessary home buttons for delta kinematics ([ffbe46a](https://github.com/cadriel/fluidd/commit/ffbe46a4d7d81c7cb734e51133a0b7b31b3cc394))


### Bug Fixes

* allow a step size of 0.1 for SCV ([5cb148d](https://github.com/cadriel/fluidd/commit/5cb148d2363d95ee284397c352411df26dd3affc))
* config page margins ([1c8fb90](https://github.com/cadriel/fluidd/commit/1c8fb90f9d898b1d6550c9ab7dbdc62e5f181fdb))
* console click command included prefix ([538cafb](https://github.com/cadriel/fluidd/commit/538cafb89fd7176080e7e7f3ab17f62cfc0ec9b1))
* console now copy / pastes as you'd expect ([dedffb4](https://github.com/cadriel/fluidd/commit/dedffb418299f2cbe20c7cf19ea13b3cdb00c3dc))
* disable the jobs menu on disconnect instead of hide ([c8f5b56](https://github.com/cadriel/fluidd/commit/c8f5b56613d04431e507657b8501a1e80bafa1ec))
* Doc links updated ([7e9412f](https://github.com/cadriel/fluidd/commit/7e9412f82375a0f14680020b0eaca3314e3d128f))
* ensure file search style matches other inputs ([c7150be](https://github.com/cadriel/fluidd/commit/c7150bea6c0f373bcca380d1ab9a47e3a1119cb3))
* ensure save and restart is not usable during a print ([ac9588c](https://github.com/cadriel/fluidd/commit/ac9588c2cacf418ab3a06452f99e542214ed4940))
* ensures console scroll works during layout changes ([8325c86](https://github.com/cadriel/fluidd/commit/8325c86e4a6cb1dda3bd9efaea1e3adc4902537c))
* freshly loaded bed meshes now show their variance ([748e46a](https://github.com/cadriel/fluidd/commit/748e46ae6e146668417027cf6fd472d22a51be59))
* Klippy error card is no longer delayed before being hidden ([9b7aba9](https://github.com/cadriel/fluidd/commit/9b7aba930dbb3fd15aa756eca00a06348f8aab49))
* minor adjustment to m117 display ([7d198fb](https://github.com/cadriel/fluidd/commit/7d198fbd8f89d29463f17b0624d582f38722510c))
* release action ([68d0967](https://github.com/cadriel/fluidd/commit/68d0967c26dcee0e0037d77d2cfa6c1c8811be15))
* removed external dependence on fonts on icon styles ([b454ac8](https://github.com/cadriel/fluidd/commit/b454ac8fc9151b74c3d0ff7538463e5e5dffffef))
* sliders min 1 + status only hides with no status ([77a9a99](https://github.com/cadriel/fluidd/commit/77a9a99d11427f3188d0222ab0ca2d0d00326bc6))
* Some items not returning prettified names ([d1472ed](https://github.com/cadriel/fluidd/commit/d1472edf08bff0c1ad9c89c9f39e0c8512d6a3cd))
* speed in mm/s ([ed4452a](https://github.com/cadriel/fluidd/commit/ed4452aabe88000b1d96457df4be26cf60e46650))
* Temp graph no longer consumes resources in a collapsed state ([f566190](https://github.com/cadriel/fluidd/commit/f5661906f4f9d2f308048ae86d600ca302e3018d))
* temp presets no longer error if heaters or fan names change ([1ac6d37](https://github.com/cadriel/fluidd/commit/1ac6d3783730019da58ee987d82fda44c68102d4))

### [1.4.3](https://github.com/cadriel/fluidd/compare/v1.4.2...v1.4.3) (2021-01-10)


### Features

* add Dockerfile & Github workflow ([d7c697d](https://github.com/cadriel/fluidd/commit/d7c697d42c5205a453ca1f2599c076f6abc3d2d0))
* automated build ([fa92e38](https://github.com/cadriel/fluidd/commit/fa92e38bdecf320d36b74ac3f4e6399de3e45b1b))


### Bug Fixes

* add potato to dev deps ([b4badfc](https://github.com/cadriel/fluidd/commit/b4badfced3c3dc55a1b02a1a6da4177309f52b57))
* client warnings should now show properly ([793d9c9](https://github.com/cadriel/fluidd/commit/793d9c95dd427e43579d9d18b96ea95e91bc7701))
* ensure you can't check for updates during a print ([a87fe80](https://github.com/cadriel/fluidd/commit/a87fe80f5da393411c2a52488fbedfda23136597))
* extrude snowflake issues when min_extrude_temp === 0 ([78f2328](https://github.com/cadriel/fluidd/commit/78f2328ac340cf8c6425800e309c2cfc293a307a))
* Filament reporting under 1m ([b556f46](https://github.com/cadriel/fluidd/commit/b556f463ed8bf375220d961c31d2378a68998ca9)), closes [#70](https://github.com/cadriel/fluidd/issues/70)
* OS updates should properly update status now ([aed9896](https://github.com/cadriel/fluidd/commit/aed9896e5ae99facffaac2cf60e0e6ced9612377))
* rename restart mcu's to firmware restart klipper ([a597aa2](https://github.com/cadriel/fluidd/commit/a597aa238535c1d2dce7f72eb412db453c475fc1))

### [1.4.2](https://github.com/cadriel/fluidd/compare/v1.4.1...v1.4.2) (2021-01-04)


### Features

* add ability to remove mesh profiles ([f2830df](https://github.com/cadriel/fluidd/commit/f2830dfee6e10113560b214c8b8c22c061211d22))
* Allow multiple files upload from upload button. ([15695d1](https://github.com/cadriel/fluidd/commit/15695d1a758a6bb6451fd4f009007fd480c4dd3a))
* make use of automated update status notifications ([791767d](https://github.com/cadriel/fluidd/commit/791767d88fa478ce03669d2b0b0998d0f642ad2a))
* moves home controls to a rollout ([c868d50](https://github.com/cadriel/fluidd/commit/c868d50ad704d4d642552df6ebf246037ebb4695))
* reduce title font size on mobile ([2dbe487](https://github.com/cadriel/fluidd/commit/2dbe487e322ecc0842db2bf09677c5a19dea5bad))


### Bug Fixes

* ensure an estop doesn't dispatch disconnected event ([0ec0386](https://github.com/cadriel/fluidd/commit/0ec0386205be5dbeae2a8b0012a97b436176280d))
* ensure home buttons color correctly ([1226f81](https://github.com/cadriel/fluidd/commit/1226f81a78c33185bd1cd6fe5b60919c39d3a1fc))
* generic fans now controllable ([34addf3](https://github.com/cadriel/fluidd/commit/34addf3477dbcc16a9d9590b4b6a9d2bcca2fa72))
* issue when printing freshly uploaded files ([eb8204c](https://github.com/cadriel/fluidd/commit/eb8204c5c26a571b86c148245276a968a29b0a47))
* minor layout issue on settings page ([84ae80f](https://github.com/cadriel/fluidd/commit/84ae80fba760137ad89a9f1990bba78743a01645))
* Now watches for klippy shutdown ([d71e513](https://github.com/cadriel/fluidd/commit/d71e513ccf4a9dc2d648e40c41f095a747bce12c))
* Prop type error ([e1f86d7](https://github.com/cadriel/fluidd/commit/e1f86d77f840df4c03f451e17220ae2306a21eda))
* temp preset validation ([895c194](https://github.com/cadriel/fluidd/commit/895c194e4e6525913c65f4958552d729364da191))
* toolhead title buttons overflowing ([292d2b8](https://github.com/cadriel/fluidd/commit/292d2b8bf016c2882bd6d4405a0787ace61a684f))
* update status no longer effects other waits in the UI ([c2751d5](https://github.com/cadriel/fluidd/commit/c2751d55e61f2e6739937c63b797f7a05e4600fb))

### [1.4.1](https://github.com/cadriel/fluidd/compare/v1.4.0...v1.4.1) (2020-12-31)


### Bug Fixes

* allow ending digits for hostnames during validation ([81c1c9a](https://github.com/cadriel/fluidd/commit/81c1c9a1a830208021d0a9141f18cb6617df0282))
* dialog action buttons now have more reasonable padding ([58c846a](https://github.com/cadriel/fluidd/commit/58c846a035c7cb45e76aa53cebcc5e275916ff9d))
* ensure logs card isn't shown when client / klippy is in error. ([004ebe0](https://github.com/cadriel/fluidd/commit/004ebe0780b118096fee8009ac98966884521cdf))
* loader applied only while updating ([f840ccc](https://github.com/cadriel/fluidd/commit/f840cccbdb44fd42078e4250039b54705e315171))

## [1.4.0](https://github.com/cadriel/fluidd/compare/v1.3.1...v1.4.0) (2020-12-29)


### Features

* improved upload status ([3da419e](https://github.com/cadriel/fluidd/commit/3da419ee52970694152213e4a12964425f1c086e))


### Bug Fixes

* ensure add printer instance url requires protocol ([17c3271](https://github.com/cadriel/fluidd/commit/17c327196966608b2aa2f9f263d02c124cfe5035))

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
