# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

## [1.30.5](https://github.com/fluidd-core/fluidd/compare/v1.30.4...v1.30.5) (2024-10-16)


### Features

* **FileSystem:** allow filtering Moonraker temp upload files ([#1507](https://github.com/fluidd-core/fluidd/issues/1507)) ([4522522](https://github.com/fluidd-core/fluidd/commit/4522522803463ed48402972b5653d8bb8c6642b8))
* **i18n-de:** Update German translations ([e96b3a1](https://github.com/fluidd-core/fluidd/commit/e96b3a199729f0419fb5ce698680db8f131d4b3d))
* **i18n-es:** Update Spanish translations ([de444e0](https://github.com/fluidd-core/fluidd/commit/de444e02d0bf0e91135dab0add66d1f55a4269f7))
* **i18n-nl:** Update Dutch translations ([0db2396](https://github.com/fluidd-core/fluidd/commit/0db2396ad579d10e4c09296bf8e212e6062b1747))
* **i18n-pl:** Update Polish translations ([319331b](https://github.com/fluidd-core/fluidd/commit/319331b317af4f51d20c08456dff554757e3d71d))
* increase Z precision to 3 decimals ([#1505](https://github.com/fluidd-core/fluidd/issues/1505)) ([3cea36e](https://github.com/fluidd-core/fluidd/commit/3cea36e02141924a40c8e4f3ad30fe083289c31e))
* show application as soon as possible ([#1499](https://github.com/fluidd-core/fluidd/issues/1499)) ([845d044](https://github.com/fluidd-core/fluidd/commit/845d044dbd535b1b566192af94e2e38a8d6cf82c))


### Bug Fixes

* check for Klipper minimum version ([adb2c95](https://github.com/fluidd-core/fluidd/commit/adb2c95e74025f0cef802c17138eb1c50ece924a))
* **Console:** improve highlight regular expression ([e567cc5](https://github.com/fluidd-core/fluidd/commit/e567cc5f02b47dc08be3d90a46414e4ddd43c564))
* disable "Update All" button when an invalid repo is detected ([#1500](https://github.com/fluidd-core/fluidd/issues/1500)) ([a2cc361](https://github.com/fluidd-core/fluidd/commit/a2cc36164de25b9c00d8e7a1a567b8ac6e36701b))
* hide drag overlay on mouse drag leave ([#1496](https://github.com/fluidd-core/fluidd/issues/1496)) ([74890da](https://github.com/fluidd-core/fluidd/commit/74890dac90bea148600cf82352ef841497d7b1b0))
* no pointer events on images ([8e2c501](https://github.com/fluidd-core/fluidd/commit/8e2c501f844d1d185dcb468ba3960c576da2addc))
* redirect from login page if authenticated ([#1498](https://github.com/fluidd-core/fluidd/issues/1498)) ([988daa0](https://github.com/fluidd-core/fluidd/commit/988daa045d5cc60965204392ed73aac42a7913cf))
* refresh Klipper objects on klippy connect ([abfcc60](https://github.com/fluidd-core/fluidd/commit/abfcc60fbe1c2884c123145d2959e9214639fbe1))
* set Minimum Cruise Ratio maximum to 99% ([0bddef2](https://github.com/fluidd-core/fluidd/commit/0bddef26a72826dd677e4beca4cba4cd48633b46))

## [1.30.4](https://github.com/fluidd-core/fluidd/compare/v1.30.3...v1.30.4) (2024-09-12)


### Features

* don't show quotes on default macro params ([#1487](https://github.com/fluidd-core/fluidd/issues/1487)) ([f0f0764](https://github.com/fluidd-core/fluidd/commit/f0f076450eceb1c41d065a4d1c935842caaccac8))
* **FileSystem:** Filter KlipperScreen rolled logs ([#1482](https://github.com/fluidd-core/fluidd/issues/1482)) ([48c158f](https://github.com/fluidd-core/fluidd/commit/48c158fd0b0a59002c3216c4cbc9fd113a8d2c80))
* hides macro parameters starting with "_" ([#1485](https://github.com/fluidd-core/fluidd/issues/1485)) ([872e9d8](https://github.com/fluidd-core/fluidd/commit/872e9d8455cdb82d3e522d61fd6a95e6a8c457b7))
* **i18n-fr:** Update French translations ([e4567ac](https://github.com/fluidd-core/fluidd/commit/e4567ac4409bf09591754e0edbf08c2580378ccf))
* **i18n-pt_BR:** Update Portuguese (Brazil) translations ([6c8008a](https://github.com/fluidd-core/fluidd/commit/6c8008a2d6b8e10ad7769ca78395d18c1642416c))
* **i18n-tr:** Update Turkish translations ([cd73dda](https://github.com/fluidd-core/fluidd/commit/cd73dda48b7cfb7da02afc25ba696c3b47ee12fc))
* restore positioning mode after extrude/move ([#1492](https://github.com/fluidd-core/fluidd/issues/1492)) ([4418256](https://github.com/fluidd-core/fluidd/commit/441825668ee52febc146d404a94b77cf41164d09))
* show Minimum Cruise Ratio as percentage ([62fe156](https://github.com/fluidd-core/fluidd/commit/62fe1564faec39370ca7713855dd4d1507c0321b))


### Bug Fixes

* don't use separator for gcode macros ([#1483](https://github.com/fluidd-core/fluidd/issues/1483)) ([7ec4626](https://github.com/fluidd-core/fluidd/commit/7ec462600df533aa321d46832da11d3e867a0ef7))
* null check cards on layout init ([#1484](https://github.com/fluidd-core/fluidd/issues/1484)) ([3f1d22e](https://github.com/fluidd-core/fluidd/commit/3f1d22ea0e48aa0809461171da2f340c2417382a))

## [1.30.3](https://github.com/fluidd-core/fluidd/compare/v1.30.2...v1.30.3) (2024-08-14)


### Bug Fixes

* Dynamic loading of camera components ([#1479](https://github.com/fluidd-core/fluidd/issues/1479)) ([e6ac387](https://github.com/fluidd-core/fluidd/commit/e6ac387a5e9b93f43daf3a594de4d1f52e1418ba))

## [1.30.2](https://github.com/fluidd-core/fluidd/compare/v1.30.1...v1.30.2) (2024-08-14)


### Features

* **i18n-de:** Update German translations ([aee3cfa](https://github.com/fluidd-core/fluidd/commit/aee3cfaf779e0a099ef75f4577f9c7f7e3518bd9))
* **i18n-hu:** Update Hungarian translations ([48c0b3e](https://github.com/fluidd-core/fluidd/commit/48c0b3e87c36445d956030fbf2eb2f892998f059))
* **i18n-ru:** Update Russian translations ([3697b2d](https://github.com/fluidd-core/fluidd/commit/3697b2d6c3fb3b944df758ca41976a91ba8d305b))
* **i18n-zh-HK:** Update Chinese (Traditional, Hong Kong) translations ([1fbdc42](https://github.com/fluidd-core/fluidd/commit/1fbdc42960e1c7d225ad753e7dd9be920e160715))
* improve alignment of runout sensor switch and icon ([#1469](https://github.com/fluidd-core/fluidd/issues/1469)) ([7d0a890](https://github.com/fluidd-core/fluidd/commit/7d0a8901fe275fe4931f16500c04bca185090586))


### Bug Fixes

* Check for Meta key on keyboard shortcuts ([#1477](https://github.com/fluidd-core/fluidd/issues/1477)) ([415521e](https://github.com/fluidd-core/fluidd/commit/415521e313e7a62ae79f7136ce3cf396f64cb218))
* Fix repo URLs in version information dialog ([#1464](https://github.com/fluidd-core/fluidd/issues/1464)) ([bda900d](https://github.com/fluidd-core/fluidd/commit/bda900dc117240ae3f6680e74f8990e06ae4aac9))
* item name format and capitalization ([#1468](https://github.com/fluidd-core/fluidd/issues/1468)) ([d1ba830](https://github.com/fluidd-core/fluidd/commit/d1ba8301da50e35764e84cd0b71b6ff49d7469ff))
* Translation keys for base domains ([e2cb461](https://github.com/fluidd-core/fluidd/commit/e2cb4618c9f78bdd75ff04d04334e3caed6fd604))

## [1.30.1](https://github.com/fluidd-core/fluidd/compare/v1.30.0...v1.30.1) (2024-06-20)


### Features

* adds Danger Klipper config support ([#1446](https://github.com/fluidd-core/fluidd/issues/1446)) ([0c4f79e](https://github.com/fluidd-core/fluidd/commit/0c4f79ecb705d2c946384fa86620212b95e031bb))
* hides thermal sensors starting with "_" ([#1443](https://github.com/fluidd-core/fluidd/issues/1443)) ([ea0ea9e](https://github.com/fluidd-core/fluidd/commit/ea0ea9e674aaacbd0fb6098b51a582f10e5b7143))
* **i18n-de:** Update German translations ([dd7d1b2](https://github.com/fluidd-core/fluidd/commit/dd7d1b20a67a2d697a6fb10ccfc00d3eed2cffcf))
* **i18n-es:** Update Spanish translations ([b3a5e60](https://github.com/fluidd-core/fluidd/commit/b3a5e60a85318543aeeaca029f9333cec18679b3))
* **i18n-fr:** Update French translations ([66b4fcb](https://github.com/fluidd-core/fluidd/commit/66b4fcbc592ad79eed316f409ba374d5a0f63fb2))
* **i18n-hu:** Update Hungarian translations ([68ffd27](https://github.com/fluidd-core/fluidd/commit/68ffd275d155d4355513d5dee255404352071128))
* **i18n-ja:** Update Japanese translations ([51a69d6](https://github.com/fluidd-core/fluidd/commit/51a69d6cb4bee24bcc01b2b8040061da40f629b6))
* **i18n-nl:** Update Dutch translations ([0dbedc9](https://github.com/fluidd-core/fluidd/commit/0dbedc9b23adf3d5867df029fddbc5c7404cfefb))
* **i18n-ru:** Update Russian translations ([668db6c](https://github.com/fluidd-core/fluidd/commit/668db6c4023b089dd0aa4b0c8118c3c03abe53c5))
* **i18n-SL:** Update Slovenian translation ([#1452](https://github.com/fluidd-core/fluidd/issues/1452)) ([8225b0f](https://github.com/fluidd-core/fluidd/commit/8225b0f0e5a7ec4e36e28ed35c9b5e50e32beb9a))
* **i18n-tr:** Update Turkish translations ([8581533](https://github.com/fluidd-core/fluidd/commit/858153312a3a383e52d04eb1bbbc8c78404557fd))
* show print progress when status panel is collapsed ([#1445](https://github.com/fluidd-core/fluidd/issues/1445)) ([0f72501](https://github.com/fluidd-core/fluidd/commit/0f7250133338c7e2f68e875017cd0f953d8e6245))
* show warning for Trinamic OTPW flag ([#1448](https://github.com/fluidd-core/fluidd/issues/1448)) ([ac2a0a8](https://github.com/fluidd-core/fluidd/commit/ac2a0a854e25f98dc6da15ea5c758d517bb9e698))
* **spoolman:** add remaining filament display unit setting ([#1444](https://github.com/fluidd-core/fluidd/issues/1444)) ([b8b1924](https://github.com/fluidd-core/fluidd/commit/b8b19241ce8b13d7fe5711aa6795933206789748))


### Bug Fixes

* **FileSystem:** zip timestamp format ([df59f78](https://github.com/fluidd-core/fluidd/commit/df59f785b25d7ea90245e7e676aef307745d41cb))
* hide z-offset controls if not available ([2a2093f](https://github.com/fluidd-core/fluidd/commit/2a2093f9bf0dc28a6e6fc4aa02a018f4082e7d44))
* race condition on file upload/download state ([9ae83b6](https://github.com/fluidd-core/fluidd/commit/9ae83b66d002babfc5783d1c96ab55f92617bdbf))
* use file size as download progress fallback calculation ([8d21a84](https://github.com/fluidd-core/fluidd/commit/8d21a848a6036291dfe5d05c50f520d645ea4c8c))

## [1.30.0](https://github.com/fluidd-core/fluidd/compare/v1.29.1...v1.30.0) (2024-05-01)


### Features

* adds keyboard shortcuts ([#1404](https://github.com/fluidd-core/fluidd/issues/1404)) ([79a6bcc](https://github.com/fluidd-core/fluidd/commit/79a6bcc979239e40b60542d4ce7a6061ae8631bc))
* adds SHT3X sensor support ([8637e47](https://github.com/fluidd-core/fluidd/commit/8637e47e7346a678c51f9c8a08f44f962f36286b))
* adds WebRTC (MediaMTX) support ([#1409](https://github.com/fluidd-core/fluidd/issues/1409)) ([7b8d988](https://github.com/fluidd-core/fluidd/commit/7b8d988c927828f54324bf897a404f66412dd09f))
* backup and restore settings ([#1427](https://github.com/fluidd-core/fluidd/issues/1427)) ([5029dab](https://github.com/fluidd-core/fluidd/commit/5029dab0a6fe7b44ab7db55f37a2ba739bfa4e9c))
* corrects print progress store getter ([befcce0](https://github.com/fluidd-core/fluidd/commit/befcce0fbaf86f90bd626d5df76bbcfd7e73c1ba))
* **FileSystem:** remember last sort order ([#1406](https://github.com/fluidd-core/fluidd/issues/1406)) ([5cf9a49](https://github.com/fluidd-core/fluidd/commit/5cf9a49053d9c1a3715c88e08ffaae351d467763))
* **i18n-af:** Update Afrikaans translations ([1305381](https://github.com/fluidd-core/fluidd/commit/1305381e0522bd448aff24c101fd8a685e74cbd8))
* **i18n-ar:** Update Arabic translations ([6d7fa1b](https://github.com/fluidd-core/fluidd/commit/6d7fa1b17b6fe921b97adcebf3f3e6573393f9cf))
* **i18n-de:** Update German translations ([6245d44](https://github.com/fluidd-core/fluidd/commit/6245d44c3eed98fedaf10411d123cd0bdc162384))
* **i18n-fr:** Update French translations ([d02c6ca](https://github.com/fluidd-core/fluidd/commit/d02c6ca3b911bfde812ce19c87a72532220884b3))
* **i18n-fr:** Update French translations ([f4a0187](https://github.com/fluidd-core/fluidd/commit/f4a01870e65ec8f42acd39715f317fe290a9598a))
* **i18n-hu:** Update Hungarian translations ([8f8c18b](https://github.com/fluidd-core/fluidd/commit/8f8c18b15c3e56e76685f3f1c21b4f2953ead08d))
* **i18n-ja:** Update Japanese translations ([fa9de72](https://github.com/fluidd-core/fluidd/commit/fa9de723a2749e878d2940b0660da8b95433447a))
* **i18n-ru:** Update Russian translations ([c634b8f](https://github.com/fluidd-core/fluidd/commit/c634b8fa72f520b3d2547b2f4d41591971f14754))
* **i18n-RU:** update Russian translations ([#1413](https://github.com/fluidd-core/fluidd/issues/1413)) ([dc9a9c3](https://github.com/fluidd-core/fluidd/commit/dc9a9c38aed7d63f9d4b8d996928ceaae3e8c52e))
* **i18n-sl:** Update Slovenian translations ([8323043](https://github.com/fluidd-core/fluidd/commit/8323043d91f8d410822de76a851a6796dd6e5a48))
* **i18n-tr:** Update Turkish translations ([f3ab0f1](https://github.com/fluidd-core/fluidd/commit/f3ab0f1cf69877633a5eee1bdb6b1aaa4dce34c0))
* **i18n-uk:** Update Ukrainian translations ([b3941b8](https://github.com/fluidd-core/fluidd/commit/b3941b893df5fb68d8a8cd55ada42b3d12f4a8ba))
* print progress estimation improvements ([#1414](https://github.com/fluidd-core/fluidd/issues/1414)) ([8ad71bc](https://github.com/fluidd-core/fluidd/commit/8ad71bc4fe25c7c42213259a9bfa2ece48ffedb8))
* show all fan and pin values as percentages ([#1418](https://github.com/fluidd-core/fluidd/issues/1418)) ([192ee19](https://github.com/fluidd-core/fluidd/commit/192ee192f45b81fdb2094046c2905335be91b8f8))
* use correct stepper temperature label ([#1425](https://github.com/fluidd-core/fluidd/issues/1425)) ([9e05ef4](https://github.com/fluidd-core/fluidd/commit/9e05ef48d144e9d6e23852e2757bd7a55ecc64d8))


### Bug Fixes

* broken state merging ([c99b7f3](https://github.com/fluidd-core/fluidd/commit/c99b7f39e7bd5c5e779f329884bd45bed770f937))
* broken state merging (cont.) ([6ad2aca](https://github.com/fluidd-core/fluidd/commit/6ad2acae58d6ca79a69097c62650b0a04f340faa))
* **gcodepreview:** ignore moves without coordinates ([#1416](https://github.com/fluidd-core/fluidd/issues/1416)) ([8748e16](https://github.com/fluidd-core/fluidd/commit/8748e166f8e2151166542da366e281fafa8ca214))
* **gcodepreview:** retraction values ([2970a11](https://github.com/fluidd-core/fluidd/commit/2970a11765606c125d7ff0a5ec8db29ddb0269e6))
* **spoolman:** improve sanity check logic ([#1411](https://github.com/fluidd-core/fluidd/issues/1411)) ([6930a24](https://github.com/fluidd-core/fluidd/commit/6930a24b024dd97d9d54edcefa9e4b79d4e789c9))

## [1.29.1](https://github.com/fluidd-core/fluidd/compare/v1.29.0...v1.29.1) (2024-03-31)


### Features

* basic Nevermore Controller support ([#1114](https://github.com/fluidd-core/fluidd/issues/1114)) ([91ee7d5](https://github.com/fluidd-core/fluidd/commit/91ee7d5de555f58f20766e07314e698480c66d0a))
* **i18n-hu:** Update Hungarian translations ([5670637](https://github.com/fluidd-core/fluidd/commit/5670637082f42137b8724a91513d62b54d3415a5))
* **i18n-ru:** Update Russian translations ([41270c3](https://github.com/fluidd-core/fluidd/commit/41270c3280e3de4118107f3bc16517ee4976701b))
* **i18n-tr:** Update Turkish translations ([665bc46](https://github.com/fluidd-core/fluidd/commit/665bc466602e5f1a3e13d102ee861d4d2ba8a18a))
* **i18n-TR:** Updates Turkish translations ([#1393](https://github.com/fluidd-core/fluidd/issues/1393)) ([3fba2e4](https://github.com/fluidd-core/fluidd/commit/3fba2e47faf5ecd142b89d460efc97148582d49d))


### Bug Fixes

* distribution info formatting ([b35f6be](https://github.com/fluidd-core/fluidd/commit/b35f6beaa028da26f752329ba6ace97ea94c5912))
* hide link in software updates if repo unknown ([cbe4307](https://github.com/fluidd-core/fluidd/commit/cbe4307fed446d2726c8f0932dcb95cb4ed0e8ac))
* PeripheralsDialog labels ([6f617c2](https://github.com/fluidd-core/fluidd/commit/6f617c29a9d69ef2b0cda82df599e461e4865f83))
* progress not shown a number ([#1399](https://github.com/fluidd-core/fluidd/issues/1399)) ([9ebd037](https://github.com/fluidd-core/fluidd/commit/9ebd03778c5c73fab1dc9c01185da63fa6963aaf))
* remove leftover console log statement ([febb3e8](https://github.com/fluidd-core/fluidd/commit/febb3e808e82bd0e51d2f8a5d4daa4b86c4efa81))
* removes "Filter printed" menu item description ([#1396](https://github.com/fluidd-core/fluidd/issues/1396)) ([8d354b6](https://github.com/fluidd-core/fluidd/commit/8d354b67aefa217e42425cf2d2d4951d7d1dba57))
* rolled log files filter ([9d2a1cb](https://github.com/fluidd-core/fluidd/commit/9d2a1cbfba50f57e5c32f5c35d124027581a34ba))
* use Klipper can_extrude by default ([#1397](https://github.com/fluidd-core/fluidd/issues/1397)) ([83f4fb2](https://github.com/fluidd-core/fluidd/commit/83f4fb2ce1d51dde4e8d1017519b1943a8625d5e))

## [1.29.0](https://github.com/fluidd-core/fluidd/compare/v1.28.1...v1.29.0) (2024-03-16)


### Features

* add finish time selection from slicer or file ([#1378](https://github.com/fluidd-core/fluidd/issues/1378)) ([04abea4](https://github.com/fluidd-core/fluidd/commit/04abea47609e5a96016174847408977146dc347a))
* adds support for machine peripherals ([#1383](https://github.com/fluidd-core/fluidd/issues/1383)) ([b97b53c](https://github.com/fluidd-core/fluidd/commit/b97b53c8ff66c3026e059df993daf4a8ac47b983))
* allow percentage-based inputs in color picker ([#1374](https://github.com/fluidd-core/fluidd/issues/1374)) ([3aa7269](https://github.com/fluidd-core/fluidd/commit/3aa72697dd5c05828b3c10bd8ff939d6dcd42046))
* allow showing Runout Sensors on Dashboard ([#1391](https://github.com/fluidd-core/fluidd/issues/1391)) ([ef13842](https://github.com/fluidd-core/fluidd/commit/ef138423aa85aa2474c95a1a2656d8ba22f6a429))
* **i18n-de:** Update German translations ([8e3c155](https://github.com/fluidd-core/fluidd/commit/8e3c15510962a0b82cccf76f91edd65c6e9f33b5))
* **i18n-HU:** Update Hungarian translations ([#1367](https://github.com/fluidd-core/fluidd/issues/1367)) ([ac8ce24](https://github.com/fluidd-core/fluidd/commit/ac8ce24365cf3aae30dfe38061b457843365e106))
* **i18n-JA:** update Japanese language ([#1370](https://github.com/fluidd-core/fluidd/issues/1370)) ([be6f488](https://github.com/fluidd-core/fluidd/commit/be6f4882d6955d406d24f81cfc88f5240d0364d9))
* **i18n-pt:** Update Portuguese translations ([652cfbf](https://github.com/fluidd-core/fluidd/commit/652cfbf9bcab719a5ffd1e2252e9c90aefdb76e1))
* layout improvements for small screen ([#1389](https://github.com/fluidd-core/fluidd/issues/1389)) ([d9a503a](https://github.com/fluidd-core/fluidd/commit/d9a503a406740f8bf9c778813b78bdb591f9e8c7))
* view rendered Markdown files ([#1376](https://github.com/fluidd-core/fluidd/issues/1376)) ([615317a](https://github.com/fluidd-core/fluidd/commit/615317a641f3c3e62058b610f6e5089f7bdcc5fb))


### Bug Fixes

* Armbian distribution information ([#1388](https://github.com/fluidd-core/fluidd/issues/1388)) ([c8da496](https://github.com/fluidd-core/fluidd/commit/c8da496a163693d35912923d0b382ef8f9eb237a))
* **console:** auto-focus textbox on full screen ([1fec488](https://github.com/fluidd-core/fluidd/commit/1fec4882984c632f90546a9d7171db224d432e63))
* **console:** keep enabled if klippy is connected ([3763366](https://github.com/fluidd-core/fluidd/commit/3763366f60c1905028b72684b33e87644c08f601))
* disable Check Updates button if printer printing ([#1382](https://github.com/fluidd-core/fluidd/issues/1382)) ([3c9d4b8](https://github.com/fluidd-core/fluidd/commit/3c9d4b86169ccfb86fc71ae0bcce468bc1cfb13c))
* **FilePreviewDialog:** make `path` property optional ([#1380](https://github.com/fluidd-core/fluidd/issues/1380)) ([85facaa](https://github.com/fluidd-core/fluidd/commit/85facaae0cc0c5ef177479bf24652b0da9a79bec))
* **filesystem:** remove obsolete filters ([773840d](https://github.com/fluidd-core/fluidd/commit/773840d93d9a50e697253408e380ed8db0448f53))
* make color picker use v-model and propsync ([#1375](https://github.com/fluidd-core/fluidd/issues/1375)) ([4f6198f](https://github.com/fluidd-core/fluidd/commit/4f6198f0205671d7d53d343a5d25832dc64dc083))
* **spoolman:** missing filament material in selection dialog ([#1387](https://github.com/fluidd-core/fluidd/issues/1387)) ([066ece3](https://github.com/fluidd-core/fluidd/commit/066ece3128af69661ff83a7f181a715175f35fcb))
* **style:** text color on bed mesh chart ([#1371](https://github.com/fluidd-core/fluidd/issues/1371)) ([3863fdd](https://github.com/fluidd-core/fluidd/commit/3863fdd276124843868895049dc6df60193af18e))

## [1.28.1](https://github.com/fluidd-core/fluidd/compare/v1.28.0...v1.28.1) (2024-02-18)


### Features

* adds MCU last stats ([#1358](https://github.com/fluidd-core/fluidd/issues/1358)) ([c2e34d7](https://github.com/fluidd-core/fluidd/commit/c2e34d7eb2686d41852cdb1403e9d62e5492e4be))
* adds probe accuracy support ([#1365](https://github.com/fluidd-core/fluidd/issues/1365)) ([a72342a](https://github.com/fluidd-core/fluidd/commit/a72342ab0f024b9d53fc74a10ba9074c1c4d6b77))
* **console:** auto-focus textbox on full screen ([70fd947](https://github.com/fluidd-core/fluidd/commit/70fd947d358b109a8de5de61bc0dfebf323d3939))


### Bug Fixes

* default vuetify theme color ([784a3e8](https://github.com/fluidd-core/fluidd/commit/784a3e84c4bfbb18f485d9dacc0e3905be1c7b44))
* don't override `gcode_macro` variables with stale values ([#1355](https://github.com/fluidd-core/fluidd/issues/1355)) ([74def24](https://github.com/fluidd-core/fluidd/commit/74def24e1c51a8c77b18c30fa6d3ad687c51fb88))
* remove redundant data from stored macros ([#1356](https://github.com/fluidd-core/fluidd/issues/1356)) ([c105dc7](https://github.com/fluidd-core/fluidd/commit/c105dc7009ce50ba46c15e44a0ac1ba7323863f7))
* **spoolman:** dialog title ([#1354](https://github.com/fluidd-core/fluidd/issues/1354)) ([e800d6e](https://github.com/fluidd-core/fluidd/commit/e800d6e7f14034aebd0e2ea59fb4c31c537922fe))
* **spoolman:** sorting by "last used" in spool selection dialog ([#1361](https://github.com/fluidd-core/fluidd/issues/1361)) ([61a58f7](https://github.com/fluidd-core/fluidd/commit/61a58f7e07a33ca6143c72825af25c73bba55431))

## [1.28.0](https://github.com/fluidd-core/fluidd/compare/v1.27.1...v1.28.0) (2024-02-09)


### Features

* adds "interrupted" job status support ([45ebd1b](https://github.com/fluidd-core/fluidd/commit/45ebd1b502c08796fd06ce8272986a351ec7bf4f))
* adds initial pwm_cycle_time support ([138b0ba](https://github.com/fluidd-core/fluidd/commit/138b0bac854a1e181a33cfb0af6e9ec2e562e6cb))
* adds initial pwm_tool support ([a09c1a9](https://github.com/fluidd-core/fluidd/commit/a09c1a9d13b3c779eb73cd55991222c3ae4ae244))
* adds link to components in software updates ([#1348](https://github.com/fluidd-core/fluidd/issues/1348)) ([f9ec282](https://github.com/fluidd-core/fluidd/commit/f9ec2822fed940e2f73e7c817249575b461465b5))
* adds print in progress status layout setting ([#1346](https://github.com/fluidd-core/fluidd/issues/1346)) ([c5e3a0b](https://github.com/fluidd-core/fluidd/commit/c5e3a0bbcc3daba17de8d8e7ebe7638d2b84c527))
* **FileSystem:** add crowsnest backup file filter ([#1332](https://github.com/fluidd-core/fluidd/issues/1332)) ([1a273dd](https://github.com/fluidd-core/fluidd/commit/1a273ddfcb3b53115d928305a22a4ec8f4bc88d4))
* **GcodePreview:** add option to hide part bounding box when printing a single part ([#1310](https://github.com/fluidd-core/fluidd/issues/1310)) ([8726577](https://github.com/fluidd-core/fluidd/commit/872657730848f4f2d7ed6f6a9ad428c1e687bd8e))
* **i18n-HU:** Update Hungarian translations ([#1291](https://github.com/fluidd-core/fluidd/issues/1291)) ([29067f6](https://github.com/fluidd-core/fluidd/commit/29067f6c6249ef75f33850c79b4e33513cb709f9))
* **i18n-SL:** Update Slovenian translations ([#1329](https://github.com/fluidd-core/fluidd/issues/1329)) ([c806cc2](https://github.com/fluidd-core/fluidd/commit/c806cc2f7be5ac0b1cb0ed0f7a80711dc43efaf6))
* improve confirmation messages ([#1339](https://github.com/fluidd-core/fluidd/issues/1339)) ([ff13f85](https://github.com/fluidd-core/fluidd/commit/ff13f85b3ff6ad72e1cbab61e92d539a4a36edf4))
* improve support for adaptive bedmeshes ([#1328](https://github.com/fluidd-core/fluidd/issues/1328)) ([447a340](https://github.com/fluidd-core/fluidd/commit/447a340fb00dae9ffa66ab93b1b5127ee318a905))
* improves status panel layout ([#1252](https://github.com/fluidd-core/fluidd/issues/1252)) ([9814881](https://github.com/fluidd-core/fluidd/commit/98148813fed82f7fbd37b41b93aec8a46f62959c))
* **spoolman:** allow selecting table columns in spool selection dialog ([#1338](https://github.com/fluidd-core/fluidd/issues/1338)) ([0c94cbf](https://github.com/fluidd-core/fluidd/commit/0c94cbfc40be3d28737b116cf5c1f83a12bd56c9))
* **spoolman:** handle v2 responses, improve connection error handling ([#1316](https://github.com/fluidd-core/fluidd/issues/1316)) ([cf69359](https://github.com/fluidd-core/fluidd/commit/cf69359b13d64ef8fb363af8769a1b952b78f6f5))
* **spoolman:** live update support ([#1301](https://github.com/fluidd-core/fluidd/issues/1301)) ([c6bcff8](https://github.com/fluidd-core/fluidd/commit/c6bcff8ecf6c3ebd0e71bb5be6ce2736b1f79401))
* **spoolman:** multi-tool support ([#1324](https://github.com/fluidd-core/fluidd/issues/1324)) ([a7f7622](https://github.com/fluidd-core/fluidd/commit/a7f7622f9fede91af990a7ec4ba85aee1abe3b09))
* **spoolman:** remember spool selection dialog sort key/order ([#1305](https://github.com/fluidd-core/fluidd/issues/1305)) ([3843701](https://github.com/fluidd-core/fluidd/commit/38437011f85b313ca754fe131f1f7507fca78194))


### Bug Fixes

* console warning when multiple update sources have warnings ([#1342](https://github.com/fluidd-core/fluidd/issues/1342)) ([3674479](https://github.com/fluidd-core/fluidd/commit/367447946ee617ea2ae42d0dc81e2583e9883bcc))
* correctly show the active root ([#1307](https://github.com/fluidd-core/fluidd/issues/1307)) ([ff0b120](https://github.com/fluidd-core/fluidd/commit/ff0b1204a828c44406cf3575f07254d5f8d3d6a4))
* default to user language as Intl format ([#1299](https://github.com/fluidd-core/fluidd/issues/1299)) ([fd6757e](https://github.com/fluidd-core/fluidd/commit/fd6757ec536eee1412657746f415fd9eac75e0f8))
* don't assume user is trusted when force_logins is turned off ([#1318](https://github.com/fluidd-core/fluidd/issues/1318)) ([b413fc2](https://github.com/fluidd-core/fluidd/commit/b413fc28f772f9e680fd1e653f862fe48a96f897))
* file browser filters list ([#1303](https://github.com/fluidd-core/fluidd/issues/1303)) ([ebfd5bc](https://github.com/fluidd-core/fluidd/commit/ebfd5bc224587dd7f2833784c110d8096336d6a8))
* file path on upload ([#1330](https://github.com/fluidd-core/fluidd/issues/1330)) ([1bb738a](https://github.com/fluidd-core/fluidd/commit/1bb738a9c152ef82ba4746bd95200f75f74c1213))
* **FileSystem:** folder upload ([9d85b71](https://github.com/fluidd-core/fluidd/commit/9d85b71dafdffeaeb2860dd5c415e7cbc22c1263))
* **i18n:** fix German typo ([#1344](https://github.com/fluidd-core/fluidd/issues/1344)) ([255b42e](https://github.com/fluidd-core/fluidd/commit/255b42ee286e46f270bce19691623c3fa138e5e9))
* ignore Authorization on login or token refresh ([#1321](https://github.com/fluidd-core/fluidd/issues/1321)) ([ef55129](https://github.com/fluidd-core/fluidd/commit/ef55129f4fd9a4a1b407322282b9cea34c839a4c))
* round OutputPin value ([#1345](https://github.com/fluidd-core/fluidd/issues/1345)) ([742598a](https://github.com/fluidd-core/fluidd/commit/742598accb3837170edfb5312127b8a09a7bbe22))
* **thermals:** size columns dynamically, disallow line breaks ([#1340](https://github.com/fluidd-core/fluidd/issues/1340)) ([ebe2966](https://github.com/fluidd-core/fluidd/commit/ebe2966316ffcef29a35ae60ab7c3a8f6953b463))

## [1.27.1](https://github.com/fluidd-core/fluidd/compare/v1.27.0...v1.27.1) (2023-12-23)


### Features

* add feature to filter moonraker backup files ([#1278](https://github.com/fluidd-core/fluidd/issues/1278)) ([66c8d20](https://github.com/fluidd-core/fluidd/commit/66c8d20cb1377ff867bb33f0d2c00593fa20c14b))
* adds help tooltips to File Browsers ([af48f3c](https://github.com/fluidd-core/fluidd/commit/af48f3c97e0d1013e4b34af93257df7b5844c4b3))
* highlight section in circle toolhead control ([99ef5b3](https://github.com/fluidd-core/fluidd/commit/99ef5b3efe1c71e89029246fbf5cd509e24900e4))
* new SVG assets for circle toolhead controls ([#1279](https://github.com/fluidd-core/fluidd/issues/1279)) ([62cd4c1](https://github.com/fluidd-core/fluidd/commit/62cd4c10530aef371de6f3b77450da97cf159e70))


### Bug Fixes

* corrects original source attributions ([#1276](https://github.com/fluidd-core/fluidd/issues/1276)) ([8ee1312](https://github.com/fluidd-core/fluidd/commit/8ee1312153adc1894c90f64589964741a54f8192))
* improves estimates calculation ([#1283](https://github.com/fluidd-core/fluidd/issues/1283)) ([822a274](https://github.com/fluidd-core/fluidd/commit/822a2748e63552d663d48ffbab800336b0ef1f8a))
* makes print cooling fan optional ([#1281](https://github.com/fluidd-core/fluidd/issues/1281)) ([de2d15c](https://github.com/fluidd-core/fluidd/commit/de2d15cccdba5292c6114815e136c83b2dfc94a7))
* reset default move distance when availables change ([#1287](https://github.com/fluidd-core/fluidd/issues/1287)) ([720d6b2](https://github.com/fluidd-core/fluidd/commit/720d6b2f45260c5c7b479d9d3183bfa830c4b69e))

## [1.27.0](https://github.com/fluidd-core/fluidd/compare/v1.26.3...v1.27.0) (2023-12-14)


### Features

* adds "gcode" Klipper module status support ([fee7afd](https://github.com/fluidd-core/fluidd/commit/fee7afd25acbf6ea77b8726056067e4dcc4f6a8e))
* adds dev container support ([#1264](https://github.com/fluidd-core/fluidd/issues/1264)) ([7c57a9e](https://github.com/fluidd-core/fluidd/commit/7c57a9e014d206386759e57279bf211ce23a5ca3))
* adds disclaimer to theme settings ([9411cb2](https://github.com/fluidd-core/fluidd/commit/9411cb2da70bcb17051ebb312b05a8902a079a3a))
* adds drag&drop across File Manager cards ([cf32644](https://github.com/fluidd-core/fluidd/commit/cf3264423a311d660759ee914a47ca2a8a11301f))
* adds minimum_cruise_ratio support ([#1260](https://github.com/fluidd-core/fluidd/issues/1260)) ([ea03875](https://github.com/fluidd-core/fluidd/commit/ea03875bc7bb64c28183cf6ffb1dc56135527617))
* adds new background logo ([999ccdd](https://github.com/fluidd-core/fluidd/commit/999ccddd1a39d6037ec6a8f34b689b0216ea592d))
* adds Prompt Dialog support ([#1262](https://github.com/fluidd-core/fluidd/issues/1262)) ([b5733d6](https://github.com/fluidd-core/fluidd/commit/b5733d6826a0b795304f53620147b2a147ce8adf))
* Adds toolhead circle style controls ([#1248](https://github.com/fluidd-core/fluidd/issues/1248)) ([77e2791](https://github.com/fluidd-core/fluidd/commit/77e2791637ac46bf7e69600e607f9567ceda521e))
* adds WebRTC (go2rtc) support ([#1245](https://github.com/fluidd-core/fluidd/issues/1245)) ([070cb45](https://github.com/fluidd-core/fluidd/commit/070cb45a06a7085cb61e38d3dc67bc39c558b4fc))
* copy bed mesh into clipboard as image ([#1272](https://github.com/fluidd-core/fluidd/issues/1272)) ([9b9b629](https://github.com/fluidd-core/fluidd/commit/9b9b629cf8d6b33189bc124ebb4e90f3f3a536cd))
* hide "motors off" if no steppers are enabled ([8196090](https://github.com/fluidd-core/fluidd/commit/81960902a14026cbca9278db49ceda4df901423f))
* highlight active tool ([#1263](https://github.com/fluidd-core/fluidd/issues/1263)) ([0792c67](https://github.com/fluidd-core/fluidd/commit/0792c67634fbc762ae1ef12d5d202bc144b8e79a))
* **i18n-HU:** Update Hungarian translations ([#1246](https://github.com/fluidd-core/fluidd/issues/1246)) ([306992a](https://github.com/fluidd-core/fluidd/commit/306992a19d0dcd3b4e248c2311b79f1f40f01996))
* **i18n-nl:** Update Dutch translations ([#1273](https://github.com/fluidd-core/fluidd/issues/1273)) ([c670678](https://github.com/fluidd-core/fluidd/commit/c670678b8c156e17409e6625654a19f1cf8ad19f))
* isolates File Browser settings ([a569cde](https://github.com/fluidd-core/fluidd/commit/a569cdef9e3547f791ffd73ff11da7b537013227))
* Peopoly theme ([#1256](https://github.com/fluidd-core/fluidd/issues/1256)) ([e9634cf](https://github.com/fluidd-core/fluidd/commit/e9634cf152556e49c38e3af4587281b45f915f85))
* Prusa theme ([#1267](https://github.com/fluidd-core/fluidd/issues/1267)) ([783efaf](https://github.com/fluidd-core/fluidd/commit/783efaf076a8cf41e429d56cd80048fa5a9bd612))
* Qidi Tech theme ([0b1c701](https://github.com/fluidd-core/fluidd/commit/0b1c701412c9497e357bae1584807af6ee3affa0))
* Siboor theme ([#1255](https://github.com/fluidd-core/fluidd/issues/1255)) ([c9d01b9](https://github.com/fluidd-core/fluidd/commit/c9d01b9d82e70f054137d59502682f5035c3a5ee))
* use full bed dimensions on bed mesh preview ([#1242](https://github.com/fluidd-core/fluidd/issues/1242)) ([128c296](https://github.com/fluidd-core/fluidd/commit/128c29638f1b8dacf8afd8b3859ea97cac056e30))


### Bug Fixes

* adds timeout to initial endpoint discovery ([043df78](https://github.com/fluidd-core/fluidd/commit/043df782a6ad663dc5b46523a1b61f3fdc58b701))
* allows G2/G3 arcs with only I or J parameter ([370cc42](https://github.com/fluidd-core/fluidd/commit/370cc420fd18248936d0d5bb138065fda68cae2c))
* allows toolhead circle style controls invertion ([33d1146](https://github.com/fluidd-core/fluidd/commit/33d1146727f74d929dd9a93207a8d6d5eef3788c))
* default camera urls missing slash terminator ([a2b23f4](https://github.com/fluidd-core/fluidd/commit/a2b23f483c9f0346421355aa89b7b444689dc604))
* disable console timestamps text wrap ([#1250](https://github.com/fluidd-core/fluidd/issues/1250)) ([6a88b73](https://github.com/fluidd-core/fluidd/commit/6a88b7304af34fd8a04bce4d7d965ff491149464))
* disable homing if not ready or printing ([c90e4ae](https://github.com/fluidd-core/fluidd/commit/c90e4ae79ae411e54ebcd6c9cc55dd62c4f7d9f3))
* exclude non-fluidd paths from service worker ([7a001dd](https://github.com/fluidd-core/fluidd/commit/7a001dd9a1866a7df0ef433ffe16f4f5031e3e4b))
* macro category settings dividers ([b9e29ed](https://github.com/fluidd-core/fluidd/commit/b9e29ed731ed9affc22d9fd7c822f6c90e5fa87f))
* macro settings dividers ([4561b85](https://github.com/fluidd-core/fluidd/commit/4561b8559952725bb3196fa6bf7d4487f01efa45))
* retry connection on WebRTC (go2rtc) ([#1257](https://github.com/fluidd-core/fluidd/issues/1257)) ([7d7433d](https://github.com/fluidd-core/fluidd/commit/7d7433da98e2d73bf9c64abe561dd2677f111783))
* **style:** use variables where appropriate ([7dcf21d](https://github.com/fluidd-core/fluidd/commit/7dcf21d61bb40641800e7dc3fad20b88756220c4))
* vuetify theme color overrides ([318fc32](https://github.com/fluidd-core/fluidd/commit/318fc32b665c05e66c41a589c7b676027c2c2576))

## [1.26.3](https://github.com/fluidd-core/fluidd/compare/v1.26.2...v1.26.3) (2023-11-14)


### Features

* **i18n-HU:** Update Hungarian translations ([#1233](https://github.com/fluidd-core/fluidd/issues/1233)) ([4323186](https://github.com/fluidd-core/fluidd/commit/432318610068b53cdd10a26ca4b1316017229fc0))


### Bug Fixes

* corrects order of e-charts dimensions ([#1235](https://github.com/fluidd-core/fluidd/issues/1235)) ([3331223](https://github.com/fluidd-core/fluidd/commit/33312238690225b920861f50f84d82e6d946f5a2))

## [1.26.2](https://github.com/fluidd-core/fluidd/compare/v1.26.1...v1.26.2) (2023-11-08)


### Features

* adds clean nozzle support ([5ee8026](https://github.com/fluidd-core/fluidd/commit/5ee80266c27e6348a7e55a5889f5f7a02a0d1417))
* adds gcode comments folding support ([a760fb1](https://github.com/fluidd-core/fluidd/commit/a760fb1305e888c1be8664b946c2d9b87071a3e6))
* adds Multiply context menu item to Job Queue ([#1213](https://github.com/fluidd-core/fluidd/issues/1213)) ([300f293](https://github.com/fluidd-core/fluidd/commit/300f29373441338440cd13bf2781cd5ff937064a))
* adds new Screws Tilt Adjust helper dialog ([#1223](https://github.com/fluidd-core/fluidd/issues/1223)) ([0b2e197](https://github.com/fluidd-core/fluidd/commit/0b2e197e43ad5daca819fc83fc1b905458f156c6))
* adds origin to GcodePreview ([#1230](https://github.com/fluidd-core/fluidd/issues/1230)) ([9628f66](https://github.com/fluidd-core/fluidd/commit/9628f665d817f9a31d4a92d0680f3d87708182e7))
* adds Update Manager warnings and anomalies support ([#1215](https://github.com/fluidd-core/fluidd/issues/1215)) ([9d02cbf](https://github.com/fluidd-core/fluidd/commit/9d02cbfafd49e637ac163c27b46d8546501ee03a))
* hide extruder controls if none defined ([0844424](https://github.com/fluidd-core/fluidd/commit/08444242c0aafc8c9b3b29ad26325677df1c0d7e))
* hide temperature card in no heaters or sensors ([7c48275](https://github.com/fluidd-core/fluidd/commit/7c482755c48cf577d580fcc638796dcf58ef7061))
* ignore pending config changes in custom sections ([#1217](https://github.com/fluidd-core/fluidd/issues/1217)) ([bf2bbf5](https://github.com/fluidd-core/fluidd/commit/bf2bbf51c39ba977f74deb4591483eda9491dd17))
* improves Gcode Preview delta support ([5dbdd76](https://github.com/fluidd-core/fluidd/commit/5dbdd76d81b39e3709315a3220c4837ee7f52dc4))
* improves Timelapse Custom Parking delta support ([d0e9a5f](https://github.com/fluidd-core/fluidd/commit/d0e9a5f323f47bc752230792fd888c4fb420cfc7))
* LDO theme ([#1225](https://github.com/fluidd-core/fluidd/issues/1225)) ([a24dc03](https://github.com/fluidd-core/fluidd/commit/a24dc0353c611bd8c2f829e8005966719abcedaf))


### Bug Fixes

* mitigates echarts warning on bed mesh page ([fb9a46c](https://github.com/fluidd-core/fluidd/commit/fb9a46ce0de9ef465a3a8127673e092fdae10c2c))
* mixed ISO / non-ISO date & time formats ([#1222](https://github.com/fluidd-core/fluidd/issues/1222)) ([507d881](https://github.com/fluidd-core/fluidd/commit/507d881570799e41d8d9804387644c22f8e605a1))
* reverts nav drawer initialization ([6ce9bc0](https://github.com/fluidd-core/fluidd/commit/6ce9bc03d3adf8314df33b46b8fbeac43e2ebea1))
* **style:** pad navigation drawer bottom on mobile view ([#1232](https://github.com/fluidd-core/fluidd/issues/1232)) ([b72399e](https://github.com/fluidd-core/fluidd/commit/b72399e9995106e3c9400bcd90df24d66ea1bebc))

## [1.26.1](https://github.com/fluidd-core/fluidd/compare/v1.26.0...v1.26.1) (2023-10-19)


### Features

* full-screen file drag & drop ([a954be8](https://github.com/fluidd-core/fluidd/commit/a954be8b620f72d8d2c13f7b8603e053e0872c94))
* improves measurement units display ([e4f8256](https://github.com/fluidd-core/fluidd/commit/e4f825648e36953d3d9501ee078f3e0fddd1dedd))


### Bug Fixes

* correct path on full-screen file drag & drop ([bb5d686](https://github.com/fluidd-core/fluidd/commit/bb5d686ae6afbedf5c2d0e722f5ce818b64f690c))
* offline cache and init issues ([e9b418b](https://github.com/fluidd-core/fluidd/commit/e9b418bc83399a85b4ed3fda9383067d7f513d93))

## [1.26.0](https://github.com/fluidd-core/fluidd/compare/v1.25.3...v1.26.0) (2023-10-12)


### Features

* Added "calibrate" button to BedMeshCard ([#1182](https://github.com/fluidd-core/fluidd/issues/1182)) ([899c95c](https://github.com/fluidd-core/fluidd/commit/899c95c73d7257289315b191f48233a2bc37c206))
* adds gcode code folding support ([2efd03e](https://github.com/fluidd-core/fluidd/commit/2efd03e03a6b851fdf2af59288caf2cb57416e36))
* adds moonraker "route_prefix" support ([#1205](https://github.com/fluidd-core/fluidd/issues/1205)) ([b0fe01d](https://github.com/fluidd-core/fluidd/commit/b0fe01da268318d4251ec2447ada8e07aaf4aa3e))
* adds Moonraker sensor support ([#1196](https://github.com/fluidd-core/fluidd/issues/1196)) ([67e48bd](https://github.com/fluidd-core/fluidd/commit/67e48bd21c243fc3d7923ed3e4a37d755c937552))
* Adds toolhead bars style controls ([#1177](https://github.com/fluidd-core/fluidd/issues/1177)) ([9465a50](https://github.com/fluidd-core/fluidd/commit/9465a50d98b6cf0e4f9cfc53a074ca708d40703c))
* expands tool change support to commands ([#1197](https://github.com/fluidd-core/fluidd/issues/1197)) ([a17efec](https://github.com/fluidd-core/fluidd/commit/a17efec4a6101ff9fa205dc2e3c45f485634c693))
* hides Moonraker devices starting with "_" ([5c329e5](https://github.com/fluidd-core/fluidd/commit/5c329e5b8e4f6c139330205cbb969076c45a41e1))
* **i18n-HU:** Update Hungarian language ([#1201](https://github.com/fluidd-core/fluidd/issues/1201)) ([50ac181](https://github.com/fluidd-core/fluidd/commit/50ac1810e82537b62574a5529cd9cbface85ead2))
* **i18n-PL:** update Polish translations ([#1188](https://github.com/fluidd-core/fluidd/issues/1188)) ([733ed59](https://github.com/fluidd-core/fluidd/commit/733ed5939b50cb5daae5cc120be16937f7851980))
* **i18n-RU:** Update Russian translations ([#1179](https://github.com/fluidd-core/fluidd/issues/1179)) ([83fc652](https://github.com/fluidd-core/fluidd/commit/83fc65227326e992227f5d1ef99c2328ad0d59c1))
* **i18n-RU:** update Russian translations ([#1183](https://github.com/fluidd-core/fluidd/issues/1183)) ([ee16ea8](https://github.com/fluidd-core/fluidd/commit/ee16ea8c2c6be5ece464932b32541116b57bff08))
* improve drag & drop support ([#1204](https://github.com/fluidd-core/fluidd/issues/1204)) ([b860ca0](https://github.com/fluidd-core/fluidd/commit/b860ca09da5602c80fd353cfa70b5102994adff2))
* show all registered file system roots ([46a0a55](https://github.com/fluidd-core/fluidd/commit/46a0a55f130222b39c7c416c0c30006338f18fef))
* **spoolman:** allow toggling individual sanity check warnings ([#1186](https://github.com/fluidd-core/fluidd/issues/1186)) ([2086c19](https://github.com/fluidd-core/fluidd/commit/2086c19cd1f63c3a5563b9bd13c483f2ade134d6))
* use custom service worker ([d5c3b9a](https://github.com/fluidd-core/fluidd/commit/d5c3b9a654a5a862a856f4a2ae977f0f44c7f688))


### Bug Fixes

* adds support for public base path ([#1207](https://github.com/fluidd-core/fluidd/issues/1207)) ([7f0886d](https://github.com/fluidd-core/fluidd/commit/7f0886d7807c0e1882ef9f6ca073e75bfb087a9d))
* check if folder is writeable on file drop ([d53462e](https://github.com/fluidd-core/fluidd/commit/d53462e7d321d2219dbe4abaefd3add39244b7a1))
* corrects full filename for print and metadata ([3dd3079](https://github.com/fluidd-core/fluidd/commit/3dd307964058c8eaadf9af43df41716103e6d5da))
* delta printers can only home all ([#1175](https://github.com/fluidd-core/fluidd/issues/1175)) ([ec0f56d](https://github.com/fluidd-core/fluidd/commit/ec0f56d3729e56e662298cef834fc592647ef224))
* ensures .git folders are excluded ([#1194](https://github.com/fluidd-core/fluidd/issues/1194)) ([2cee275](https://github.com/fluidd-core/fluidd/commit/2cee27500dba239b9daad4731b4b622d16174a98))
* file system filters reactivity ([5734323](https://github.com/fluidd-core/fluidd/commit/57343238ca425103f59e6cbe1fb8c1109d971be8))
* hide Power section if there are no devices ([e1f1a99](https://github.com/fluidd-core/fluidd/commit/e1f1a9966941419a0ae5c1918d6021588e047041))
* **i18n-EN:** fixes incorrect merge ([7713c5e](https://github.com/fluidd-core/fluidd/commit/7713c5eb1855c2ba753ffc1689c682e3865762d1))
* **i18n:** fixes incorrect merge ([e533388](https://github.com/fluidd-core/fluidd/commit/e533388409ddc985bea15b66dc23eea47dfd0402))
* remove moved paths from data store ([ba830f1](https://github.com/fluidd-core/fluidd/commit/ba830f14484b4b7968e8e5d071667e1c5c321752))

## [1.25.3](https://github.com/fluidd-core/fluidd/compare/v1.25.2...v1.25.3) (2023-09-10)


### Features

* **i18n-PL:** update Polish translations ([#1154](https://github.com/fluidd-core/fluidd/issues/1154)) ([8841557](https://github.com/fluidd-core/fluidd/commit/8841557a2abcae2f667655b3e6e9852d7361beed))
* **i18n-PL:** update Polish translations ([#1163](https://github.com/fluidd-core/fluidd/issues/1163)) ([0fedb66](https://github.com/fluidd-core/fluidd/commit/0fedb660358d780e49f819db8f4aeeb32ebba5dd))


### Bug Fixes

* adds more chart colors for sensors ([#1168](https://github.com/fluidd-core/fluidd/issues/1168)) ([273092d](https://github.com/fluidd-core/fluidd/commit/273092d450c2b0ea6f5ed4dbf8d41810f8c0a83d))
* always show Edit in File file browser ([0c1b576](https://github.com/fluidd-core/fluidd/commit/0c1b576c624decd9c510466b41c0db75800f1ed5))
* **i18n-DE:** Fix typo in german translation ([#1162](https://github.com/fluidd-core/fluidd/issues/1162)) ([4d96dee](https://github.com/fluidd-core/fluidd/commit/4d96dee037118eb05e2032f4ee76e757ef6a42d8))
* reset camera on change ([#1159](https://github.com/fluidd-core/fluidd/issues/1159)) ([4fe7c88](https://github.com/fluidd-core/fluidd/commit/4fe7c88ca64a644e95d8270c59650eed6db6b5eb))
* use full Klipper key for thermal data storage ([#1167](https://github.com/fluidd-core/fluidd/issues/1167)) ([849b7ca](https://github.com/fluidd-core/fluidd/commit/849b7cac41972d4a0e31f077aee2e175fa57fa45))

## [1.25.2](https://github.com/fluidd-core/fluidd/compare/v1.25.1...v1.25.2) (2023-08-16)


### Features

* **spoolman:** QR code scanning support ([#1149](https://github.com/fluidd-core/fluidd/issues/1149)) ([5b6a44e](https://github.com/fluidd-core/fluidd/commit/5b6a44e30b7dff3d1425beb7fe358e68c8134c14))


### Bug Fixes

* ignore crossorigin in cameras by default ([#1152](https://github.com/fluidd-core/fluidd/issues/1152)) ([6e57724](https://github.com/fluidd-core/fluidd/commit/6e577243e6d25cf8a848a7b64202d395c4266d41))

## [1.25.1](https://github.com/fluidd-core/fluidd/compare/v1.25.0...v1.25.1) (2023-08-11)


### Features

* add material type column to Spoolman dialog ([#1146](https://github.com/fluidd-core/fluidd/issues/1146)) ([c2b90bd](https://github.com/fluidd-core/fluidd/commit/c2b90bdad0ab5a00470bb6de8ca096ef49b7cc93))
* allow Viewer in all file browsers ([8d2fdb5](https://github.com/fluidd-core/fluidd/commit/8d2fdb5306593ff9c17a9caf6fbf5050ef1576a1))
* **i18n-PL:** update Polish translations ([#1135](https://github.com/fluidd-core/fluidd/issues/1135)) ([20f620a](https://github.com/fluidd-core/fluidd/commit/20f620a6ef935ec23a045afa68f6d58b7dd58c91))


### Bug Fixes

* ignore null on thermal change calculation ([#1139](https://github.com/fluidd-core/fluidd/issues/1139)) ([ee6579b](https://github.com/fluidd-core/fluidd/commit/ee6579b8ca857bc57ea80df75b5ff669447d4942))
* remove obsolete check to create directory ([#1141](https://github.com/fluidd-core/fluidd/issues/1141)) ([58fd9c7](https://github.com/fluidd-core/fluidd/commit/58fd9c781a0f66d80f60c033c801a0ea71bc03b9))
* use current origin for relative camera URLs ([#1145](https://github.com/fluidd-core/fluidd/issues/1145)) ([be693c3](https://github.com/fluidd-core/fluidd/commit/be693c3b1b4bc419d63e803b950bd43c09d088d9))

## [1.25.0](https://github.com/fluidd-core/fluidd/compare/v1.24.2...v1.25.0) (2023-08-06)


### Features

* adds TMC2240 support ([#1133](https://github.com/fluidd-core/fluidd/issues/1133)) ([68b6183](https://github.com/fluidd-core/fluidd/commit/68b61838aa8216b1285451b4fb51d5aed1c2f12f))
* hide host controls when running on container ([253a9e2](https://github.com/fluidd-core/fluidd/commit/253a9e2dd83d4ab13f65048e2d82852c3d566872))
* **i18n-AF:** New Afrikaans locale added ([#1125](https://github.com/fluidd-core/fluidd/issues/1125)) ([4a4e8f6](https://github.com/fluidd-core/fluidd/commit/4a4e8f6e3052d4087c90abf6e02ed481abf57b38))
* **i18n-HU:** Update Hungarian translations ([#1134](https://github.com/fluidd-core/fluidd/issues/1134)) ([dc952ea](https://github.com/fluidd-core/fluidd/commit/dc952eaa71b0cf71a732fc7a4db340f890fd18fb))
* **i18n-PL:** update Polish translations ([#1130](https://github.com/fluidd-core/fluidd/issues/1130)) ([64ea241](https://github.com/fluidd-core/fluidd/commit/64ea241dd52a4a10d18886115694a12969c4971c))
* split camera stream and snapshot urls ([6d095b0](https://github.com/fluidd-core/fluidd/commit/6d095b0cc50fb22d0ac39b7b028646d39ef97121))
* spoolman support ([#1119](https://github.com/fluidd-core/fluidd/issues/1119)) ([7e7c8dc](https://github.com/fluidd-core/fluidd/commit/7e7c8dcc2b627695992b015283feea040c871bff))
* use overlays for file download and parse ([e28a958](https://github.com/fluidd-core/fluidd/commit/e28a958f77198b94947720bae3135a42b4e46180))

## [1.24.2](https://github.com/fluidd-core/fluidd/compare/v1.24.1...v1.24.2) (2023-07-26)


### Features

* adds Tool Changer controls ([#1111](https://github.com/fluidd-core/fluidd/issues/1111)) ([a7509e7](https://github.com/fluidd-core/fluidd/commit/a7509e763f91927d8afc29c6b13b7fee289ed655))
* adds WebRTC trickle ICE support ([aa9e79c](https://github.com/fluidd-core/fluidd/commit/aa9e79c1180961a12e7e9a5b1b0cc282a2d8d200))
* file metadata refresh ([7913e0c](https://github.com/fluidd-core/fluidd/commit/7913e0c1535ed52c3c033a61d225c18cdf7ca4e5))
* **i18n-HU:** Update Hungarian Language ([#1121](https://github.com/fluidd-core/fluidd/issues/1121)) ([d1812aa](https://github.com/fluidd-core/fluidd/commit/d1812aa31c5ac1b0125d114381d84a3206ea66d9))
* **i18n-PL:** adds Polish translations ([#1112](https://github.com/fluidd-core/fluidd/issues/1112)) ([491e863](https://github.com/fluidd-core/fluidd/commit/491e86369f0566a793e3f404a0a5119cb163ee0c))
* **i18n-PL:** update Polish translations ([#1116](https://github.com/fluidd-core/fluidd/issues/1116)) ([2c5a59e](https://github.com/fluidd-core/fluidd/commit/2c5a59e401fe34ec69d34c34086fcdaffb9fca62))
* **i18n-PL:** update Polish translations ([#1126](https://github.com/fluidd-core/fluidd/issues/1126)) ([3828b8a](https://github.com/fluidd-core/fluidd/commit/3828b8a1b40ad466df682b580a93ba5061fc7a2c))
* improves File Editor state indicators ([39bbe7d](https://github.com/fluidd-core/fluidd/commit/39bbe7dab144ec8f6222d0acf5109f521f93e111))
* Kingroon theme ([#1109](https://github.com/fluidd-core/fluidd/issues/1109)) ([a88e6df](https://github.com/fluidd-core/fluidd/commit/a88e6df9c90b19c288cb661bd529b49109a3ef5e))
* sanitize HTML in console ([99ed4ea](https://github.com/fluidd-core/fluidd/commit/99ed4ea7b3ae2114f6732ece852461c2b78a803b))
* show/hide objects on GcodePreview ([a00c1f7](https://github.com/fluidd-core/fluidd/commit/a00c1f738b63c37507136a2e49047f00456e7243))


### Bug Fixes

* adds missing metadata refresh code ([5528e74](https://github.com/fluidd-core/fluidd/commit/5528e74540ee3f702639e89ba0c574f116c201c4))
* check for files on item dragging ([31028a2](https://github.com/fluidd-core/fluidd/commit/31028a28095b62b084816c4b39d0ad032290c44d))
* don't show gcode load dialog if canceled ([#1128](https://github.com/fluidd-core/fluidd/issues/1128)) ([080bb46](https://github.com/fluidd-core/fluidd/commit/080bb461d150ebe17ce004b55ac19eb2ad9fc210))

## [1.24.1](https://github.com/fluidd-core/fluidd/compare/v1.24.0...v1.24.1) (2023-06-08)


### Features

* adds sonar service mapping ([e86d389](https://github.com/fluidd-core/fluidd/commit/e86d38912adeafe8c9c2208b2a8c99dd61668358))
* adds WebRTC (camera-streamer) support ([#1107](https://github.com/fluidd-core/fluidd/issues/1107)) ([1e42ca8](https://github.com/fluidd-core/fluidd/commit/1e42ca8037cffd7e0c5327f407fe1ed3201f2cf1))
* crowsnest config support ([9a91182](https://github.com/fluidd-core/fluidd/commit/9a911822488a6830c8f878510b53267ae47dbcaf))
* file editor content changes indicator ([7655f53](https://github.com/fluidd-core/fluidd/commit/7655f53a1b420c4d55ec6a63a93a2be8d557a1c0))
* **i18n-RU:** Update Russian translations ([#1108](https://github.com/fluidd-core/fluidd/issues/1108)) ([f060315](https://github.com/fluidd-core/fluidd/commit/f060315233e2792ccdaf84ab95d1d73c5c3bea6e))
* **i18n-zh-CN:** Update Chinese translation ([#1106](https://github.com/fluidd-core/fluidd/issues/1106)) ([220057f](https://github.com/fluidd-core/fluidd/commit/220057fe2a4a00c2bae7001e608bfd89eb850914))
* save file editor content with Ctrl+S ([d490a5b](https://github.com/fluidd-core/fluidd/commit/d490a5b19a0f9673a0bdd145f830a23b52aea72d))
* show read-only folders as such ([1ac93a3](https://github.com/fluidd-core/fluidd/commit/1ac93a35275d9ad81c70a0c191623b4691c7f7a2))

## [1.24.0](https://github.com/fluidd-core/fluidd/compare/v1.23.5...v1.24.0) (2023-05-14)


### Features

* allow ignoring default bed mesh pending configuration changes ([cd1a84a](https://github.com/fluidd-core/fluidd/commit/cd1a84a639f9b76c99f3c8ae6abfdc58b15a65b2))
* duplicate file or directory ([1cf08c1](https://github.com/fluidd-core/fluidd/commit/1cf08c11e306da2e8fa7c54809339865379f5b83))
* **i18n-JA:** update Japanese language ([#1098](https://github.com/fluidd-core/fluidd/issues/1098)) ([e9e4559](https://github.com/fluidd-core/fluidd/commit/e9e4559a9f60314526875fd96c2a8290f7978998))
* **i18n-SL:** adds Slovenian translations ([#1088](https://github.com/fluidd-core/fluidd/issues/1088)) ([3d5daf3](https://github.com/fluidd-core/fluidd/commit/3d5daf3f5266d49ba40915d17d9a8a1b93285306))
* save and restore editor view state ([#1099](https://github.com/fluidd-core/fluidd/issues/1099)) ([e0ce11d](https://github.com/fluidd-core/fluidd/commit/e0ce11db3a9b8c4216664b7b12243c34d49a3ddc))
* update Moonraker webcams API ([f0986e4](https://github.com/fluidd-core/fluidd/commit/f0986e4b70719f4e154e3fef6ad8f4052a696c31))


### Bug Fixes

* adds missing File Browser button tooltips ([#1094](https://github.com/fluidd-core/fluidd/issues/1094)) ([44d94e6](https://github.com/fluidd-core/fluidd/commit/44d94e65de77e9d3e273b3a86ffd64727b624ea6))
* allow ignoring min_extrude_temp for load/unload filament macros ([#1096](https://github.com/fluidd-core/fluidd/issues/1096)) ([d14fa81](https://github.com/fluidd-core/fluidd/commit/d14fa81d779a87bf1828401b007fbbcdd8f3d5d0))
* hide context menu for read-only folders ([7e7c957](https://github.com/fluidd-core/fluidd/commit/7e7c957c5d62c4dee4d700e5c78f00d3ef306ec4))
* more selective keyboard events for history navigation ([#1101](https://github.com/fluidd-core/fluidd/issues/1101)) ([fdddac1](https://github.com/fluidd-core/fluidd/commit/fdddac12dc0728fcb9af6037196d6c503274d094))

## [1.23.5](https://github.com/fluidd-core/fluidd/compare/v1.23.4...v1.23.5) (2023-04-20)


### Features

* adds AHT10 sensor support ([7f72b75](https://github.com/fluidd-core/fluidd/commit/7f72b75641664a4d6a4d2627a7911d332787199e))
* adds load/unload filament support ([#1079](https://github.com/fluidd-core/fluidd/issues/1079)) ([49ab223](https://github.com/fluidd-core/fluidd/commit/49ab223e1693b456363cf8cf5585a323b03182d8))
* BTT theme ([#1078](https://github.com/fluidd-core/fluidd/issues/1078)) ([8ccce66](https://github.com/fluidd-core/fluidd/commit/8ccce66aa0e0511b91b0b6fa400bcc124fd97ca6))
* extruder stepper reset extruder ([66339c5](https://github.com/fluidd-core/fluidd/commit/66339c5c4e0ec5204991362331b5b3fa1174b199))
* filter hidden folders as well as files ([#1083](https://github.com/fluidd-core/fluidd/issues/1083)) ([13e7394](https://github.com/fluidd-core/fluidd/commit/13e7394ba37f3cc2c79f530c3b66324a12f06260))
* filter rolled log files ([eaae433](https://github.com/fluidd-core/fluidd/commit/eaae433fffb914bbc7dd74db903686199b53b4f9))
* improves file system loading indicators ([7bd82a1](https://github.com/fluidd-core/fluidd/commit/7bd82a1e48dfa8d2711d41d6607970c4ed33c819))
* show read-only files as such ([65966e2](https://github.com/fluidd-core/fluidd/commit/65966e2b1d5f66f2884fc3f9d5268672d49e3b8b))


### Bug Fixes

* allow applying z-offset to endstop or probe ([#1086](https://github.com/fluidd-core/fluidd/issues/1086)) ([19809d2](https://github.com/fluidd-core/fluidd/commit/19809d21ff7a82d608291d5fb844ec6f6531bd45))
* linear file progress for file in sub-folder ([714ded6](https://github.com/fluidd-core/fluidd/commit/714ded6e833e0b6210965358354e6b8bcfb84d22))
* mcu_awake is a percentage ([3a844da](https://github.com/fluidd-core/fluidd/commit/3a844daddc76a962d068b0fed0620b0a7ebcf2c2))

## [1.23.4](https://github.com/fluidd-core/fluidd/compare/v1.23.3...v1.23.4) (2023-03-27)


### Features

* adds Go To File dialog ([#1077](https://github.com/fluidd-core/fluidd/issues/1077)) ([a6ff766](https://github.com/fluidd-core/fluidd/commit/a6ff766cb79d5556c6d7f8488457b58284948048))
* adds new Tools menu to Tool card ([#1071](https://github.com/fluidd-core/fluidd/issues/1071)) ([835f658](https://github.com/fluidd-core/fluidd/commit/835f658877d4d79c9f586be4cbd298a44f60c51c))
* **i18n-zh-HK:** update Traditional Chinese translations ([#1072](https://github.com/fluidd-core/fluidd/issues/1072)) ([fa56a5b](https://github.com/fluidd-core/fluidd/commit/fa56a5b874865b2e7221bcc714bad588fc17e26e))


### Bug Fixes

* **18n-RU:** typo in RU locale ([#1064](https://github.com/fluidd-core/fluidd/issues/1064)) ([6a8f9ca](https://github.com/fluidd-core/fluidd/commit/6a8f9caf48fbf3ec8e50d7432fdcd9a27b81f484))
* add API check before doing job queue reset ([#1074](https://github.com/fluidd-core/fluidd/issues/1074)) ([475a92f](https://github.com/fluidd-core/fluidd/commit/475a92f4e9b69b868bcd2996c19d73bf11abea30))
* add legacy bed mesh profiles from config ([#1076](https://github.com/fluidd-core/fluidd/issues/1076)) ([66fb72f](https://github.com/fluidd-core/fluidd/commit/66fb72fa0bd7c0265a2522f7fce9be56b2d1134a))
* assume untrusted user before config receival ([#1065](https://github.com/fluidd-core/fluidd/issues/1065)) ([f454b9d](https://github.com/fluidd-core/fluidd/commit/f454b9d667e64827ae1d55a64e6701043bdde72b))
* improves nginx 502 error handling ([3b6b9e0](https://github.com/fluidd-core/fluidd/commit/3b6b9e02178484d1e9b435b17d7754e0c3f04f32))
* include extra sensor data on temperature_fan ([#1067](https://github.com/fluidd-core/fluidd/issues/1067)) ([e39d835](https://github.com/fluidd-core/fluidd/commit/e39d835f9830396cb05cfc14bdcb38d7ec81bbcf))
* only add parts with defined polygon ([#1069](https://github.com/fluidd-core/fluidd/issues/1069)) ([aad8199](https://github.com/fluidd-core/fluidd/commit/aad81999ade700c5d85144cdbe81903883501639))

## [1.23.3](https://github.com/fluidd-core/fluidd/compare/v1.23.2...v1.23.3) (2023-03-12)


### Features

* adds filters to gcodes and timelapse roots ([#1060](https://github.com/fluidd-core/fluidd/issues/1060)) ([95e6e59](https://github.com/fluidd-core/fluidd/commit/95e6e591b44dea43f7a54ae4ba3e05cb5c4b1ba4))
* adds HLS camera stream support ([#1047](https://github.com/fluidd-core/fluidd/issues/1047)) ([57f37ef](https://github.com/fluidd-core/fluidd/commit/57f37efe707da239002c63993533e03c8cdc697f))
* adds logs rollover support ([#1051](https://github.com/fluidd-core/fluidd/issues/1051)) ([2f340a1](https://github.com/fluidd-core/fluidd/commit/2f340a126552f4fa93f19b71dacce82ad8013754))
* adds Pause at Layer support ([#1052](https://github.com/fluidd-core/fluidd/issues/1052)) ([c1e77c0](https://github.com/fluidd-core/fluidd/commit/c1e77c064a972613c5e278d607feb873448fef4f))
* adds toggle for gas resistance ([#1057](https://github.com/fluidd-core/fluidd/issues/1057)) ([52f5265](https://github.com/fluidd-core/fluidd/commit/52f5265598b039249c76311d3ce9f25cbe66bfc3))
* **i18n-UK:** update Ukrainian translations ([#1048](https://github.com/fluidd-core/fluidd/issues/1048)) ([0de47bc](https://github.com/fluidd-core/fluidd/commit/0de47bcf30de6fc33cd34221efd1d9a08538b6ba))
* live printing bed mesh changes ([#1056](https://github.com/fluidd-core/fluidd/issues/1056)) ([e88e783](https://github.com/fluidd-core/fluidd/commit/e88e78330e526300e961ef5b8ae97e7ded3003b6))
* make context menus selection aware ([58e9033](https://github.com/fluidd-core/fluidd/commit/58e90336a85aff311d685e0e66a0f2b912f6530c))
* show parts on Gcode Previewer ([#1046](https://github.com/fluidd-core/fluidd/issues/1046)) ([d1a347f](https://github.com/fluidd-core/fluidd/commit/d1a347f69360f9503b4e2d0c2e6ae0f64af562a0))


### Bug Fixes

* **diagnostics:** fix card icon selection ([#1055](https://github.com/fluidd-core/fluidd/issues/1055)) ([dfbfefe](https://github.com/fluidd-core/fluidd/commit/dfbfefe4a1906a3e208bbfce999fdd230b93b29d))
* disable AppNamedSlider reset button if loading ([2a1f4e8](https://github.com/fluidd-core/fluidd/commit/2a1f4e8e4853ba9e54bd7418e43dd53c4733a97d))
* force validation if active extruder changed ([ff36433](https://github.com/fluidd-core/fluidd/commit/ff36433d44461ec709982e5f41a18a27239238da))
* initial state of GcodePreviewCard ([07e3eb1](https://github.com/fluidd-core/fluidd/commit/07e3eb18b8e821e5c140e4e041d97e4fd1a2451b))
* multi-file selection and drag ([7328b3f](https://github.com/fluidd-core/fluidd/commit/7328b3f9fbe99305bb0ae4624fc3f87e8733f650))
* show deleted sections on PendingChangesDialog ([4ac3a9f](https://github.com/fluidd-core/fluidd/commit/4ac3a9f8b1ac96631950e6cb74ffd6de6c68e7aa))
* use Lithuanian "lt" for ISO-8601 formats ([#1061](https://github.com/fluidd-core/fluidd/issues/1061)) ([5602bcc](https://github.com/fluidd-core/fluidd/commit/5602bcce037a7e237f9e1b3205f7806ee33be0c6))

## [1.23.2](https://github.com/fluidd-core/fluidd/compare/v1.23.1...v1.23.2) (2023-02-20)


### Features

* Add support for gcode viewing on plotter-style devices ([#1025](https://github.com/fluidd-core/fluidd/issues/1025)) ([7d99259](https://github.com/fluidd-core/fluidd/commit/7d99259ee8d2b38f43875ba2bbdb27c26a7705ce))
* Adds network and virtualization info ([a053dc3](https://github.com/fluidd-core/fluidd/commit/a053dc3a5740085e28f35cd674085b5f2042a9e7))
* adds support for extruder stepper enable ([#1039](https://github.com/fluidd-core/fluidd/issues/1039)) ([10bd04c](https://github.com/fluidd-core/fluidd/commit/10bd04c46881f5a87ed43d1c708901284ffb0005))
* allow ordering of gcode macros ([#1041](https://github.com/fluidd-core/fluidd/issues/1041)) ([03f01d7](https://github.com/fluidd-core/fluidd/commit/03f01d7a7892cd9c0e288a292a2b2ff84dcb6e27))
* dragging jobs to job queue ([#1037](https://github.com/fluidd-core/fluidd/issues/1037)) ([0ad8aa3](https://github.com/fluidd-core/fluidd/commit/0ad8aa3d6548eba5ede1dd9fd87bf62732cac167))
* extruder selection for each extruder stepper ([#1034](https://github.com/fluidd-core/fluidd/issues/1034)) ([02169d9](https://github.com/fluidd-core/fluidd/commit/02169d92a61b7798193fa5cc9bcd63137b0bbd85))
* **i18n-HU:** Hungarian language update ([#1043](https://github.com/fluidd-core/fluidd/issues/1043)) ([7ec591f](https://github.com/fluidd-core/fluidd/commit/7ec591fbf15ced580253ddb622a4355ca92175f7))
* **i18n-zh:** updates Chinese translations ([#1026](https://github.com/fluidd-core/fluidd/issues/1026)) ([99f1f4b](https://github.com/fluidd-core/fluidd/commit/99f1f4be712fdac270e6fdeb7bb2d713524d4ea1))
* machine.update.refresh endpoint support ([1302f3a](https://github.com/fluidd-core/fluidd/commit/1302f3a183cd52436c96e2a3a0f1ac267e2ad4ad))
* make file download dialog component independent from parent ([#1033](https://github.com/fluidd-core/fluidd/issues/1033)) ([f98f7cf](https://github.com/fluidd-core/fluidd/commit/f98f7cf67f88fc9e94147466a134bd48f26ff9e7))
* Pressure Advance per extruder stepper ([#1022](https://github.com/fluidd-core/fluidd/issues/1022)) ([aa7007a](https://github.com/fluidd-core/fluidd/commit/aa7007ae698996f9765d56d25c11084063d0feaf))
* setting to disable automatic gcode loading on mobile ([#1028](https://github.com/fluidd-core/fluidd/issues/1028)) ([afcff8f](https://github.com/fluidd-core/fluidd/commit/afcff8f8278501136b6a67e1f8eabac304fd22c2))
* **timelapse:** add new park positions ([#1035](https://github.com/fluidd-core/fluidd/issues/1035)) ([2b30418](https://github.com/fluidd-core/fluidd/commit/2b3041846ea58446260509d2bfa6227a0489d30b)), closes [mainsail-crew/moonraker-timelapse#96](https://github.com/mainsail-crew/moonraker-timelapse/issues/96)
* try parsing layer info directly from g-code ([#1031](https://github.com/fluidd-core/fluidd/issues/1031)) ([cc323b8](https://github.com/fluidd-core/fluidd/commit/cc323b88ce576595f92deee2e2d0d53e153186b2))
* updated tool extrusion settings to respect printer config ([#1038](https://github.com/fluidd-core/fluidd/issues/1038)) ([2d124cb](https://github.com/fluidd-core/fluidd/commit/2d124cb2159c9a114a10840a9a51834c47a69acd))


### Bug Fixes

* AppSlider max changes not applied ([a1bd625](https://github.com/fluidd-core/fluidd/commit/a1bd6257e96878377a18a709c15150b20f73aba4))
* don't show context menu for ".." item ([737bc0a](https://github.com/fluidd-core/fluidd/commit/737bc0a00b4b1c9900bcb36d7e40e832bb90d20f))
* encode all request paths ([#1024](https://github.com/fluidd-core/fluidd/issues/1024)) ([f84a7fe](https://github.com/fluidd-core/fluidd/commit/f84a7fe5d4debb92a946b7a37981d25e23cc3def))
* hide header of empty power devices lists ([2ef8b43](https://github.com/fluidd-core/fluidd/commit/2ef8b433032ac05f69dfd4b2b636f68ca765d0f2))
* more Moonraker modules reset on socket close ([23047c0](https://github.com/fluidd-core/fluidd/commit/23047c0f90be66a99caf623fdcea78501087cadf))

## [1.23.1](https://github.com/fluidd-core/fluidd/compare/v1.23.0...v1.23.1) (2023-01-30)


### Features

* Add all endpoints in config as printer instances ([#1006](https://github.com/fluidd-core/fluidd/issues/1006)) ([03185c5](https://github.com/fluidd-core/fluidd/commit/03185c5ccc0c7057908c3fca15159f4fce06e4a7))
* adds support to create ZIP archives ([#1007](https://github.com/fluidd-core/fluidd/issues/1007)) ([9d8d36b](https://github.com/fluidd-core/fluidd/commit/9d8d36bdfdc214389a1095d652e6abbc087f55a7))
* allow sorting text by version or prefix number ([#1013](https://github.com/fluidd-core/fluidd/issues/1013)) ([85c214e](https://github.com/fluidd-core/fluidd/commit/85c214e381717d892cd822ac23eaa3734c33af90))
* complete folder upload ([#1015](https://github.com/fluidd-core/fluidd/issues/1015)) ([30df5ec](https://github.com/fluidd-core/fluidd/commit/30df5ec3b51e88d13d129c7b3e67824b1135ad1b))
* show live speed while printing ([#1019](https://github.com/fluidd-core/fluidd/issues/1019)) ([414bb03](https://github.com/fluidd-core/fluidd/commit/414bb031f63a329824427169b4d0b09feefab5b1))
* **ui:** hide blank fields in Disk Info card ([95bff0e](https://github.com/fluidd-core/fluidd/commit/95bff0e63d834a8565b48bd084e377fa830dc9d3))
* **ui:** show content of release_info ([#1016](https://github.com/fluidd-core/fluidd/issues/1016)) ([23d3a0c](https://github.com/fluidd-core/fluidd/commit/23d3a0c3e41718c47a8b54319e6b03b1b544bd1a))


### Bug Fixes

* always show Preview Gcode in context menu ([55eb71b](https://github.com/fluidd-core/fluidd/commit/55eb71b2e0c9565d08785ab1227b983da33274a2))
* disable temperature targets if Klipper not ready ([83bcf1e](https://github.com/fluidd-core/fluidd/commit/83bcf1e680d55074666c1096c7938265bad7c042))
* hide extrusion estimations if printing ([9aac206](https://github.com/fluidd-core/fluidd/commit/9aac20690b05058320d5244b3879f460c493abe4))
* hide system controls if socket disconnected ([eafcf4f](https://github.com/fluidd-core/fluidd/commit/eafcf4ff351ccf4cae237be8835d04ad622938fb))
* mitigates console error from race condition ([a0ed423](https://github.com/fluidd-core/fluidd/commit/a0ed423705292d213192e12b65fa63529d414767))
* total memory is always kB (1024 bytes based) ([7d510de](https://github.com/fluidd-core/fluidd/commit/7d510de56366a4dd2e5b86968df7c0f2e1833314))

## [1.23.0](https://github.com/fluidd-core/fluidd/compare/v1.22.2...v1.23.0) (2023-01-07)


### Features

* adds Moonraker Job Queue Support ([#448](https://github.com/fluidd-core/fluidd/issues/448)) ([6cd1227](https://github.com/fluidd-core/fluidd/commit/6cd1227ba1d4be24c14bf226bf1ebfaa7f17a41c))
* adds PWA shortcuts ([c278f8d](https://github.com/fluidd-core/fluidd/commit/c278f8d82a1e027f3694d6ff8d7b2171068c559d))
* allow Fluidd to run fully offline ([#986](https://github.com/fluidd-core/fluidd/issues/986)) ([e91af48](https://github.com/fluidd-core/fluidd/commit/e91af487919a2d3f8d3f96c954ad08c975fb1106))
* fullscreen Gcode Preview ([#999](https://github.com/fluidd-core/fluidd/issues/999)) ([decf161](https://github.com/fluidd-core/fluidd/commit/decf1611f1ac8b5a7048bbc8055d74272f395de4))
* **i18n-JA:** update Japanese language ([#988](https://github.com/fluidd-core/fluidd/issues/988)) ([281cb06](https://github.com/fluidd-core/fluidd/commit/281cb069d0cf97fde69a0c6eedff992609cf5f8d))
* show notifications count on app badge ([16fd9ef](https://github.com/fluidd-core/fluidd/commit/16fd9efb6a5e4937e17c5ff8178f2870adb2b74e))


### Bug Fixes

* check type when filtering prefixed sensors ([#991](https://github.com/fluidd-core/fluidd/issues/991)) ([920d817](https://github.com/fluidd-core/fluidd/commit/920d8176ceaf51e1b04f7b09ff14e54d199d494a))
* derive estimated max speed from stadium area ([a33732d](https://github.com/fluidd-core/fluidd/commit/a33732d3e30cc04e400617b13517f95f87a141c5))
* fallback to icon when history thumbnail fails ([#997](https://github.com/fluidd-core/fluidd/issues/997)) ([d2b6da2](https://github.com/fluidd-core/fluidd/commit/d2b6da2f83fb775bd5e9a92fdbda2521282ee047))
* mitigates Vuetify bug filtering items ahead ([#992](https://github.com/fluidd-core/fluidd/issues/992)) ([7e477ee](https://github.com/fluidd-core/fluidd/commit/7e477eeede536a8e160cd16bf15b5b9a82a7a977))
* only validate enabled fields in PresetDialog ([#995](https://github.com/fluidd-core/fluidd/issues/995)) ([a4aeb2e](https://github.com/fluidd-core/fluidd/commit/a4aeb2e092a47679cb9abed0969f570ec21d2684))
* sets maximum notifications lines to 5 ([#1002](https://github.com/fluidd-core/fluidd/issues/1002)) ([6dba642](https://github.com/fluidd-core/fluidd/commit/6dba642f0347b3a8aa2d2f84c30da5264b7a8f08))
* skip init if not connected and authenticated ([ff50e72](https://github.com/fluidd-core/fluidd/commit/ff50e72b17089f702b23f212d4895c4e57e5d7f1))

## [1.22.2](https://github.com/fluidd-core/fluidd/compare/v1.22.1...v1.22.2) (2022-12-19)


### Features

* adds Upload and Print button to AppBar ([#974](https://github.com/fluidd-core/fluidd/issues/974)) ([7c64799](https://github.com/fluidd-core/fluidd/commit/7c64799a2db3ff25233e95ac11028cbb2f31ead6))
* **i18n-HU:** update Hungarian language ([#982](https://github.com/fluidd-core/fluidd/issues/982)) ([93c139a](https://github.com/fluidd-core/fluidd/commit/93c139acb89c18aea9c979f3fd87c5f5bb83e4c8))
* **i18n-RU:** Update Russian translations ([#979](https://github.com/fluidd-core/fluidd/issues/979)) ([638e33e](https://github.com/fluidd-core/fluidd/commit/638e33e4dcbba468369c056b85490eed779a5487))
* ignore all sensors starting with "_" ([0b981ee](https://github.com/fluidd-core/fluidd/commit/0b981ee2ddbac0605b4b7b448366dabec5ed054f))
* send macro commands on enter ([#981](https://github.com/fluidd-core/fluidd/issues/981)) ([322eaf2](https://github.com/fluidd-core/fluidd/commit/322eaf2eb19f132a3f1b64578b890ee8efa50772))


### Bug Fixes

* add moonraker routes to workbox.navigateFallbackDenylist ([#985](https://github.com/fluidd-core/fluidd/issues/985)) ([c16d5db](https://github.com/fluidd-core/fluidd/commit/c16d5db60859a4f1faae22d7284e37504e86145f))
* clone instead of directly changing state ([6557f1d](https://github.com/fluidd-core/fluidd/commit/6557f1d5a467edb42439d30ff0bb33010af60e87))
* ensures CodeLens is not shown if disabled ([#978](https://github.com/fluidd-core/fluidd/issues/978)) ([0bdb86d](https://github.com/fluidd-core/fluidd/commit/0bdb86dabef83427fac1c93c45941a30d226566f))

## [1.22.1](https://github.com/fluidd-core/fluidd/compare/v1.22.0...v1.22.1) (2022-12-09)


### Features

* supports Klipper output pin toggle in AppBar ([#970](https://github.com/fluidd-core/fluidd/issues/970)) ([d263733](https://github.com/fluidd-core/fluidd/commit/d263733ef8a181f048c7ee30220c606d515757f8))


### Bug Fixes

* correctly load fallback language ([095b093](https://github.com/fluidd-core/fluidd/commit/095b093204a47115943bf55c2d41ecb97b7d2d83))
* don't reload printing file if loaded in GCode Previewer ([64a4e8a](https://github.com/fluidd-core/fluidd/commit/64a4e8a7af7974019e41f48612181f9a12e05dcc))
* temperature chart legend ([#973](https://github.com/fluidd-core/fluidd/issues/973)) ([f490098](https://github.com/fluidd-core/fluidd/commit/f490098f74ae7e30db4b0fe0d49d8c110bdf7436))

## [1.22.0](https://github.com/fluidd-core/fluidd/compare/v1.21.1...v1.22.0) (2022-12-04)


### Features

* adds extrusion estimations ([#950](https://github.com/fluidd-core/fluidd/issues/950)) ([4fa93c9](https://github.com/fluidd-core/fluidd/commit/4fa93c97ec8fa9a75322ee9563cbd3466e7c3271))
* adds z_thermal_adjust support ([#951](https://github.com/fluidd-core/fluidd/issues/951)) ([d6d11db](https://github.com/fluidd-core/fluidd/commit/d6d11dbe261bd21de9a813ab81f0670cfde7fe0e))
* g-code preview alternative controls ([#969](https://github.com/fluidd-core/fluidd/issues/969)) ([846f5f9](https://github.com/fluidd-core/fluidd/commit/846f5f94ab39f79224f5b1a23f75db3dbb254712))
* move exclude objects list to StatusControls ([#935](https://github.com/fluidd-core/fluidd/issues/935)) ([504913c](https://github.com/fluidd-core/fluidd/commit/504913cc23563e3afeeffc14c9ee7bd6db068ac3))
* new AppFocusableContainer component ([#942](https://github.com/fluidd-core/fluidd/issues/942)) ([961b45f](https://github.com/fluidd-core/fluidd/commit/961b45f0a866805154fb2131f2121b50c8f3861d))
* sort instance list alphabetically ([#946](https://github.com/fluidd-core/fluidd/issues/946)) ([935a6c5](https://github.com/fluidd-core/fluidd/commit/935a6c5266313074c17edc326ad1b0a21bf84cbc))
* use service names provided by Moonraker ([#940](https://github.com/fluidd-core/fluidd/issues/940)) ([ad84769](https://github.com/fluidd-core/fluidd/commit/ad847690cf0e40c691c0e03613b38e0fe5ada661))


### Bug Fixes

* disable XY controls for delta printers only ([0de81b6](https://github.com/fluidd-core/fluidd/commit/0de81b669aea8100fb25beb05cb5f2fa1f96da53))
* exclude extruder_stepper from extruders ([1b8819c](https://github.com/fluidd-core/fluidd/commit/1b8819c0a294c7098b78506844d7d9f553a95be5))
* extrusion estimation spacing ([#961](https://github.com/fluidd-core/fluidd/issues/961)) ([ebc1c09](https://github.com/fluidd-core/fluidd/commit/ebc1c092ba0bc6bc77ce70b0e62a650b00a721e1))
* **i18n:** adds missing 'start service' translation ([#945](https://github.com/fluidd-core/fluidd/issues/945)) ([70d48e4](https://github.com/fluidd-core/fluidd/commit/70d48e4e33f60fa2f2c4f23709a0914cce4d1b51))
* Klipper reset should only reset its own state ([06d81c5](https://github.com/fluidd-core/fluidd/commit/06d81c5f54c85414ad09426435e07f65213e44e4))
* mitigates console warning ([a4c9ea5](https://github.com/fluidd-core/fluidd/commit/a4c9ea5f014f63c3aa53af868bde696f120587f6))
* pre-commit hook linting ([#959](https://github.com/fluidd-core/fluidd/issues/959)) ([a23b06c](https://github.com/fluidd-core/fluidd/commit/a23b06cf125a1609947e712de84dd41b5e81fe2d))
* properly scale print finish ETA ([#958](https://github.com/fluidd-core/fluidd/issues/958)) ([967f30e](https://github.com/fluidd-core/fluidd/commit/967f30e056b9af8ca93011a97c98cd18dc5aa3ea))
* set layout to default if it is missing ([310c740](https://github.com/fluidd-core/fluidd/commit/310c7400f504adf6480a672b32032766e44ff0b0))
* show html formatted welcome message ([#930](https://github.com/fluidd-core/fluidd/issues/930)) ([be9d138](https://github.com/fluidd-core/fluidd/commit/be9d138106545c31be60ce5a01f2b2343f534aa0))
* sort temperature sensors by type and name ([#957](https://github.com/fluidd-core/fluidd/issues/957)) ([3f76335](https://github.com/fluidd-core/fluidd/commit/3f763358cb7b723a7c4647db547ccc0b5bf969d2))
* stop slider animation on navigating to page ([#927](https://github.com/fluidd-core/fluidd/issues/927)) ([c698675](https://github.com/fluidd-core/fluidd/commit/c6986757a67af6af11f17d201f42f5cf8608cdb1))
* **style:** button and card elevation values ([e0a4c78](https://github.com/fluidd-core/fluidd/commit/e0a4c78bdc3265a88bf1dde197246302cf063d1f))
* **style:** cards bottom border radius ([83c7fb9](https://github.com/fluidd-core/fluidd/commit/83c7fb9c87b19e4460279100414bc283dabfa2c3))
* **style:** more cards bottom border radius ([666e535](https://github.com/fluidd-core/fluidd/commit/666e53500ecca609d26569949dc9c452ebbd8aef))
* **style:** PrinterStatusCard bottom border radius ([69eba56](https://github.com/fluidd-core/fluidd/commit/69eba5625d31718ea913c5e3b5f63c5225a64740))
* timelapse card error when no camera is set ([7ac5a4d](https://github.com/fluidd-core/fluidd/commit/7ac5a4d770149cf8db592673d7e48d1444bbed93))
* update menu collapsed state on column count ([f14173f](https://github.com/fluidd-core/fluidd/commit/f14173f28163304bc80d47817961b3f8078e252d))

## [1.21.1](https://github.com/fluidd-core/fluidd/compare/v1.21.0...v1.21.1) (2022-10-25)


### Bug Fixes

* script error on AppMacroBtn click ([#924](https://github.com/fluidd-core/fluidd/issues/924)) ([93b3d34](https://github.com/fluidd-core/fluidd/commit/93b3d3456e5b5693fc010078572857163fe3c181))

## [1.21.0](https://github.com/fluidd-core/fluidd/compare/v1.20.1...v1.21.0) (2022-10-24)


### Features

* Adds any existing Probe to Endstops card ([#881](https://github.com/fluidd-core/fluidd/issues/881)) ([50ce1f1](https://github.com/fluidd-core/fluidd/commit/50ce1f190da96299d74958057da19449d0e2fdbb))
* adds missing translation keys ([#906](https://github.com/fluidd-core/fluidd/issues/906)) ([e7106a2](https://github.com/fluidd-core/fluidd/commit/e7106a28fee5c29ac1cc79b0a03f964de344199d))
* Adds new metadata fields to file list ([#871](https://github.com/fluidd-core/fluidd/issues/871)) ([afe70e9](https://github.com/fluidd-core/fluidd/commit/afe70e95fc8587639fb7e6e837343106b855e6c1))
* gcode preview autozoom ([#894](https://github.com/fluidd-core/fluidd/issues/894)) ([c0294dd](https://github.com/fluidd-core/fluidd/commit/c0294dda5c43528c0c9722eb2f768f250e2667b2))
* **i18n-HU:** update Hungarian language ([#909](https://github.com/fluidd-core/fluidd/issues/909)) ([ec94685](https://github.com/fluidd-core/fluidd/commit/ec9468555cb5173d713deb687865b3572117fe80))
* **i18n-JA:** update Japanese language ([#880](https://github.com/fluidd-core/fluidd/issues/880)) ([4d23b23](https://github.com/fluidd-core/fluidd/commit/4d23b23044f58641f6b54c67f6007ed0d275ca73))
* iframe camera view aspect ratio ([#875](https://github.com/fluidd-core/fluidd/issues/875)) ([aec9789](https://github.com/fluidd-core/fluidd/commit/aec9789227812e030a7a1ba939ea4b73b5358b6c))
* larger thumbnail preview ([#891](https://github.com/fluidd-core/fluidd/issues/891)) ([2a101db](https://github.com/fluidd-core/fluidd/commit/2a101db44c707beb1e7f039f1cabbb946100751c))
* single white channel led control ([#901](https://github.com/fluidd-core/fluidd/issues/901)) ([69fc533](https://github.com/fluidd-core/fluidd/commit/69fc53389147b0271ba800f3e5872e6e66f8aa1b))
* use layer info from print_stats if available ([#903](https://github.com/fluidd-core/fluidd/issues/903)) ([d6886fd](https://github.com/fluidd-core/fluidd/commit/d6886fde1260d791120f71f7821cc959212c5b1d))
* user/device specific layouts ([#878](https://github.com/fluidd-core/fluidd/issues/878)) ([9f198d6](https://github.com/fluidd-core/fluidd/commit/9f198d630a5ec563c188869e98a394051cebb029))
* uses macro description as button tooltip ([#915](https://github.com/fluidd-core/fluidd/issues/915)) ([ca25343](https://github.com/fluidd-core/fluidd/commit/ca25343b93326e37953a875809fae41408a5241e))


### Bug Fixes

* allow initial layer in GcodePreviewCard ([#896](https://github.com/fluidd-core/fluidd/issues/896)) ([0938cce](https://github.com/fluidd-core/fluidd/commit/0938cce0d13c844491c9e07454932f541942b620))
* auth/setCurrentUser expects object ([#882](https://github.com/fluidd-core/fluidd/issues/882)) ([729988d](https://github.com/fluidd-core/fluidd/commit/729988dcb28764af2b16ad91d5f1d96c7c22b31a))
* check stepper_z exists before applying z_offset ([#890](https://github.com/fluidd-core/fluidd/issues/890)) ([becdd78](https://github.com/fluidd-core/fluidd/commit/becdd7889297f436995b633fd6b3b6ca15eab76d))
* **console:** console no longer loses scroll attachment on multiple M118 ([#921](https://github.com/fluidd-core/fluidd/issues/921)) ([60bb6d9](https://github.com/fluidd-core/fluidd/commit/60bb6d92c0fda929f552ba5d6cd3e214d135aa4c))
* destroy mjpg camera stream properly ([#868](https://github.com/fluidd-core/fluidd/issues/868)) ([d6cb6f1](https://github.com/fluidd-core/fluidd/commit/d6cb6f1900e1816986caf8704879bd4122efb9e5))
* disable controls if Klipper not ready ([#911](https://github.com/fluidd-core/fluidd/issues/911)) ([793a94b](https://github.com/fluidd-core/fluidd/commit/793a94b7bb60fa3539f85ed4be452f226981f268))
* Exclude Object not reacting to mobile inputs ([#898](https://github.com/fluidd-core/fluidd/issues/898)) ([f1b32a9](https://github.com/fluidd-core/fluidd/commit/f1b32a9e87fa27af5ced6abf5024aebeeec51833))
* FileSystemBrowser icon size and resolution ([#887](https://github.com/fluidd-core/fluidd/issues/887)) ([b807802](https://github.com/fluidd-core/fluidd/commit/b807802ddccb0d4cc90bd30b0d7cfb51804dfac8))
* only auto-load gcode preview on ongoing print ([#869](https://github.com/fluidd-core/fluidd/issues/869)) ([1752ee0](https://github.com/fluidd-core/fluidd/commit/1752ee0ff5d3702ab2fcac3b80ee6e0bc4fdd93a))
* sort the manual probe offsets descending ([#917](https://github.com/fluidd-core/fluidd/issues/917)) ([646bb29](https://github.com/fluidd-core/fluidd/commit/646bb2996edab33a140cdf90e0e069d422453928))

## [1.20.1](https://github.com/fluidd-core/fluidd/compare/v1.20.0...v1.20.1) (2022-09-18)


### Features

* adds variance to bed mesh chart ([#857](https://github.com/fluidd-core/fluidd/issues/857)) ([e0d8602](https://github.com/fluidd-core/fluidd/commit/e0d8602e792f44b8e713b4b1a5fc35a35fd9aeb1))
* adjustable thumbnail size ([#862](https://github.com/fluidd-core/fluidd/issues/862)) ([0a3f8de](https://github.com/fluidd-core/fluidd/commit/0a3f8de1a0e71c01cc2bf54a6ad3985d88369c32))
* **i18n-HU:** Update Hungarian Language ([#866](https://github.com/fluidd-core/fluidd/issues/866)) ([d8dafc8](https://github.com/fluidd-core/fluidd/commit/d8dafc843f6477f8581935414f7d6e513e87a2de))


### Bug Fixes

* Camera iframe width ([#867](https://github.com/fluidd-core/fluidd/issues/867)) ([fb3c955](https://github.com/fluidd-core/fluidd/commit/fb3c955107bc47ddd356ba026d6d30fdfbf930a9))
* disable dashboard controls if Klipper is not ready ([#852](https://github.com/fluidd-core/fluidd/issues/852)) ([b08eec1](https://github.com/fluidd-core/fluidd/commit/b08eec19590d38cdbb2dfa798b89130fe6004427))
* disable force_move on axis with multiple steppers ([#858](https://github.com/fluidd-core/fluidd/issues/858)) ([3514f15](https://github.com/fluidd-core/fluidd/commit/3514f15b0eb08226cbab4ad531f39e46d9ae4d15))
* do not escape label for app-slider ([#861](https://github.com/fluidd-core/fluidd/issues/861)) ([a79f9eb](https://github.com/fluidd-core/fluidd/commit/a79f9eb7081c4de828523759662ab157467bc9ca))
* pressure advance and acceleration units ([#859](https://github.com/fluidd-core/fluidd/issues/859)) ([8c10427](https://github.com/fluidd-core/fluidd/commit/8c104270b1b49daf6b7c1d8f3fc98187cd32bd05))

## [1.20.0](https://github.com/fluidd-core/fluidd/compare/v1.19.1...v1.20.0) (2022-08-28)


### Features

* add optional Chamber Temp column to jobs ([#835](https://github.com/fluidd-core/fluidd/issues/835)) ([7dd561c](https://github.com/fluidd-core/fluidd/commit/7dd561cb1f42decaf548f7c81d861fb2375f8b25))
* Diagnostics panel ([#793](https://github.com/fluidd-core/fluidd/issues/793)) ([f61eaf4](https://github.com/fluidd-core/fluidd/commit/f61eaf44bac8f9e1fb5b2cff35da1b5cdfc7ac04))
* enable context menu in monaco editor ([#824](https://github.com/fluidd-core/fluidd/issues/824)) ([f374bee](https://github.com/fluidd-core/fluidd/commit/f374beef2be3a1e277b8c78c60bc280b151d8c0f))
* Enabling default list of endpoints via config ([#843](https://github.com/fluidd-core/fluidd/issues/843)) ([2a2d77d](https://github.com/fluidd-core/fluidd/commit/2a2d77d49bdb3689a1f2043bd2b85fc140742865))
* **i18n-DE:** update German translation ([#813](https://github.com/fluidd-core/fluidd/issues/813)) ([d56d6bf](https://github.com/fluidd-core/fluidd/commit/d56d6bf1034500fccd279fdff16402eac07375ec))
* **i18n-DE:** update German translations ([#840](https://github.com/fluidd-core/fluidd/issues/840)) ([acfaa65](https://github.com/fluidd-core/fluidd/commit/acfaa65df39b1643ecdaad3bf5fc46290166612f))
* **i18n-HU:** update Hungarian language files ([#837](https://github.com/fluidd-core/fluidd/issues/837)) ([adc60a6](https://github.com/fluidd-core/fluidd/commit/adc60a6b7ae0fbb52ccc894e4896b665af843b34))
* preheat printer chamber if value provided ([#818](https://github.com/fluidd-core/fluidd/issues/818)) ([2eecdd5](https://github.com/fluidd-core/fluidd/commit/2eecdd5e1a35c0d2275362c9aed7cfb768d69346))
* **ui:** custom stylesheet and background image ([#795](https://github.com/fluidd-core/fluidd/issues/795)) ([e4720dc](https://github.com/fluidd-core/fluidd/commit/e4720dc66fda27e9d84ebf2f3e2eb50ce2082146))
* **ui:** Hide files in /config ([#812](https://github.com/fluidd-core/fluidd/issues/812)) ([9b09655](https://github.com/fluidd-core/fluidd/commit/9b096554a5d788edca6e427894d0665bc6cabe85))
* **ui:** update all feature ([#817](https://github.com/fluidd-core/fluidd/issues/817)) ([b07f59c](https://github.com/fluidd-core/fluidd/commit/b07f59c4e674d04184a61439f5f58693b4b84f44))


### Bug Fixes

* adds ACCEL parameter to FORCE_MOVE commands ([#815](https://github.com/fluidd-core/fluidd/issues/815)) ([ad8ebf1](https://github.com/fluidd-core/fluidd/commit/ad8ebf1846728496ecd1f4ffce1eede206691960))
* Allow uploading theme files ([#828](https://github.com/fluidd-core/fluidd/issues/828)) ([03ac253](https://github.com/fluidd-core/fluidd/commit/03ac25347a82f31305f03b80dd13b0f86310d0f6))
* check for webassembly support ([#822](https://github.com/fluidd-core/fluidd/issues/822)) ([384712a](https://github.com/fluidd-core/fluidd/commit/384712a2f9ee520852b4db622cc098fe417b76bf))
* Correct SVG transformations in GCode Preview ([#816](https://github.com/fluidd-core/fluidd/issues/816)) ([ed5e5d1](https://github.com/fluidd-core/fluidd/commit/ed5e5d19e8a8e3dbc0d4a8f0b14c18609e233c77))
* dashboard constrained width ([#820](https://github.com/fluidd-core/fluidd/issues/820)) ([48fab84](https://github.com/fluidd-core/fluidd/commit/48fab840411fe7fce80313b74bb530b471ee9f80))
* delta viewbox regression ([#823](https://github.com/fluidd-core/fluidd/issues/823)) ([a344eb1](https://github.com/fluidd-core/fluidd/commit/a344eb10c8ca220ebed5bc33153aeee0c85502d9))
* **diagnostics:** Metrics Explorer styling ([#848](https://github.com/fluidd-core/fluidd/issues/848)) ([c2768a3](https://github.com/fluidd-core/fluidd/commit/c2768a344a1eeeec5ad71cb36b0d35fd86686b1f))
* disable dashboard controls if Klipper is not ready ([#811](https://github.com/fluidd-core/fluidd/issues/811)) ([7028b15](https://github.com/fluidd-core/fluidd/commit/7028b1595a1c6efd85bb2b60d2fc350749a6890c))
* dispatch even if database creation fails ([#847](https://github.com/fluidd-core/fluidd/issues/847)) ([fde24f9](https://github.com/fluidd-core/fluidd/commit/fde24f9dcc3434b0549d0013f2093eef7ec85d4e))
* edge case where containers order is incorrect ([#819](https://github.com/fluidd-core/fluidd/issues/819)) ([d76f186](https://github.com/fluidd-core/fluidd/commit/d76f186662d8d42d8c3d9975a1959cdf8ed22b3a))
* ensures containers exist ([#842](https://github.com/fluidd-core/fluidd/issues/842)) ([0d5a1a3](https://github.com/fluidd-core/fluidd/commit/0d5a1a3ab85c174275ad55f1d4abaf22578c1e11))
* mitigates undefined history errors ([#830](https://github.com/fluidd-core/fluidd/issues/830)) ([9424f7f](https://github.com/fluidd-core/fluidd/commit/9424f7f34133873df0227c04c8fe55582435ce31))
* reset G-code Preview state on file overwrite ([#832](https://github.com/fluidd-core/fluidd/issues/832)) ([71f0938](https://github.com/fluidd-core/fluidd/commit/71f09382341468af06530a481b34d025f8bee4ce))
* width constraint at root container level ([#829](https://github.com/fluidd-core/fluidd/issues/829)) ([1ab7618](https://github.com/fluidd-core/fluidd/commit/1ab7618d0ade0182da26fd3499cc9069ca083bbc))

## [1.19.1](https://github.com/fluidd-core/fluidd/compare/v1.19.0...v1.19.1) (2022-08-02)


### Features

* Adds minimum support for crowsnest service ([#808](https://github.com/fluidd-core/fluidd/issues/808)) ([1258b35](https://github.com/fluidd-core/fluidd/commit/1258b351769c09f1d88eeb78c1952f2f6f43c1a1))
* adds new Bed Screws Adjust helper dialog ([#802](https://github.com/fluidd-core/fluidd/issues/802)) ([adc5847](https://github.com/fluidd-core/fluidd/commit/adc5847af04f22644d02aff5ef5c537df99cc317))
* adds new Manual Probe helper dialog ([#785](https://github.com/fluidd-core/fluidd/issues/785)) ([0f60671](https://github.com/fluidd-core/fluidd/commit/0f606715a9bb0afaeb364600f1aec535f7f2e23d))
* allow showing Bed Mesh on Dashboard ([#797](https://github.com/fluidd-core/fluidd/issues/797)) ([a503bb4](https://github.com/fluidd-core/fluidd/commit/a503bb4aea4b980581b98bf94accdab7cb74a7d4))
* **i18n-HU:** update Hungarian translation ([#771](https://github.com/fluidd-core/fluidd/issues/771)) ([70a1102](https://github.com/fluidd-core/fluidd/commit/70a1102c1ccf1adf1c888a44445883a6b682bd2d))
* match theme-color with primary-color ([#774](https://github.com/fluidd-core/fluidd/issues/774)) ([6c6c475](https://github.com/fluidd-core/fluidd/commit/6c6c4759d4bc4ff583b79121e3f4aaa1fb306455))
* Save Config And Restart button visibility toggle ([#775](https://github.com/fluidd-core/fluidd/issues/775)) ([869a580](https://github.com/fluidd-core/fluidd/commit/869a580b29c2e7cc507d38af35df23e6ce64329f))
* **ui:** Add FORCE_MOVE support to tool controls ([#750](https://github.com/fluidd-core/fluidd/issues/750)) ([c6b9d8b](https://github.com/fluidd-core/fluidd/commit/c6b9d8b58b1e7d3b0c5abeb7ccbf6a6b3d724d43))


### Bug Fixes

* Check Bed_Mesh Support ([#801](https://github.com/fluidd-core/fluidd/issues/801)) ([a38592c](https://github.com/fluidd-core/fluidd/commit/a38592c45200ffe77f7eaa36af7fabaf4e4524d1))
* corrects moonraker docs link for "include" section ([#799](https://github.com/fluidd-core/fluidd/issues/799)) ([3e2552a](https://github.com/fluidd-core/fluidd/commit/3e2552afc1c71807e7f91ac7001a72a8720690a7))
* disable FORCE_MOVE toggle when printing / not ready ([#770](https://github.com/fluidd-core/fluidd/issues/770)) ([e17f5a1](https://github.com/fluidd-core/fluidd/commit/e17f5a1fc870e7877054a2ccb9ec17b36185184f))
* Enable vue-echarts auto-resizing ([#809](https://github.com/fluidd-core/fluidd/issues/809)) ([041dc0f](https://github.com/fluidd-core/fluidd/commit/041dc0fee0414c916bcdccadbfcce0b53e432e84))
* hide sub-navigation if socket not connected ([#798](https://github.com/fluidd-core/fluidd/issues/798)) ([e5547e6](https://github.com/fluidd-core/fluidd/commit/e5547e6b501cce49134d31facb521cd3a96be334))
* **i18n:** fix FORCE_MOVE capitalization ([#786](https://github.com/fluidd-core/fluidd/issues/786)) ([63e4871](https://github.com/fluidd-core/fluidd/commit/63e487189804618999ec277bc2121dab59004e86))
* mitigates console warning ([#800](https://github.com/fluidd-core/fluidd/issues/800)) ([aa55234](https://github.com/fluidd-core/fluidd/commit/aa55234039e2789e5d41ed0470920e5d78b62858))
* OutputLed working with all types of LEDs ([#766](https://github.com/fluidd-core/fluidd/issues/766)) ([b101cd3](https://github.com/fluidd-core/fluidd/commit/b101cd31a50c25fccf4adcc613ae790bc67f2664))
* **README:** use preview from docs ([#757](https://github.com/fluidd-core/fluidd/issues/757)) ([24c6c48](https://github.com/fluidd-core/fluidd/commit/24c6c48fa59d39497c6b3c445a9717d6ec039e2c))
* show current layer in Gcode preview by default ([#790](https://github.com/fluidd-core/fluidd/issues/790)) ([278d683](https://github.com/fluidd-core/fluidd/commit/278d683d6b7424524cecaf2a6d54ee6d13f76024))

## [1.19.0](https://github.com/fluidd-core/fluidd/compare/v1.18.2...v1.19.0) (2022-07-10)


### Features

* add icon to shutdown on AppBar ([#736](https://github.com/fluidd-core/fluidd/issues/736)) ([580a177](https://github.com/fluidd-core/fluidd/commit/580a177276ccaafad279537ea61ff517c676ded6))
* adds Save Config & Restart button ([#726](https://github.com/fluidd-core/fluidd/issues/726)) ([68809bf](https://github.com/fluidd-core/fluidd/commit/68809bf34c6c3584ae5bafb8e2601b9595a5814d))
* adds setting to toggle Codelens visibility ([#716](https://github.com/fluidd-core/fluidd/issues/716)) ([6dd511c](https://github.com/fluidd-core/fluidd/commit/6dd511c2df90f4fe6ca3214e96110bcd9061d205))
* allows 4 layout columns in dashboard ([#719](https://github.com/fluidd-core/fluidd/issues/719)) ([51d09fe](https://github.com/fluidd-core/fluidd/commit/51d09fe5e097138bb50a0b50f0be1e719a7667f4))
* device power toggle in top navigation ([#739](https://github.com/fluidd-core/fluidd/issues/739)) ([ed3e647](https://github.com/fluidd-core/fluidd/commit/ed3e64795050879ecd3385f1819c6f8321a074bc))
* Exclude Objects ([#754](https://github.com/fluidd-core/fluidd/issues/754)) ([03ca3ab](https://github.com/fluidd-core/fluidd/commit/03ca3abf221a3b3cf3d1a4163f60934f0c5ec867))
* Extended G-Code viewer auto-actions ([#738](https://github.com/fluidd-core/fluidd/issues/738)) ([79ec091](https://github.com/fluidd-core/fluidd/commit/79ec091ac30e784a5093c8467edd6cb63fa4729a))
* fullscreen camera page ([#609](https://github.com/fluidd-core/fluidd/issues/609)) ([9a159ec](https://github.com/fluidd-core/fluidd/commit/9a159ecbef0bdd37ad1d937d13330a07dd6bdbc0))
* **i18n-HU:** update Hungarian translation ([#745](https://github.com/fluidd-core/fluidd/issues/745)) ([eca3bb9](https://github.com/fluidd-core/fluidd/commit/eca3bb95cc2ae8ab9c31bed584ca53aec7933756))
* keep icon buttons visible on mobile view ([#709](https://github.com/fluidd-core/fluidd/issues/709)) ([362fcb3](https://github.com/fluidd-core/fluidd/commit/362fcb3d4f18d49936083ff4dac305ed230aaa65))
* ldap authentication support ([#721](https://github.com/fluidd-core/fluidd/issues/721)) ([08973eb](https://github.com/fluidd-core/fluidd/commit/08973eb940976353363e67cf396d9c504205018b))
* Support full range of klipper PA scale ([#743](https://github.com/fluidd-core/fluidd/issues/743)) ([7e54fbe](https://github.com/fluidd-core/fluidd/commit/7e54fbe76507a0a2ab5b45485a80a983769a169c))
* **ui:** Fit console height to screen size ([#735](https://github.com/fluidd-core/fluidd/issues/735)) ([d749a3a](https://github.com/fluidd-core/fluidd/commit/d749a3ac6999d596b387f165080e54b0701a9e28))


### Bug Fixes

* add default authentication source to new users ([#749](https://github.com/fluidd-core/fluidd/issues/749)) ([e52f4cd](https://github.com/fluidd-core/fluidd/commit/e52f4cd9c1aa672b76e2c340d4a2d61eb42874c4))
* check for root available before listing files ([#728](https://github.com/fluidd-core/fluidd/issues/728)) ([f67a178](https://github.com/fluidd-core/fluidd/commit/f67a1789e25267264545ed664a484affeab873a1))
* codelens links for moonraker-telegram-bot ([#742](https://github.com/fluidd-core/fluidd/issues/742)) ([dd19d18](https://github.com/fluidd-core/fluidd/commit/dd19d18ed1ff3085c8a10b322aa87d9885e66d6b))
* console error from LDAP auth changes ([#724](https://github.com/fluidd-core/fluidd/issues/724)) ([d9b276c](https://github.com/fluidd-core/fluidd/commit/d9b276c123154c14dac76e1ab41a60f9eb2ecf76))
* disable absolute/relative positioning controls while printing ([#720](https://github.com/fluidd-core/fluidd/issues/720)) ([394b980](https://github.com/fluidd-core/fluidd/commit/394b9802b2db74f0478b5ae0679cd843c82a5f76))
* disable positioning mode buttons when klippy is not ready ([#722](https://github.com/fluidd-core/fluidd/issues/722)) ([60531c1](https://github.com/fluidd-core/fluidd/commit/60531c15c15f43a197f5f0a0f78ae033fd30af7a))
* gcode preview initial layout ([#731](https://github.com/fluidd-core/fluidd/issues/731)) ([065aece](https://github.com/fluidd-core/fluidd/commit/065aece668894620a7640c4d1a8e278352c3a183))
* hide card buttons and menus in layout view ([#710](https://github.com/fluidd-core/fluidd/issues/710)) ([b436288](https://github.com/fluidd-core/fluidd/commit/b436288c12fb8a8dacf60efb3ddfaecfb9e1979b))
* LED controls behavior ([#723](https://github.com/fluidd-core/fluidd/issues/723)) ([0cbf650](https://github.com/fluidd-core/fluidd/commit/0cbf650d859405972ee1b9b3562105a13b2c456f))
* mitigates network error with latest Axios ([#717](https://github.com/fluidd-core/fluidd/issues/717)) ([0fafbf7](https://github.com/fluidd-core/fluidd/commit/0fafbf74672000db0c1a1f504560ef26a46dfdc7))
* nginx 502 error when restarting moonraker ([#734](https://github.com/fluidd-core/fluidd/issues/734)) ([62d22cc](https://github.com/fluidd-core/fluidd/commit/62d22cc64f545a65c8087fe0a199a3fd000f3f6c))
* no collapsed console in fullscreen mode ([#737](https://github.com/fluidd-core/fluidd/issues/737)) ([057e505](https://github.com/fluidd-core/fluidd/commit/057e5059242bc16a8a645c4c7addfe4f06bef5fa))
* only splice waits if contains item ([#725](https://github.com/fluidd-core/fluidd/issues/725)) ([7b3bcd0](https://github.com/fluidd-core/fluidd/commit/7b3bcd0118232a5527d262e00c6d58f5bca99ace))
* show absolute/relative positioning controls ([#718](https://github.com/fluidd-core/fluidd/issues/718)) ([26ab673](https://github.com/fluidd-core/fluidd/commit/26ab6733c6d339c5c47c2a3e5e0b53c5ce94d0ba))
* **style:** light theme and consistency changes ([#755](https://github.com/fluidd-core/fluidd/issues/755)) ([bdce69e](https://github.com/fluidd-core/fluidd/commit/bdce69e588af334af5925846e2e938b2da59a9b8))
* **style:** light theme AppSwitch ([#752](https://github.com/fluidd-core/fluidd/issues/752)) ([ac3d80e](https://github.com/fluidd-core/fluidd/commit/ac3d80ecef1d96474569e4c4af1794900fb1dce2))
* use default color for power icon in top navigation ([#746](https://github.com/fluidd-core/fluidd/issues/746)) ([0f40140](https://github.com/fluidd-core/fluidd/commit/0f4014054d172abe6978f24eb38be33ccfbdad0a))

## [1.18.2](https://github.com/fluidd-core/fluidd/compare/v1.18.1...v1.18.2) (2022-06-09)


### Features

* adds "show current layer" to gcode previewer ([#693](https://github.com/fluidd-core/fluidd/issues/693)) ([5b3c923](https://github.com/fluidd-core/fluidd/commit/5b3c923d2c2fd2426ceafa3aab35c256009553a3))
* **i18n-DE:** update German translations ([#708](https://github.com/fluidd-core/fluidd/issues/708)) ([2f94b6b](https://github.com/fluidd-core/fluidd/commit/2f94b6b21c5e1c5f59731bcff2b1522941dab9b6))
* **i18n-HU:** update Hungarian translation ([#702](https://github.com/fluidd-core/fluidd/issues/702)) ([5ccc2d6](https://github.com/fluidd-core/fluidd/commit/5ccc2d6bd0f9c79e58671b3a919e550e4686507b))
* **i18n-zh-HK:** add Traditional Chinese translations ([#705](https://github.com/fluidd-core/fluidd/issues/705)) ([6a33ad0](https://github.com/fluidd-core/fluidd/commit/6a33ad03e91fb71851002733441db93ade4ddc28))
* moves MCU info to separate panel ([#706](https://github.com/fluidd-core/fluidd/issues/706)) ([d937f06](https://github.com/fluidd-core/fluidd/commit/d937f06164283f111002367825fe1ae9c24ac814))


### Bug Fixes

* AppSlider mobile lock disabling ([#695](https://github.com/fluidd-core/fluidd/issues/695)) ([8e9c07f](https://github.com/fluidd-core/fluidd/commit/8e9c07f1d7a5687398976e3b724936c27d7a0685))
* code editor folding ([#692](https://github.com/fluidd-core/fluidd/issues/692)) ([cde3a61](https://github.com/fluidd-core/fluidd/commit/cde3a61a76214b914c928c1b59c8376e5d226c05))
* hide Pressure Advance if no default extruder stepper set ([#694](https://github.com/fluidd-core/fluidd/issues/694)) ([895dbe2](https://github.com/fluidd-core/fluidd/commit/895dbe25a00c22fce94dabf7b5378b56d7ae7b08))
* **layout:** move gcode controls to dropdown; fix vertical layout ([#696](https://github.com/fluidd-core/fluidd/issues/696)) ([6fc304e](https://github.com/fluidd-core/fluidd/commit/6fc304e6251a7ffbc46feeb00a11d49496b54b3d))

## [1.18.1](https://github.com/fluidd-core/fluidd/compare/v1.18.0...v1.18.1) (2022-05-20)


### Features

* add toggles for relative humidity / barometric pressure ([#687](https://github.com/fluidd-core/fluidd/issues/687)) ([665c743](https://github.com/fluidd-core/fluidd/commit/665c743b3fde2ca22a523a95db5c69acbb94b95e))
* adds Codelens and code folding support ([#665](https://github.com/fluidd-core/fluidd/issues/665)) ([aaddeab](https://github.com/fluidd-core/fluidd/commit/aaddeabc51f94f2c388552784ca8d77206a7295c))
* clear console ([#678](https://github.com/fluidd-core/fluidd/issues/678)) ([237f62e](https://github.com/fluidd-core/fluidd/commit/237f62e9757e63246295e10288894719e6134ca0))
* highlight links in warning messages ([#682](https://github.com/fluidd-core/fluidd/issues/682)) ([ebe1c5a](https://github.com/fluidd-core/fluidd/commit/ebe1c5a42771b0e6d91106ff69fbb8f4530575d0))
* **i18n-HU:** update Hungarian translation  ([#663](https://github.com/fluidd-core/fluidd/issues/663)) ([d51502b](https://github.com/fluidd-core/fluidd/commit/d51502b7667aaf78953d5cc6bc00c1cf0c8d7d9a))
* **i18n-NL:** update Dutch translations ([#672](https://github.com/fluidd-core/fluidd/issues/672)) ([197f8a4](https://github.com/fluidd-core/fluidd/commit/197f8a4f7f1136d87fb8cef5c0d95bcc94637d6f))
* **i18n-RU:** update Russian translations ([#666](https://github.com/fluidd-core/fluidd/issues/666)) ([ab63e2a](https://github.com/fluidd-core/fluidd/commit/ab63e2a87bdf36018292305e55e26e3a4f75d2a5))
* replaces Keyboard Shortcuts with Command Palette ([#680](https://github.com/fluidd-core/fluidd/issues/680)) ([33dfe66](https://github.com/fluidd-core/fluidd/commit/33dfe66d6a404f876f60ce62163433c1961a5a89))


### Bug Fixes

* allow omit 0 units in gcode number parsing ([#679](https://github.com/fluidd-core/fluidd/issues/679)) ([ad8d4ff](https://github.com/fluidd-core/fluidd/commit/ad8d4ff2a4f2956e3332f54e47b5cfc7262b9794))
* AppSlider incorrect state ([#654](https://github.com/fluidd-core/fluidd/issues/654)) ([8e59f4e](https://github.com/fluidd-core/fluidd/commit/8e59f4e9167547e1856c561762af6627a0ffc563))
* clear "follow progress" if not correct file printing ([#683](https://github.com/fluidd-core/fluidd/issues/683)) ([21892ca](https://github.com/fluidd-core/fluidd/commit/21892ca9f71ae79eeffef0c65a8b6565b7c7f302)), closes [#659](https://github.com/fluidd-core/fluidd/issues/659)
* console auto-scrolling and flipped layout ([#661](https://github.com/fluidd-core/fluidd/issues/661)) ([979e874](https://github.com/fluidd-core/fluidd/commit/979e87408776d5178504180505c4fbc9f1773e25))
* **i18n-FR:** fix typo in French translation ([c856dd3](https://github.com/fluidd-core/fluidd/commit/c856dd3980d7bc34dd05ffc23788956d2c9979f1))
* increase PA precision to 0.001 ([#652](https://github.com/fluidd-core/fluidd/issues/652)) ([2623902](https://github.com/fluidd-core/fluidd/commit/2623902c9b43ccdd6531dddea7d949ddd520fc94))
* job card history metadata race condition ([#668](https://github.com/fluidd-core/fluidd/issues/668)) ([5ce0921](https://github.com/fluidd-core/fluidd/commit/5ce0921c25d306fa651c5b05f1537829d56d5e67))
* show temp item as selected by default ([#655](https://github.com/fluidd-core/fluidd/issues/655)) ([8a0af9e](https://github.com/fluidd-core/fluidd/commit/8a0af9e7273692f1ef61d5a1268b21666abe4b35))
* show temp item as selected by default (cont.) ([#660](https://github.com/fluidd-core/fluidd/issues/660)) ([89223ca](https://github.com/fluidd-core/fluidd/commit/89223ca35ffaf77a1f44ae5d9136b48fa1005d4a))
* **style:** light theme fixes/improvements ([#676](https://github.com/fluidd-core/fluidd/issues/676)) ([1530697](https://github.com/fluidd-core/fluidd/commit/1530697b47af8c918a8a0cf4438b22456b4a9bc8))
* timelapse custom park position ([#686](https://github.com/fluidd-core/fluidd/issues/686)) ([efba69b](https://github.com/fluidd-core/fluidd/commit/efba69bfa98b279dda5e189741e3f9aa82ca5503))

## [1.18.0](https://github.com/fluidd-core/fluidd/compare/v1.17.2...v1.18.0) (2022-04-30)


### Features

* add full-screen button to the Jobs card ([#616](https://github.com/fluidd-core/fluidd/issues/616)) ([ce47233](https://github.com/fluidd-core/fluidd/commit/ce47233873c17074f8eb3f6da21c912957a858d4))
* add full-screen console view ([#613](https://github.com/fluidd-core/fluidd/issues/613)) ([b8f17e6](https://github.com/fluidd-core/fluidd/commit/b8f17e6e28fe4f1e0ad4ba2a29d3b2d87eda30c4))
* add Reset button to File Editor settings ([#594](https://github.com/fluidd-core/fluidd/issues/594)) ([e8a6731](https://github.com/fluidd-core/fluidd/commit/e8a67318c23b9ea0b65c099cac974b83bc29b8fd))
* adds delta support to gcode viewer ([#591](https://github.com/fluidd-core/fluidd/issues/591)) ([3dca83e](https://github.com/fluidd-core/fluidd/commit/3dca83e74ffce7f263d89c97f171ba4b9d3cb01f))
* adds Pressure Advance support ([#588](https://github.com/fluidd-core/fluidd/issues/588)) ([2090c59](https://github.com/fluidd-core/fluidd/commit/2090c59c436e38575f19fb3f152b557805904591))
* adjustable toolhead move distances ([#590](https://github.com/fluidd-core/fluidd/issues/590)) ([7b115ec](https://github.com/fluidd-core/fluidd/commit/7b115ec81bca10ea029082597806aafb31253b3f))
* calculate linear progress ([#633](https://github.com/fluidd-core/fluidd/issues/633)) ([2efa85d](https://github.com/fluidd-core/fluidd/commit/2efa85d460bda06407ebddce16d41cba85ee7d18))
* formats weight as human readable ([#628](https://github.com/fluidd-core/fluidd/issues/628)) ([49d03e5](https://github.com/fluidd-core/fluidd/commit/49d03e51866dda09c16774ac2da72e1258edf52a))
* **i18n-HU:** update Hungarian translation ([#634](https://github.com/fluidd-core/fluidd/issues/634)) ([db84b02](https://github.com/fluidd-core/fluidd/commit/db84b0255babb1bb46b7d76e7f5554f352592c31))
* **i18n-HU:** update Hungarian translation ([#640](https://github.com/fluidd-core/fluidd/issues/640)) ([e7b9716](https://github.com/fluidd-core/fluidd/commit/e7b9716a6679a99c3d9a69eea742094bd7575495))
* **i18n-JA:** adds Japanese language ([#585](https://github.com/fluidd-core/fluidd/issues/585)) ([08a44eb](https://github.com/fluidd-core/fluidd/commit/08a44eb75278d1f0da5935494ed827312fe0f593))
* implement Moonraker announcements ([#642](https://github.com/fluidd-core/fluidd/issues/642)) ([481f20e](https://github.com/fluidd-core/fluidd/commit/481f20e445c6b9d8eb926d43f493ef18a67edd2b))
* marks g-code preview non-beta ([#620](https://github.com/fluidd-core/fluidd/issues/620)) ([e61cd33](https://github.com/fluidd-core/fluidd/commit/e61cd3341d438013157346bdbb0cb132bffff02e))
* show live position ([#645](https://github.com/fluidd-core/fluidd/issues/645)) ([136af75](https://github.com/fluidd-core/fluidd/commit/136af7552230c347a64d8c1ab93cd203379fc27e))
* show pressure and humidity from sensors ([#538](https://github.com/fluidd-core/fluidd/issues/538)) ([9c5e904](https://github.com/fluidd-core/fluidd/commit/9c5e9044edec84c4489cfe912004644086b1a6a6))
* support for moonraker socket connection identification ([#568](https://github.com/fluidd-core/fluidd/issues/568)) ([7a6b6d0](https://github.com/fluidd-core/fluidd/commit/7a6b6d0166536eefda1d0d5280c6a4e7e3cba2e3))
* **thermals:** display rate of change for all temperature sensors ([#575](https://github.com/fluidd-core/fluidd/issues/575)) ([4cf6f43](https://github.com/fluidd-core/fluidd/commit/4cf6f4348931d86460b5595951466e08867c81de))
* timelapse browser ([#610](https://github.com/fluidd-core/fluidd/issues/610)) ([de02081](https://github.com/fluidd-core/fluidd/commit/de0208146cb77eb3b8b172c4af4c39d7989d2ae5))
* **ui:** make color picker movable ([#577](https://github.com/fluidd-core/fluidd/issues/577)) ([a8c16af](https://github.com/fluidd-core/fluidd/commit/a8c16af3c27e9d44274e2f1fe1854bfe0551d844))
* unsaved editor close confirmations when unloading the page ([#584](https://github.com/fluidd-core/fluidd/issues/584)) ([999af77](https://github.com/fluidd-core/fluidd/commit/999af77fb956dc8a8d3cfb71d3fe4b584b5bfdf7))


### Bug Fixes

* allow decimals in slider bound text controls ([#604](https://github.com/fluidd-core/fluidd/issues/604)) ([863c0b2](https://github.com/fluidd-core/fluidd/commit/863c0b289b3de522dbef64767b881960654acd16))
* auto-determination of base printer ([#583](https://github.com/fluidd-core/fluidd/issues/583)) ([e97a0cb](https://github.com/fluidd-core/fluidd/commit/e97a0cbe3e32dfdaee1da9ed59dd9ad6ed24b542))
* fully unload dialogs when not in use ([#627](https://github.com/fluidd-core/fluidd/issues/627)) ([25d5e29](https://github.com/fluidd-core/fluidd/commit/25d5e29645fabfbd60590faf4a046f5eb27efcaf))
* **i18n-HU:** improve Hungarian translations ([#614](https://github.com/fluidd-core/fluidd/issues/614)) ([d1c5913](https://github.com/fluidd-core/fluidd/commit/d1c59130e93df8e1c24cbfdf67a8d83852ad61b4))
* **i18n-PT:** use localized label ([#587](https://github.com/fluidd-core/fluidd/issues/587)) ([aa6d241](https://github.com/fluidd-core/fluidd/commit/aa6d2419447844945273b381b0b93208b5994fd9))
* **i18n:** add missing 'cancelled' translation ([#574](https://github.com/fluidd-core/fluidd/issues/574)) ([4d18c13](https://github.com/fluidd-core/fluidd/commit/4d18c134b008e5865b83b2488c6e0cf0385ed04e))
* **i18n:** improve Hungarian translations ([#576](https://github.com/fluidd-core/fluidd/issues/576)) ([6af6e59](https://github.com/fluidd-core/fluidd/commit/6af6e5977775166c98b853d7f98d71e159e4c0a6))
* improves macro params default values parsing ([#651](https://github.com/fluidd-core/fluidd/issues/651)) ([11280a7](https://github.com/fluidd-core/fluidd/commit/11280a7e86970fa0a83ecb1739dc44a48605197c))
* improves ToolheadSettings rules and validation ([#593](https://github.com/fluidd-core/fluidd/issues/593)) ([1780081](https://github.com/fluidd-core/fluidd/commit/1780081c5c81fbc61661dc96672edb537c895cde))
* layout database data handling ([#636](https://github.com/fluidd-core/fluidd/issues/636)) ([7773f02](https://github.com/fluidd-core/fluidd/commit/7773f020c229e0fe1bead9cc8a8f278d8e556944))
* layout resize wrapping ([#648](https://github.com/fluidd-core/fluidd/issues/648)) ([9c05f52](https://github.com/fluidd-core/fluidd/commit/9c05f52b54cf250076c57b3b43298ae041b41fbb))
* show simple editor on mobile ([#649](https://github.com/fluidd-core/fluidd/issues/649)) ([deb139e](https://github.com/fluidd-core/fluidd/commit/deb139e9ef8e13651b8d01bbaa74b2b591d448ce))
* thermals chart legend selection event ([#615](https://github.com/fluidd-core/fluidd/issues/615)) ([f8cac27](https://github.com/fluidd-core/fluidd/commit/f8cac272f4255247126f16710601b0db3565db6a))
* thumbnail URI encoding ([#618](https://github.com/fluidd-core/fluidd/issues/618)) ([30efd5f](https://github.com/fluidd-core/fluidd/commit/30efd5ff12848c1c7e7dda654c7cee4a7feb0f65))
* thumbnail URI encoding ([#622](https://github.com/fluidd-core/fluidd/issues/622)) ([ff50dae](https://github.com/fluidd-core/fluidd/commit/ff50daeedf2cdb79347b94b5f8fcb80613c91d55))
* Toolhead and ZHeightAdjust layout ([#606](https://github.com/fluidd-core/fluidd/issues/606)) ([63fd72f](https://github.com/fluidd-core/fluidd/commit/63fd72f9edfe734ceda0cb80946d27aa1c5e2c0a))
* TouchEvent is not defined on Firefox desktop ([#601](https://github.com/fluidd-core/fluidd/issues/601)) ([34173ad](https://github.com/fluidd-core/fluidd/commit/34173ad8fb0fee4f256b74ca60890f9dc5eb8e7b))
* typescript issues ([#589](https://github.com/fluidd-core/fluidd/issues/589)) ([fa05c0c](https://github.com/fluidd-core/fluidd/commit/fa05c0cd0fdf5f2aec5bdaa22f2b2c54a79c991d))
* typescript type narrowing ([#619](https://github.com/fluidd-core/fluidd/issues/619)) ([abe98a0](https://github.com/fluidd-core/fluidd/commit/abe98a0b022f595e65a60e9f6bfbbb824dc3d8cf))

## [1.17.2](https://github.com/fluidd-core/fluidd/compare/v1.17.1...v1.17.2) (2022-03-13)


### Features

* **ui:** display localized printer state in printer status card ([#563](https://github.com/fluidd-core/fluidd/issues/563)) ([1d58769](https://github.com/fluidd-core/fluidd/commit/1d587699394d1b37e90cf3317409ab375a440eda))
* adds some missing i18n keys ([#557](https://github.com/fluidd-core/fluidd/issues/557)) ([c23cb3a](https://github.com/fluidd-core/fluidd/commit/c23cb3a60d847f7cafd284d0bbd1c7a9855026c8))


### Bug Fixes

* individual object layer count ([#572](https://github.com/fluidd-core/fluidd/issues/572)) ([da8f3d2](https://github.com/fluidd-core/fluidd/commit/da8f3d29ddfb04a065424cc7d42e55f71cd05cbe))
* shows missing macro parameters ([#566](https://github.com/fluidd-core/fluidd/issues/566)) ([18da8e4](https://github.com/fluidd-core/fluidd/commit/18da8e4d5b108626a318656bc6b3292ca9c49d46))
* typescript typings ([#559](https://github.com/fluidd-core/fluidd/issues/559)) ([8d51e05](https://github.com/fluidd-core/fluidd/commit/8d51e05f41fa500af929b92fa6eaedd41fb97b39))

## [1.17.1](https://github.com/fluidd-core/fluidd/compare/v1.17.0...v1.17.1) (2022-03-02)


### Bug Fixes

* add missing default for idle fps input ([#543](https://github.com/fluidd-core/fluidd/issues/543)) ([21475cf](https://github.com/fluidd-core/fluidd/commit/21475cf6178fbf020d91b5ac377710dadcc27625))
* Alias for uncategorized macro ([#548](https://github.com/fluidd-core/fluidd/issues/548)) ([b01248e](https://github.com/fluidd-core/fluidd/commit/b01248ee86b4764c5740de93f4be1c7b34902b0f))
* attempt to fix temp chart issues ([#551](https://github.com/fluidd-core/fluidd/issues/551)) ([5ba5160](https://github.com/fluidd-core/fluidd/commit/5ba5160fb8586c8dcbbc84a585db48c8249c494e))
* emergency stop button outside iphone safe zone ([#549](https://github.com/fluidd-core/fluidd/issues/549)) ([1139c2a](https://github.com/fluidd-core/fluidd/commit/1139c2ac79a4d0cface1b58daed57c123d6a8746))
* filename wrap in status window ([#544](https://github.com/fluidd-core/fluidd/issues/544)) ([a034190](https://github.com/fluidd-core/fluidd/commit/a03419083adcbc0c7e2fbb745c01bc6bb57e6a00))
* gcode preview loading ([#552](https://github.com/fluidd-core/fluidd/issues/552)) ([c59a28c](https://github.com/fluidd-core/fluidd/commit/c59a28ce9109f93e6057f8e3f2475cf770f5d757))
* idle fps behavior ([#553](https://github.com/fluidd-core/fluidd/issues/553)) ([2a551a4](https://github.com/fluidd-core/fluidd/commit/2a551a4c4f03ea119329de0372f02fb0c6870f71))
* use correct temperature_store_size for temps ([#555](https://github.com/fluidd-core/fluidd/issues/555)) ([f4ebfab](https://github.com/fluidd-core/fluidd/commit/f4ebfab3e3fd1ece2fc3ebf05fa20e24d051d4ec))
* z-offset apply ([#547](https://github.com/fluidd-core/fluidd/issues/547)) ([e63a73e](https://github.com/fluidd-core/fluidd/commit/e63a73ed2ed9adbf9e2e3a8f7838efb4ee7da94f))

## [1.17.0](https://github.com/fluidd-core/fluidd/compare/v1.16.2...v1.17.0) (2022-02-25)


### Features

* Add full-screen button to camera view ([#525](https://github.com/fluidd-core/fluidd/issues/525)) ([183e136](https://github.com/fluidd-core/fluidd/commit/183e1361e2c33e802351d62fc7ca2218072a6d57))
* add reset history ([#483](https://github.com/fluidd-core/fluidd/issues/483)) ([3d379d1](https://github.com/fluidd-core/fluidd/commit/3d379d1bbf6fc511732e6da06c467efeb22e9e53))
* adds optional confirmation for power device toggle ([#388](https://github.com/fluidd-core/fluidd/issues/388)) ([bc32627](https://github.com/fluidd-core/fluidd/commit/bc32627267ea9565f3350315b7b552c086cbf4cb))
* adjust page title order when printing ([#493](https://github.com/fluidd-core/fluidd/issues/493)) ([ed83f5c](https://github.com/fluidd-core/fluidd/commit/ed83f5cc9c5b5e4ca9b181fbd4cf24b108706773))
* alias for macro ([#479](https://github.com/fluidd-core/fluidd/issues/479)) ([e33839b](https://github.com/fluidd-core/fluidd/commit/e33839b1f81fb96423a3210e7cda90707e2ee410))
* Date/Time format ([#362](https://github.com/fluidd-core/fluidd/issues/362)) ([e6c5a9b](https://github.com/fluidd-core/fluidd/commit/e6c5a9b35c4c6e1ceb67de43ebb78e0fbedbb8ce))
* disable position field if not homed ([#507](https://github.com/fluidd-core/fluidd/issues/507)) ([003c25a](https://github.com/fluidd-core/fluidd/commit/003c25a661d87872918979aedad4711ddf6327ce))
* edit on click ([#514](https://github.com/fluidd-core/fluidd/issues/514)) ([17e9dfc](https://github.com/fluidd-core/fluidd/commit/17e9dfc312de6f887f41495adeac9e51a812caeb))
* editor close confirmation when dirty ([#441](https://github.com/fluidd-core/fluidd/issues/441)) ([8729e45](https://github.com/fluidd-core/fluidd/commit/8729e457c2142e6f8af3cabae0df2b1f645cbaaf))
* enhanced console filtering ([#486](https://github.com/fluidd-core/fluidd/issues/486)) ([9f45879](https://github.com/fluidd-core/fluidd/commit/9f458791c7580db6e1fb6c4075f9f017f2747576))
* Expanded Service State ([#504](https://github.com/fluidd-core/fluidd/issues/504)) ([6a7b23b](https://github.com/fluidd-core/fluidd/commit/6a7b23b2856572189686f95cb360239956f04c61))
* gcode viewer group lower layers ([#469](https://github.com/fluidd-core/fluidd/issues/469)) ([68248a8](https://github.com/fluidd-core/fluidd/commit/68248a8a6860ec250672136dff9058a07549019e))
* idle camera FPS ([#500](https://github.com/fluidd-core/fluidd/issues/500)) ([28925b2](https://github.com/fluidd-core/fluidd/commit/28925b2d6893e4efbaea9c7d7682f0e1fa476adc))
* make each axis controllable after homing ([#478](https://github.com/fluidd-core/fluidd/issues/478)) ([d931646](https://github.com/fluidd-core/fluidd/commit/d9316467e172738a855e42d08fe2db2bbff1bb50))
* Non-controllable fan On/Off ([#477](https://github.com/fluidd-core/fluidd/issues/477)) ([2795e7b](https://github.com/fluidd-core/fluidd/commit/2795e7b6d52d3b9f56435ec95c335a748a530df2))
* option to flip console direction ([#522](https://github.com/fluidd-core/fluidd/issues/522)) ([79cf350](https://github.com/fluidd-core/fluidd/commit/79cf35070dfb0f23e45afc347550e962fda7b01b))
* pause autoscroll when back scrolling ([#495](https://github.com/fluidd-core/fluidd/issues/495)) ([bf353fd](https://github.com/fluidd-core/fluidd/commit/bf353fd60faf399fb5afbe2aa6b3afcca2b40e8a))
* save z-offset changes ([#489](https://github.com/fluidd-core/fluidd/issues/489)) ([0cf6c87](https://github.com/fluidd-core/fluidd/commit/0cf6c87cc661edfc533d62d009ad43a31b2e1886))
* show klipper warnings ([#505](https://github.com/fluidd-core/fluidd/issues/505)) ([7cf3ce3](https://github.com/fluidd-core/fluidd/commit/7cf3ce3c53b7a0b049883a41c7659bb196e36d56))
* show moonraker warnings ([#481](https://github.com/fluidd-core/fluidd/issues/481)) ([7355c28](https://github.com/fluidd-core/fluidd/commit/7355c287433bb29930e14b5c21a246375b3cbe98))
* show qr-code with api key ([#523](https://github.com/fluidd-core/fluidd/issues/523)) ([6eab704](https://github.com/fluidd-core/fluidd/commit/6eab704f7eab599035419cf9a28365f493b2f8a5)), closes [#411](https://github.com/fluidd-core/fluidd/issues/411)
* SnakeOil theme ([#382](https://github.com/fluidd-core/fluidd/issues/382)) ([7dd941c](https://github.com/fluidd-core/fluidd/commit/7dd941c7f7251e32542f77dbb84973b6ce640ec5))
* temperature rate of change ([#496](https://github.com/fluidd-core/fluidd/issues/496)) ([30a2628](https://github.com/fluidd-core/fluidd/commit/30a26287d3a3a33743e03186745cee0a70ce6d53))
* TURN_OFF_HEATERS confirmation in temperature presets ([#527](https://github.com/fluidd-core/fluidd/issues/527)) ([fec1f88](https://github.com/fluidd-core/fluidd/commit/fec1f88311e8bfb34be9fbeb4421ecb648ba1d19))
* **i18n-RU:** update ru.yaml ([#513](https://github.com/fluidd-core/fluidd/issues/513)) ([a81ba12](https://github.com/fluidd-core/fluidd/commit/a81ba12b8cc6dd69f936e23c92d173a12fde308c))


### Bug Fixes

* actual end time calculation ([#379](https://github.com/fluidd-core/fluidd/issues/379)) ([4f2940b](https://github.com/fluidd-core/fluidd/commit/4f2940b4932680e9327ec88a08111a7f4bcecaa9))
* add missing type ([a0dcf61](https://github.com/fluidd-core/fluidd/commit/a0dcf61c561946a4583b6dd98433b96bc505a29f))
* directory sorting ([#492](https://github.com/fluidd-core/fluidd/issues/492)) ([a2cb15e](https://github.com/fluidd-core/fluidd/commit/a2cb15ee5cbe382a62624c4274d0ba8688ed84de))
* display correct fan speed when using 'fan max_power' setting ([#391](https://github.com/fluidd-core/fluidd/issues/391)) ([b809a2c](https://github.com/fluidd-core/fluidd/commit/b809a2c92415de728a00ac0fdecc64441d42200f))
* firmware retractation length stuck at 0 ([#497](https://github.com/fluidd-core/fluidd/issues/497)) ([ad8f636](https://github.com/fluidd-core/fluidd/commit/ad8f636fe712649fe8d1feed418e232353eee51a))
* generic fans with off_below set now apply validators correctly ([a0e6234](https://github.com/fluidd-core/fluidd/commit/a0e6234f1fb2791216931e3ed3b717f8ab5d8873))
* improves macro param default value handling ([#524](https://github.com/fluidd-core/fluidd/issues/524)) ([06c05d2](https://github.com/fluidd-core/fluidd/commit/06c05d2cc21722a5dd77c0f53e355050357c6f47))
* IPv6 support for thumbnails ([#439](https://github.com/fluidd-core/fluidd/issues/439)) ([e1968ea](https://github.com/fluidd-core/fluidd/commit/e1968ea8fa2fd7ffe780952ae55d72ece1501fb9))
* keep camera select menu always enabled ([#503](https://github.com/fluidd-core/fluidd/issues/503)) ([7122b9e](https://github.com/fluidd-core/fluidd/commit/7122b9ef6795f96430eb97bd7a1fe5f0c20f488f))
* revert ECharts changes previously introduced ([#512](https://github.com/fluidd-core/fluidd/issues/512)) ([5a7796a](https://github.com/fluidd-core/fluidd/commit/5a7796a5a66ea13a8b6cbe9a0f8e8c96b8e39e2d)), closes [#482](https://github.com/fluidd-core/fluidd/issues/482)
* reverts homing override checks in ToolheadMoves.vue ([#529](https://github.com/fluidd-core/fluidd/issues/529)) ([cc000e0](https://github.com/fluidd-core/fluidd/commit/cc000e05f855e85ea9293033095efbec9e5098f6)), closes [#528](https://github.com/fluidd-core/fluidd/issues/528)
* service state item layout balance ([#535](https://github.com/fluidd-core/fluidd/issues/535)) ([08c00cc](https://github.com/fluidd-core/fluidd/commit/08c00cc584df1e1ea8ff83a2d53ccbccb1af5c30))
* Spanish translate file ([#475](https://github.com/fluidd-core/fluidd/issues/475)) ([a908306](https://github.com/fluidd-core/fluidd/commit/a908306272e9ad070de7fd329eeabecdbc627f73))
* tipo Date Time Format ([#487](https://github.com/fluidd-core/fluidd/issues/487)) ([cfb6661](https://github.com/fluidd-core/fluidd/commit/cfb6661d861f87563798cccc7e3d247b595c781c))
* typo in spanish translation ([80acaea](https://github.com/fluidd-core/fluidd/commit/80acaeaac281e99b993a7986bcc6411cc2d72d28))
* websocket cache issue with arrays ([#510](https://github.com/fluidd-core/fluidd/issues/510)) ([731d67e](https://github.com/fluidd-core/fluidd/commit/731d67ecc6d0611d576a18e6c03eddb9fcf7feed))
* z move speed issue ([#488](https://github.com/fluidd-core/fluidd/issues/488)) ([dbd100a](https://github.com/fluidd-core/fluidd/commit/dbd100ab1a4761191b34134442d1f6951bf5fbaf))

## [1.16.2](https://github.com/cadriel/fluidd/compare/v1.16.1...v1.16.2) (2021-07-09)


### Bug Fixes

* don't block connection on fresh moonraker databases ([cc39708](https://github.com/cadriel/fluidd/commit/cc397081627e8dba76be6ea46bdc41fa40ad85d5))

## [1.16.1](https://github.com/cadriel/fluidd/compare/v1.16.0...v1.16.1) (2021-07-09)


### Bug Fixes

* camera urls no longer cause performance issues ([2a63d79](https://github.com/cadriel/fluidd/commit/2a63d7928375db9af589b289474073dc9345d008))
* don't retry roots if our first failed ([4f86713](https://github.com/cadriel/fluidd/commit/4f86713363dd36f61d748bff9c244c0897d6721f))

## [1.16.0](https://github.com/cadriel/fluidd/compare/v1.15.0...v1.16.0) (2021-07-08)


### Features

* Add Arabic Language Support ([88caeae](https://github.com/cadriel/fluidd/commit/88caeae6e5a550cf61dad59d9b696b6a8a22ead5))
* add reconnect option to disconnected screen ([48e770b](https://github.com/cadriel/fluidd/commit/48e770b70989c570809767ba312a800f8eacb32b))
* add un-retract extra length ([e6c2d07](https://github.com/cadriel/fluidd/commit/e6c2d077f88df6029917a1a6acee58e9d80f6d28))
* allow custom gcode to run with thermal presets ([782cfd4](https://github.com/cadriel/fluidd/commit/782cfd427a650887a43c78c90cef74869277e7e2))
* allow multi-line console entry ([2150221](https://github.com/cadriel/fluidd/commit/2150221a1b8726d9c75fcd028a87342afcf52d6e))
* allow some notifications to not add to the counter ([5100793](https://github.com/cadriel/fluidd/commit/5100793c548059ac9f50069590cabbc12cad8652))
* allow speed / flow to be overridden ([80da599](https://github.com/cadriel/fluidd/commit/80da599c2e99a15184f86e1724f7b4783fe1230e))
* assume http when adding printers ([d5d6bcb](https://github.com/cadriel/fluidd/commit/d5d6bcb5d8d28108a00f6d9a847955b01807456a))
* socket cache ([6bd05fd](https://github.com/cadriel/fluidd/commit/6bd05fd30db5508c0d5fea43ce1126d42b137918))
* status refactor ([ebe7fa2](https://github.com/cadriel/fluidd/commit/ebe7fa297413ce5e62056604df0fc0cce8b3e823))
* ZeroG Theme ([a021e19](https://github.com/cadriel/fluidd/commit/a021e19c3d7edf7913a8232137dfaac6520b9a03))
* **i18n-FR:** update french translations - Biorn1950 ([e4893c1](https://github.com/cadriel/fluidd/commit/e4893c1bfb8022098da1894c6deb562c4088b194))


### Bug Fixes

* Added 25 and 50 to default toolhead move lengths ([29248a6](https://github.com/cadriel/fluidd/commit/29248a664f03417f1db6b3d7d1781af8a511dcda))
* better handle cases where socket proxy disappears ([77895e4](https://github.com/cadriel/fluidd/commit/77895e41bcd29449cc29c3f17cf5a1898625da65))
* charts all properly load on page refresh ([8b70c2f](https://github.com/cadriel/fluidd/commit/8b70c2f7fda9069aac0d89022702ce0677719dc5))
* console error when input invalid val on layer gcode preview ([6e6af02](https://github.com/cadriel/fluidd/commit/6e6af02af1a2b6d13985a06fb5f4958ad2a51fba))
* disable double-tap to zoom on btn's for mobile ([5f0d572](https://github.com/cadriel/fluidd/commit/5f0d572bb0b8254d0ad5f98130b8175ae82a2ce3))
* disable mobile breakpoint for history and reprint tables ([8e76ee2](https://github.com/cadriel/fluidd/commit/8e76ee215743883858111f7aea1221a0c9de2175))
* disable tab swiped on reprint tab ([0003f60](https://github.com/cadriel/fluidd/commit/0003f6019af2da5ec19d9f624ecb4a62330d7e6a))
* don't add unrealistic load values ([e938e07](https://github.com/cadriel/fluidd/commit/e938e07f822561ed8526319916fb6bd42e0a1711))
* don't override url params for cameras ([a67758e](https://github.com/cadriel/fluidd/commit/a67758e2b3fbf5ff4b9d78815361a4039914a84c))
* don't show redundant klipper / moonraker services ([1215eb7](https://github.com/cadriel/fluidd/commit/1215eb7072e8b211aeec3f018b35191f83e9c1c7))
* don't show status fields with irrelevant data ([7106422](https://github.com/cadriel/fluidd/commit/71064225df2f06afe49a887741111842e0c46ee2))
* don't show the end time for history items in progress ([4870da7](https://github.com/cadriel/fluidd/commit/4870da7b2694d7a280898bf39f34e0ffb50eaa46))
* editing a gcode mid-string in console now works as expected ([6a3ca62](https://github.com/cadriel/fluidd/commit/6a3ca6219b10ed8705a5e50764d9291d940258a2))
* enable mesh controls during a print ([35e5eec](https://github.com/cadriel/fluidd/commit/35e5eec809b18eb18331a58a6184f1953d2f263b))
* end time now works ([570baf4](https://github.com/cadriel/fluidd/commit/570baf47be194a40d45c9d5c3e5fd6c0bcd96c11))
* ensure initial addition of printer is added with non-std ports ([c0ec9dd](https://github.com/cadriel/fluidd/commit/c0ec9ddc309abe020e781d12590472e7ba9f0e64))
* ensure klippy card shows when klippy not connected ([a41d422](https://github.com/cadriel/fluidd/commit/a41d422753590b7e319cff7e2af8b0e633e73104))
* Have system load represent actual load average number ([4bc85f4](https://github.com/cadriel/fluidd/commit/4bc85f436d4cf78d7d100272fa9f67980d174b59))
* improve gcode viewer sync on layer changes ([7a7484d](https://github.com/cadriel/fluidd/commit/7a7484d0e6420c68ecac3a0f52893153eb0e9cc6))
* increase retract / unretract limits ([4a1e218](https://github.com/cadriel/fluidd/commit/4a1e2186f6c9666b01ab14cbeef5410f71e00039))
* invalid ar values ([cbb2426](https://github.com/cadriel/fluidd/commit/cbb242664404730542cc734b22664cb782ec8921))
* layouts on smaller screens with sliders ([1d335b5](https://github.com/cadriel/fluidd/commit/1d335b55d84df23c1a2bf3ffa11a7af11e46be2e))
* macro entry no longer produces duplicate params ([668586c](https://github.com/cadriel/fluidd/commit/668586c272e158d7c2385aa655f12c5e3b6fad6c))
* minor display tweaks for charts on mobile ([5c5a8ec](https://github.com/cadriel/fluidd/commit/5c5a8ecabd356a7012d9b806e2be8fa0f1d65aa5))
* mobile layout no longer has wonky margins with condensed cards ([3900b26](https://github.com/cadriel/fluidd/commit/3900b2612fb21ccc4dd1a63278d0fd8c72a22714))
* multi-root file-systems correctly load when root[0] is unavailable ([df664d3](https://github.com/cadriel/fluidd/commit/df664d3dc05d97fee8b9c5dec535bc6229d0ef0c))
* pathing issue with file updates ([32563d3](https://github.com/cadriel/fluidd/commit/32563d37c457d32f2e8e455062eb351a4e9a1ff6))
* reduce temp input to reduce scrollbar showing up ([2766157](https://github.com/cadriel/fluidd/commit/27661579b2b15f68ff0bc114294212a410ec8414))
* remove api key copy btn ([4603a33](https://github.com/cadriel/fluidd/commit/4603a33866ad6efdf137ac72ab0ab9611294eb9f))
* removing all cams now won't break the dash ([51be9f8](https://github.com/cadriel/fluidd/commit/51be9f895f9475fdcece0a7fdbc7da727d6be30a))
* rename dialog is no longer persistent ([43536e2](https://github.com/cadriel/fluidd/commit/43536e2dda1fb7d510dc628d6d728f1a90b784c0))
* resolve slowdown when loading gcode store ([5146e4f](https://github.com/cadriel/fluidd/commit/5146e4f4059601b36c505c8eb5284e8e59f97bd8))
* server deploy now has theme options by default ([7700386](https://github.com/cadriel/fluidd/commit/7700386b285fb4b7dd0116439080288bc502e7de))
* update notification now properly clears after an update ([598a258](https://github.com/cadriel/fluidd/commit/598a258e4b9f96ad4baba6d9f28509990117a7fd))

## [1.15.0](https://github.com/cadriel/fluidd/compare/v1.14.0...v1.15.0) (2021-06-22)


### Features

* Absolute end time estimate. ([54e6d01](https://github.com/cadriel/fluidd/commit/54e6d0176f7c64ee579ed77990ef52cc95f5a15d))
* add layer count to print status ([7ccc457](https://github.com/cadriel/fluidd/commit/7ccc457d4f8e4d6de000f4d3575b89c0723dd675))
* add nav btn in mobile ([1d11de4](https://github.com/cadriel/fluidd/commit/1d11de4891cc54e25d6521bf9fb6aaa026a5e83a))
* Add vzbot community logo ([63eedfd](https://github.com/cadriel/fluidd/commit/63eedfd7ba0c0440d257d52f8606361816ff0864))
* added HevORT to community presets ([2364b5e](https://github.com/cadriel/fluidd/commit/2364b5ea33a32d19511e283cbc1702035403d2a1))
* allow disabling a macro while printing ([caa88b3](https://github.com/cadriel/fluidd/commit/caa88b30bd16912750b0af76d5e35f2187f11e5f))
* authentication ([48ed03b](https://github.com/cadriel/fluidd/commit/48ed03b9831b9618f8a77cc4764d030266d77110))
* bulk file actions ([a38a8fa](https://github.com/cadriel/fluidd/commit/a38a8fa29502f4de2c16185854bca8ea50d7284a))
* community affiliations + light theme cleanup ([6fd07b8](https://github.com/cadriel/fluidd/commit/6fd07b895eb0f821480a23048ce90482969fff0f))
* estop is now a button ([656abb7](https://github.com/cadriel/fluidd/commit/656abb70f7625703cc3df02e98fc63ed312c09ad))
* filter fans, pins and macros from the UI with an _ ([81a72d8](https://github.com/cadriel/fluidd/commit/81a72d86c57d4a45d39651d555528329ac2b07db))
* firmware retractions ([52d6dad](https://github.com/cadriel/fluidd/commit/52d6dad25fbe096b26c51c862d1b473371b734be))
* impl log grammar ([86bff7c](https://github.com/cadriel/fluidd/commit/86bff7cb78169cff065d75e1e7948067bfaa3bc8))
* impl logs root ([180b991](https://github.com/cadriel/fluidd/commit/180b99150b181b5fe8ab070e613f3a5f6f8f0d0d))
* limits now allow setting over the max ([1798196](https://github.com/cadriel/fluidd/commit/1798196a91a7f198ee1676e9fd450012b274cd24))
* macro button color accents ([c660e2f](https://github.com/cadriel/fluidd/commit/c660e2ff1beba772beff2e21141e0d1be9f95cb9))
* macro list now shows set color ([4eb24fc](https://github.com/cadriel/fluidd/commit/4eb24fc3ab89f0c59340bc599eb1b17882e90d52))
* macros now allow param input ([2cbf0ee](https://github.com/cadriel/fluidd/commit/2cbf0ee8f182b9ea5bbef6b0f472e31502ea0151))
* minor adjustments to layout actions ([852d615](https://github.com/cadriel/fluidd/commit/852d615c05bbe56303b7750703ca9f11e3d9147c))
* move auto-scroll to cog ([984de6f](https://github.com/cadriel/fluidd/commit/984de6f040f90cf5e60980bc680b3f741b3a1a92))
* neopixel support + new color picker ([8ef0453](https://github.com/cadriel/fluidd/commit/8ef04530a331d26a542f0daea30c86dc66533012))
* Replaced Mocha and Chai with Jest ([066d713](https://github.com/cadriel/fluidd/commit/066d71370e2e88499ee6d35d33c6b6488718f73f))
* **i18n-IT:** update Italian translations ([eb175cc](https://github.com/cadriel/fluidd/commit/eb175cc1c4382608b9ef2bed5b7f4dce4081ae2b))
* new nav ([f38407c](https://github.com/cadriel/fluidd/commit/f38407c1bf0233c03b2169bd0e0d0f3ba69783fd))
* re-enable g-code preview ([bfba301](https://github.com/cadriel/fluidd/commit/bfba30192add06585e8e36a7ffd0fa9f27ff5442))
* re-enable gcode preview ([63af077](https://github.com/cadriel/fluidd/commit/63af07764b5bfd892a1189aa48bb69bee8e443d0))
* reset btn for sliders, plus cleanup ([98545d5](https://github.com/cadriel/fluidd/commit/98545d50d5cf338077fb710b3b66e3a564a80804))
* sub-nav routes ([2e9db23](https://github.com/cadriel/fluidd/commit/2e9db234f29838870d9c8144d16fa5b4d7d83529))
* submitting an empty temp value resets to 0 ([f3153d4](https://github.com/cadriel/fluidd/commit/f3153d44eb881f4c5f86adb01167b9f82e732ab3))
* suffix graph tooltips mapped by dimension name ([881b43e](https://github.com/cadriel/fluidd/commit/881b43e1a30e084ef06d26ef8fd2e46f568989d4))
* support custom services, their config files & doc links ([f9540ca](https://github.com/cadriel/fluidd/commit/f9540cacf4001f0e05a006f0f549a2becb53a5ae))
* system utilization charts ([a167d14](https://github.com/cadriel/fluidd/commit/a167d1477ec566a45026c76ccf5f5bf25b4f8014))
* Ukrainian translation ([66df939](https://github.com/cadriel/fluidd/commit/66df9391dadb0c4b8522228ea68d152d45543353))


### Bug Fixes

* Add close icon to keyboard shortcuts dialog ([28309c4](https://github.com/cadriel/fluidd/commit/28309c4fb50dccb07c72a9b2289488233ef3881a))
* adjust mesh control layout plus define better scale defaults ([e2d8203](https://github.com/cadriel/fluidd/commit/e2d820390c8f96f9041dff8768d3d62b64234311))
* App slider now properly validates min / max on click ([883b0d1](https://github.com/cadriel/fluidd/commit/883b0d1ae7d549bf0581fcc9e2f7cf254b9075d9))
* cachebust thumbs ([324c69c](https://github.com/cadriel/fluidd/commit/324c69c980388cea90a3b7ebcc55d347910be7f0))
* chevron now reflects actual state for card collapse btn ([2a4858c](https://github.com/cadriel/fluidd/commit/2a4858c4040a1b47b480a224a6f65824d2b0047c))
* color presets now update picker ([9fe780f](https://github.com/cadriel/fluidd/commit/9fe780ff93d9babe7258feb2ff88af8e46839ed9))
* division by zero and infinite loop in file upload/download dialogs ([7e8785d](https://github.com/cadriel/fluidd/commit/7e8785d8c30afd80ce85d981a82f9992b525254c))
* don't show klippy card when socket or api not connected ([1bd6d96](https://github.com/cadriel/fluidd/commit/1bd6d9679eac571456328321ad176bf65e4b3e0d))
* ensure fetches are cancelled during add dialog ([950440d](https://github.com/cadriel/fluidd/commit/950440d92c6d749713f397ae51bae3a46517d5ab))
* estop on mobile now wont show when not connected ([f55fe57](https://github.com/cadriel/fluidd/commit/f55fe57ebe201da10b1d3056ca44768426afdd4b))
* extruder temp settings now respect selected extruder ([dea2c1d](https://github.com/cadriel/fluidd/commit/dea2c1dd34a4d7120b0179068b1ed9f87fcdce17))
* filter trailing slashes when adding printer urls ([47fcb54](https://github.com/cadriel/fluidd/commit/47fcb5494d1f0839a8c6b7240bb3afcb7f4be556))
* fix the i18 fix :D ([96bc9f2](https://github.com/cadriel/fluidd/commit/96bc9f26790988d1498f31811ee2fab0ba342dd5))
* long lines with no spaces in console are now visible ([fa99cc1](https://github.com/cadriel/fluidd/commit/fa99cc1bea17b09bfadeeece662dcce3eeb5b345))
* macro disabled while print now saves ([caa9b57](https://github.com/cadriel/fluidd/commit/caa9b57ba60989c8f2e13205ebdb46f607cc515f))
* mesh box and color scales now disabled appropriately ([df1cfff](https://github.com/cadriel/fluidd/commit/df1cfff65ad1b2fa1fd7ce013cf02952403e59f5))
* new color picker allows rgb input ([b5b87e9](https://github.com/cadriel/fluidd/commit/b5b87e9e117a02fa84b3fad2a4df6dafbf970951))
* parent folder no longer shows wonky size / modified ([943d395](https://github.com/cadriel/fluidd/commit/943d395a34911df0c1e0e134ed5cced10fe13bb6))
* preload the en locale for fallback ([accfde4](https://github.com/cadriel/fluidd/commit/accfde4d32a74136dd77877876c1536eb2c9db0b))
* readableFileSize test ([46a5375](https://github.com/cadriel/fluidd/commit/46a537590e40103e05d12555d0364ddef7078ff6))
* retraction resolution set to 0.01 ([c1a16dc](https://github.com/cadriel/fluidd/commit/c1a16dca347c78871704e0b7579ada94d906b241))
* syntax issue ([03c61e8](https://github.com/cadriel/fluidd/commit/03c61e8f62d6086889e6a30af7d7fa6a3a3327a2))
* temp chart selected legends now work properly after echarts upgrade ([8906abd](https://github.com/cadriel/fluidd/commit/8906abd93d9bcc09f5a949a0831bd9095e82eeb7))
* temp waits now idea items prefixed with 'ok' ([35a38c5](https://github.com/cadriel/fluidd/commit/35a38c5bb6fce591579b01c22b0e95281f520bab))

## [1.14.0](https://github.com/cadriel/fluidd/compare/v1.13.0...v1.14.0) (2021-05-18)


### Features

* append set_retraction to console autocompletion ([a81c1b7](https://github.com/cadriel/fluidd/commit/a81c1b76a6cb7951f642f7690a01ee932a8ce33e))
* gcode viewer ([d6675ae](https://github.com/cadriel/fluidd/commit/d6675ae925268fbfd19df644812ba0c60179c01d))
* implements inotify support via moonraker ([2208ea5](https://github.com/cadriel/fluidd/commit/2208ea5af44931fd70dad95797ddb318515fa899))
* support filament motion sensor ([33eddb2](https://github.com/cadriel/fluidd/commit/33eddb268808c8da99b5fdbd3ff9cd919c58a42d))
* support old notifications ([1ca6f64](https://github.com/cadriel/fluidd/commit/1ca6f64f8e68818f301bd6fe22f9348966c61b96))


### Bug Fixes

* filter thumbs ([5f28384](https://github.com/cadriel/fluidd/commit/5f2838413d0824fab1fae6676ef02329ef8c5246))
* history nav not shown when not enabled ([00d2b53](https://github.com/cadriel/fluidd/commit/00d2b53dd1051df309d243d4a9f483a4a3711ca1))
* stop restart buttons from swapping around ([137343a](https://github.com/cadriel/fluidd/commit/137343a888bf34a19d7cd36f796b1628721f8da5))
* white space when klippy is in error ([637b29a](https://github.com/cadriel/fluidd/commit/637b29adc779d32e1911a800d1b3777c2af0f4cd))

## [1.13.0](https://github.com/cadriel/fluidd/compare/v1.12.2...v1.13.0) (2021-05-07)


### Features

* **i18n-IT:** add Italian translations ([6ef58c6](https://github.com/cadriel/fluidd/commit/6ef58c651bf1c0a512e0e765570af92c20db89f0))
* **i18n-IT:** add missing keys to IT translation ([292d04c](https://github.com/cadriel/fluidd/commit/292d04ce7d0c3db675bd3fa227d17d1522f3303d))
* add feature request and bug report templates ([6db9968](https://github.com/cadriel/fluidd/commit/6db9968d854b41fb0380a8871dbf146f3eb44a65))
* add filament weight to job views ([bb389c3](https://github.com/cadriel/fluidd/commit/bb389c3f17167810a1f8ace968504992b8f191b5))
* add icon when camera disabled in settings ([95f63e5](https://github.com/cadriel/fluidd/commit/95f63e5ae9a82bed11a5f66f758b2bdedb995340))
* Add keyboard shortcuts dialog to file editor ([c527e76](https://github.com/cadriel/fluidd/commit/c527e76ed0d15655d6cac1528a16dc12394f0ead))
* allow cancelling uploads ([3ac295b](https://github.com/cadriel/fluidd/commit/3ac295bf96249b6e06067466dfb86cdc6fca86ec))
* allow users to require a confirm when clicking estop ([26a8ea6](https://github.com/cadriel/fluidd/commit/26a8ea644febcefd97591d127b1feac84111245c))
* card layouts saved to moonraker db ([37040a9](https://github.com/cadriel/fluidd/commit/37040a91832ad8854eb1125c120566b532daea3e))
* column picker for tabular data ([c1722a3](https://github.com/cadriel/fluidd/commit/c1722a346ac640158a51198a0cc1cc996288fbdc))
* console m112 invokes machine.emergency_stop ([4e54bf1](https://github.com/cadriel/fluidd/commit/4e54bf17ab13a17a2cd95e9ed0fa374225b0833f))
* link to correct config docs dependent on file being edited ([09db189](https://github.com/cadriel/fluidd/commit/09db18911f8f2f8bf1e1fc873379823f83315701))
* nav changes ([5ec057b](https://github.com/cadriel/fluidd/commit/5ec057bfcf74f12ca90ae5794f1574bb598a2c48))
* New macro management UI ([df61127](https://github.com/cadriel/fluidd/commit/df611276c6c619d1f7a9aa7685ff7203af36d0fc))
* notification menu + Pi throttle notifications ([613ab51](https://github.com/cadriel/fluidd/commit/613ab510a5cf7459fcb3a2715e2bbf872cddd342))
* now displays the full version string where applicable ([fdd7527](https://github.com/cadriel/fluidd/commit/fdd75278e8681fb2a2d59c4f77b66794a746e544))
* reduce the brightness of text a tad ([fa0930b](https://github.com/cadriel/fluidd/commit/fa0930bb7d84aa3d3948e8d298ad981fdeab0086))
* run macros with params ([9078e10](https://github.com/cadriel/fluidd/commit/9078e10222b92b541d21cbf63f52c19261e630f8))
* toolhead position axis are now inputs ([0630ecb](https://github.com/cadriel/fluidd/commit/0630ecb3c818dd5a9150373500baef42f4c20858))
* update cn translation ([66283a2](https://github.com/cadriel/fluidd/commit/66283a272c5cdb8464585c0bb2f87c85c8300864))


### Bug Fixes

* added visual aid and increased drag area when in layout mode ([655204f](https://github.com/cadriel/fluidd/commit/655204f1b8dc06194169a7d2fe5110069c2146b6))
* adds cachebust to thumbnail url ([1b17434](https://github.com/cadriel/fluidd/commit/1b17434e8651c4b6c02671a0da7cb6e681eb9cc4))
* Bed mesh now renders offset meshes properly + extra scale control ([d9c3b6e](https://github.com/cadriel/fluidd/commit/d9c3b6e249103521d18232a7103e46236587a50b))
* better handle network related errors ([397ad64](https://github.com/cadriel/fluidd/commit/397ad6495fb1b6c1c34f94aa5749770e5c81f25c))
* buttons no longer flicker during file actions ([5e395ad](https://github.com/cadriel/fluidd/commit/5e395ad5b4960aee5a64742dc0ada1948ee6a89a))
* card collapses now work properly ([df3c58c](https://github.com/cadriel/fluidd/commit/df3c58c4d5388c3016b08365302c986e508b7212))
* de language translation ([096565a](https://github.com/cadriel/fluidd/commit/096565a7cf6e1b8063738f9e578b6ff2876c5fd3))
* Don't disable webcamd restart during printing ([43afc3e](https://github.com/cadriel/fluidd/commit/43afc3e7a7245f3e8bf1a6aef63305016ea516fe))
* ensure light theme doesn't default on when no connection ([c72299d](https://github.com/cadriel/fluidd/commit/c72299deb80c3024a4f3cfe1f228d7b6179dbe6a))
* ensure moonraker returns all jobs when loading all ([28b5ac3](https://github.com/cadriel/fluidd/commit/28b5ac3e8635ceb873cffa94a976b410c805a138))
* Ensure sliders are default locked in a mobile environment ([19e5271](https://github.com/cadriel/fluidd/commit/19e5271706e5e7695a85ea4ce5d63e7c4dc0b126))
* File uploads via btn should now work properly ([add9272](https://github.com/cadriel/fluidd/commit/add9272cd488de12fd370f4a52722082f09885bb))
* getFile cancellation now works properly ([b955bfd](https://github.com/cadriel/fluidd/commit/b955bfda28a58bf07c13ab32f7fcc1a02a6bdf14))
* graph colors now properly reset when swapping printers ([8beb201](https://github.com/cadriel/fluidd/commit/8beb2013f913bd8f0184a27dfa3bec588737b39f))
* Increase default buffer for the console. ([e19cdaf](https://github.com/cadriel/fluidd/commit/e19cdaf3e12d7c5d12b0171a0839532b1c925adc))
* issue on initial startup merging uiSettings ([2ab89f4](https://github.com/cadriel/fluidd/commit/2ab89f4b7f060602f8cbd995a8179df87f5ea1a2))
* mesh layout controls on mobile ([60f2866](https://github.com/cadriel/fluidd/commit/60f2866432bf02ed435efcd4df75c30c149b56c9))
* moves estop to floating button in mobile view ([0d0cb68](https://github.com/cadriel/fluidd/commit/0d0cb68ba6b60538a44e1839c2fed39482581b3b))
* new dashboard components / removal should now be graceful ([d6c1031](https://github.com/cadriel/fluidd/commit/d6c103123e00c113265c5ddd7b1b9174707f9605))
* remove duplicate key ([be1eae6](https://github.com/cadriel/fluidd/commit/be1eae6c6dba21f66fe5fe20545e565125007ba8))
* resolves a monaco issue ([9a7f2b6](https://github.com/cadriel/fluidd/commit/9a7f2b6cb932fa5ffe082d2df4c1005192284e07))
* **firefox-download:** Fix ws disconnecting when downloading ([dd2ef81](https://github.com/cadriel/fluidd/commit/dd2ef81828f59d61eba2a796083739a46dc5416a))
* resolves highlighting issues for comments on config blocks ([a0c9e75](https://github.com/cadriel/fluidd/commit/a0c9e758b0eae2459c59837f90a52cf444f09242))
* send estop api endpoint AND m112 gcode via console ([c8681da](https://github.com/cadriel/fluidd/commit/c8681da592103ce47f879e7df6d2fbc53be8a35a))
* set a pwa start url ([98dc495](https://github.com/cadriel/fluidd/commit/98dc4950881fb629884be6aa8e0c416e08bd1d14))
* set min val to 0.1 for extruder length and speed vals ([88c9e42](https://github.com/cadriel/fluidd/commit/88c9e424dfb6c34325f09a4b23a32e082337f38e))
* Z adjust values now apply properly ([87dc3dc](https://github.com/cadriel/fluidd/commit/87dc3dcc4d3e9c045dbefcf685df7df88c8e6701))

## [1.12.2](https://github.com/cadriel/fluidd/compare/v1.12.1...v1.12.2) (2021-04-09)


### Bug Fixes

* file edit should now be enabled on smaller screens and mobile ([dc47eae](https://github.com/cadriel/fluidd/commit/dc47eae99e0ff43332bc7a65ab9a261aeead7650))

## [1.12.1](https://github.com/cadriel/fluidd/compare/v1.12.0...v1.12.1) (2021-04-08)


### Bug Fixes

* further sanity checks for file saves ([13e8fb4](https://github.com/cadriel/fluidd/commit/13e8fb4844caac21012b5e75cafec81c13b531e4))
* resolve file load / ready state issues ([645741e](https://github.com/cadriel/fluidd/commit/645741e048471be1b5eb90f4acb3924ec4df3595))
* sets default mesh scale to a more sane value ([73e03e4](https://github.com/cadriel/fluidd/commit/73e03e45c2e69fe099c442afbba1bd45badb9de8))

## [1.12.0](https://github.com/cadriel/fluidd/compare/v1.11.2...v1.12.0) (2021-04-08)


### Features

* adds actual print time to job page ([2dd0c94](https://github.com/cadriel/fluidd/commit/2dd0c94323e98c96583db76069a098565d54fbce))
* adjust print stats layout for tablet & down ([95815ca](https://github.com/cadriel/fluidd/commit/95815ca21a4aae5a2782ed5e6cdd2611d0757cca))
* allow klipper service restart from slide-out menu ([a6158c7](https://github.com/cadriel/fluidd/commit/a6158c758ef08a262a7420a50c8f5d95ff5a9c5c))
* allow loading all history ([2316776](https://github.com/cadriel/fluidd/commit/23167761dae14eaa2b9c6633ea0e786e34ca6d31))
* allow toggling a flat plane on new mesh ([edd28a5](https://github.com/cadriel/fluidd/commit/edd28a52b37bf22dacb855b8154a2522ebf2c385))
* allow toggling auto scroll with console ([a30bdb2](https://github.com/cadriel/fluidd/commit/a30bdb2ea4fb02682fe8bb459a5855337605cd27))
* allows disabling new version notifications ([8206671](https://github.com/cadriel/fluidd/commit/8206671b8360c2b2017c7c12cdb4f3e7a041426a))
* enable docs root under configuration ([6e86b6e](https://github.com/cadriel/fluidd/commit/6e86b6eb807fddb059fd6dd74a53adc7f2615ab2))
* hide editor buttons based on root path ([7ed1866](https://github.com/cadriel/fluidd/commit/7ed18660fccb4cf38d80f9c4a3d8b15cd880c861))
* impl light editor theme ([defc236](https://github.com/cadriel/fluidd/commit/defc2369a0eec21b9c794440cb00d5375f62a5ea))
* impl moonraker version recovery ([39efb0d](https://github.com/cadriel/fluidd/commit/39efb0d0450bb03426a4e6f208b6aea87c67d1fc))
* increase allowed z-adjust values ([0ce53b6](https://github.com/cadriel/fluidd/commit/0ce53b6a6d3869f3100e73214d41b89513fba3c6))
* new bed mesh lib and layout ([31260cd](https://github.com/cadriel/fluidd/commit/31260cd403c0450bdcbf9807e59dbf7a1acb3444))
* **console-help:** Moved console help to a tooltip ([2651c8b](https://github.com/cadriel/fluidd/commit/2651c8bf076215d4fe01cd698103764f47ec65a1))
* moves software updates to interface settings page ([33951a5](https://github.com/cadriel/fluidd/commit/33951a5e550fdd02028ce1ecc3074bd4ea81b7fd))
* rename interface to settings ([4da9c67](https://github.com/cadriel/fluidd/commit/4da9c6778e18a5bb17c1ed2ad2fb924eafad3afb))
* upload / download dialogs ([233ce67](https://github.com/cadriel/fluidd/commit/233ce6705575c88958e8212d6ebf71de2ed988dc))
* version commit history ([971fbb0](https://github.com/cadriel/fluidd/commit/971fbb016c36bb119636246b20463ea4b33c2e1d))
* VSCode file editor ([b81dec4](https://github.com/cadriel/fluidd/commit/b81dec4cc21bd6b6c59b35f97237d32ac85e7b7e))


### Bug Fixes

* adjust z-up icon ([c53f51f](https://github.com/cadriel/fluidd/commit/c53f51f97013a11e440b5af34b414a1a08a2cd88))
* Allow resetting lang to browser default ([657250c](https://github.com/cadriel/fluidd/commit/657250c82db3a1c1bcef9e2dff43db2ac574b0d3))
* Allow version updates in a disconnected state ([f5bfce0](https://github.com/cadriel/fluidd/commit/f5bfce0a1a617fc062562845776a93acfacbe42b))
* downloads with % in the filename now work ([4b5e081](https://github.com/cadriel/fluidd/commit/4b5e0817bec7add3c70207b355511d1d9c8ce74d))
* ensure editor is readonly when appropriate ([725f5b3](https://github.com/cadriel/fluidd/commit/725f5b37b335195b72c1de3fcfa27db692026ee7))
* ensure stores still init with no defined moonraker endpoints ([253cab4](https://github.com/cadriel/fluidd/commit/253cab4386471c09942ffdbbb31b4041a28d17d6))
* ensure the editor recieves the raw text of the file being edited ([122bc85](https://github.com/cadriel/fluidd/commit/122bc857a0396f76f1e9d831f7d7585e6d29023d))
* History now represents actual filament used properly. ([6631c44](https://github.com/cadriel/fluidd/commit/6631c44c4ec1cff218311757258552e8c1f625e2))
* increase height of vertical scroll ([6d83ba1](https://github.com/cadriel/fluidd/commit/6d83ba13683ab1a2991a8ed3bc9aab7c11d39bce))
* macro's with a decimal in their name should now show properly ([ae1dcd6](https://github.com/cadriel/fluidd/commit/ae1dcd606007d24779932691a48a27e5b4a5e653))
* remove edit / view file if on mobile ([c143786](https://github.com/cadriel/fluidd/commit/c14378622a2b92b299df76e064b4b7a653888ae8))
* shrink edit dialog buttons on smaller displays ([d5111a9](https://github.com/cadriel/fluidd/commit/d5111a976d01ea688046ff10d0b0351f8058bde7))

## [1.11.2](https://github.com/cadriel/fluidd/compare/v1.11.1...v1.11.2) (2021-03-28)


### Features

* add version update notification to collapsed hamburger menu ([bd8cc47](https://github.com/cadriel/fluidd/commit/bd8cc47b1daa1a2633b7456a5b5e58901596f6d9))
* allow single cams to fill the card space ([be96c50](https://github.com/cadriel/fluidd/commit/be96c5025530e347c08a353f09e42525d36028b0))


### Bug Fixes

* ensure history items are updated without needing to refresh ([40f0071](https://github.com/cadriel/fluidd/commit/40f0071f895694d24e0c23495d4f8aa503c5ad2d))
* error in console when initial locale not set ([d1b0560](https://github.com/cadriel/fluidd/commit/d1b0560c99b853142225fbfee0b28a24d726e66c))
* now inits plugins when no moonraker db data ([9314fe2](https://github.com/cadriel/fluidd/commit/9314fe23c1dafcf651d00644936ea7d38dce6de5))
* reprint not working when history is off ([08d2b8b](https://github.com/cadriel/fluidd/commit/08d2b8bafddc253cde5b513dc884b616f403b0ac))
* thumbs failing to load ([64f3a8f](https://github.com/cadriel/fluidd/commit/64f3a8fd7346ff8b28fa282f38847c14388de559))

## [1.11.1](https://github.com/cadriel/fluidd/compare/v1.11.0...v1.11.1) (2021-03-26)


### Bug Fixes

* camera when flipped is now position correctly ([1a16fe7](https://github.com/cadriel/fluidd/commit/1a16fe714b186008b0ebcc80f0b2034231bc9068))
* restart buttons not appearing under certain circumstances ([ed3bfa6](https://github.com/cadriel/fluidd/commit/ed3bfa69a36c78227891e120e8e8561258616ef2))
* Space now between z-adjust heading and value ([8b663ec](https://github.com/cadriel/fluidd/commit/8b663ec5bf09d9760c6a4dca4f7d35f91b4958ea))
* upload by button now works correctly ([9fd9d2d](https://github.com/cadriel/fluidd/commit/9fd9d2d8e29286851bce6da2c9bf9046ad021196))

## [1.11.0](https://github.com/cadriel/fluidd/compare/v1.10.0...v1.11.0) (2021-03-26)


### Features

* add automated dev build ([c78999d](https://github.com/cadriel/fluidd/commit/c78999d1ffccee88b6777deb41f163c411c77ce3))
* add basic error reporting to add instance dialog ([7799c1f](https://github.com/cadriel/fluidd/commit/7799c1f2f43627704a0dc2ae0ea2b75cfedb036b))
* add file-system filtering ([acd29ca](https://github.com/cadriel/fluidd/commit/acd29cad02586a9c06c570c04aa6fb11b9dac270))
* add preheat option to context menu ([0c42439](https://github.com/cadriel/fluidd/commit/0c42439b84148b4a4934def6ead6823cbcc6a1e4))
* allow file / folder moves ([aa08241](https://github.com/cadriel/fluidd/commit/aa08241c71aea19c4452b39d04deb696d51fcd69))
* btn override ([bb3ba73](https://github.com/cadriel/fluidd/commit/bb3ba739b354d1c48a1e78509d3a2445bfc8a0ac))
* btn text now properly reacts to background changes ([a3a5256](https://github.com/cadriel/fluidd/commit/a3a5256cf58367238ddbb224483b8ce9cacc4d35))
* configure available z-height adjustment values ([966ec8b](https://github.com/cadriel/fluidd/commit/966ec8b2c2e00d51fe10d81673fc1a858e242e12))
* expands re-print options when history plugin is enabled ([7fdf0a8](https://github.com/cadriel/fluidd/commit/7fdf0a8519cff89fd6b61b9a9119fe55ed5e85c6))
* filesystem path stored in memory ([656c1e1](https://github.com/cadriel/fluidd/commit/656c1e1d3ae445d7416d5b4cb2734e8b83650a51))
* Gcode position ([814f72d](https://github.com/cadriel/fluidd/commit/814f72d68e61e31c9576130d343c824ba146255e))
* Gcode position ([519148b](https://github.com/cadriel/fluidd/commit/519148bcd7e2e2bbdf385b8465e1500a59d6b2c2))
* incl full hash of moonraker and klipper in footer ([85b6e84](https://github.com/cadriel/fluidd/commit/85b6e84841fb6f9a03cbd4077d810010c5c20d89))
* load appropriate locale from user settings ([7968aee](https://github.com/cadriel/fluidd/commit/7968aee81a844138f381fb491e2d7e66ccbf62ab))
* low on space warning in file browser ([66fb0ad](https://github.com/cadriel/fluidd/commit/66fb0adbeb212292bbc843d8a895c086ff80be35))
* multiple cameras + adaptive streams ([98ff167](https://github.com/cadriel/fluidd/commit/98ff1674c9493f97139942d3d3ab18771b300445))
* printer stats + history ([aa71c7a](https://github.com/cadriel/fluidd/commit/aa71c7a44233f670d02b3cf28bbd78c5179decc2))
* Show gcode position instead of toolhead position ([776528b](https://github.com/cadriel/fluidd/commit/776528b32372aad73ad7546823036272d0c38628))
* sort TemperaturePresets ([4f0a30a](https://github.com/cadriel/fluidd/commit/4f0a30a56e17efcf4401c87fa440f15f9238b875))
* updates settings layout ([6d5149b](https://github.com/cadriel/fluidd/commit/6d5149be7a8bc6ccdbdd5907f227ab049dad4e3d))


### Bug Fixes

* **endstops-label:** Fix end triggered label not being displayed ([13a0875](https://github.com/cadriel/fluidd/commit/13a0875519e6a7185b05bccc64e784203345a4fe))
* **reprint-menu-glitch:** Fixed a small glitch in the reprint menu ([190e20b](https://github.com/cadriel/fluidd/commit/190e20b44dbfdaac45434e7b34f9f09f2b22211a))
* add printer dialog no longer returns the result from a previous request ([f43de9f](https://github.com/cadriel/fluidd/commit/f43de9f63ee8ddd1d33427aea1b11ec417c6e6f0))
* disable filesystem root (instead of redirecting user from jobs) ([9a8a463](https://github.com/cadriel/fluidd/commit/9a8a4631b8d0050001fdddf7841f06521ae70f13))
* ensure settings are ref'd with their lowercase equivalent ([3fe192f](https://github.com/cadriel/fluidd/commit/3fe192f863f04c347a796ffb68afa85460977901))
* ensure theme is upgraded to db properly ([d05544b](https://github.com/cadriel/fluidd/commit/d05544b17cfed79ebcd3e13c73accd5f71526903))
* klipper disconnect / shutdown resets printer store ([c76112c](https://github.com/cadriel/fluidd/commit/c76112c28313cbffd2ca4c09ef61dd54cca3e81d))
* klippy default state now not ready ([81995af](https://github.com/cadriel/fluidd/commit/81995af1ea9946c49d1e3709552bb080c62d7826))
* layout tweaks to chart for mobile ([ee7fab1](https://github.com/cadriel/fluidd/commit/ee7fab1ae90f7f0ba3d4976a212157ba1e025622))
* locale change after refresh now sticks ([1cad1b2](https://github.com/cadriel/fluidd/commit/1cad1b29d34e4b74cd2381da5e123aa1317b9a5b))
* no longer hide hidden files / folders ([018e3a1](https://github.com/cadriel/fluidd/commit/018e3a1cc9d7522c016b9ca29e8fc85bcb35f914))
* now hides the power axes if not showing power data. ([61a4577](https://github.com/cadriel/fluidd/commit/61a4577f2b16f5a12f6c15862edbe4ac23359a2b))
* removed unnecessary decimals from fan rpm ([cf8c0b1](https://github.com/cadriel/fluidd/commit/cf8c0b19810ff76ce612f7449f11b08389119bc2))
* slider minor slider issues re: dupe emits ([de3a2cd](https://github.com/cadriel/fluidd/commit/de3a2cdbd37162b30bb53815f88d0008b970370e))
* version status enters a disabled state when checking for updates ([06071d5](https://github.com/cadriel/fluidd/commit/06071d5775f151054fcd905825846d08edceaa87))

## [1.10.0](https://github.com/cadriel/fluidd/compare/v1.9.0...v1.10.0) (2021-03-05)


### Features

* adds basic support for fan rpm reporting ([5cb82a6](https://github.com/cadriel/fluidd/commit/5cb82a685ea3684d1bc8bfe6016e6818bd953bd7))
* moves certain buttons colors to primary ([82c53eb](https://github.com/cadriel/fluidd/commit/82c53eb8144310a8985dae95e9b3725bccb3dc7b))


### Bug Fixes

* ensures power plugin displays properly on shutdown ([ba7bf6e](https://github.com/cadriel/fluidd/commit/ba7bf6e66aa9ff7433ecdf6f277e5da57ce7fc13))
* ip camera's no longer append the cachebust param ([8be8dd2](https://github.com/cadriel/fluidd/commit/8be8dd2e2f63243fd9cb513121507f3c6839f790))
* issue with timers presenting 0's when they shouldn't be ([7374fdb](https://github.com/cadriel/fluidd/commit/7374fdbed9dfe0e5824d5ea5869a2aacfc5c0a59))
* removes the delay on app init when the printer is off ([1714a14](https://github.com/cadriel/fluidd/commit/1714a14bea5413f19ef74a2e35c9a37484445975))

## [1.9.0](https://github.com/cadriel/fluidd/compare/v1.8.1...v1.9.0) (2021-02-28)


### Features

* allow service restart when klipper service is down ([75b4588](https://github.com/cadriel/fluidd/commit/75b4588d805ee67b9b0e62ab6f124b5606041478))
* primary theme picker ([b1e38cc](https://github.com/cadriel/fluidd/commit/b1e38ccd70ba0ef97f5e6c017898291fb23e120c))


### Bug Fixes

* add z home check to z offset buttons ([611d6b9](https://github.com/cadriel/fluidd/commit/611d6b9faf08f29227a47143f63380b30f3f8718))
* klippy card buttons layout properly now ([9fa95ee](https://github.com/cadriel/fluidd/commit/9fa95ee62e46a23a2ac00ca6e9816b964248d000))
* relax url check when adding printer ([6753e8d](https://github.com/cadriel/fluidd/commit/6753e8dba60d713d84b73fab7e6e3a9134e7218c))
* tz unit tests ([de1de4e](https://github.com/cadriel/fluidd/commit/de1de4e486e797b3a437cf70edab3054ed3d4f4f))

## [1.8.1](https://github.com/cadriel/fluidd/compare/v1.8.0...v1.8.1) (2021-02-21)


### Bug Fixes

* bed meshes now properly support spaces in their name ([061f3ab](https://github.com/cadriel/fluidd/commit/061f3ab7c05a2873c71dc6b32e4cdba0a0190e2b))
* regression with power devices not showing state when printer is off ([1374957](https://github.com/cadriel/fluidd/commit/1374957b165f6713a9e8610e991dcf4583e170f2))

## [1.8.0](https://github.com/cadriel/fluidd/compare/v1.7.1...v1.8.0) (2021-02-20)


### Features

* Actions should now deploy to app.fluidd.xyz ([cd908db](https://github.com/cadriel/fluidd/commit/cd908db87421d855628a9038c706bc4bcd97bba3))
* allow selecting current extruder ([6e618ef](https://github.com/cadriel/fluidd/commit/6e618ef69b3977b62e4fc5b20f2a32bef2d67b4f))
* chart x axes is now configurable via moonraker ([d4c1853](https://github.com/cadriel/fluidd/commit/d4c18530c9f07512428beeee6e2ea1fb7575e3ee))
* Data zoom now requires the user to hold SHIFT. ([38e6d76](https://github.com/cadriel/fluidd/commit/38e6d769d965ecde2e502b1aa83f4e8f2729404e))
* implements virtual scrolling for the console ([0f35777](https://github.com/cadriel/fluidd/commit/0f357777a8923634a7947f6920b10bf988916ea9))


### Bug Fixes

* Add validator to avoid spaces in bed mesh names ([d7c7d94](https://github.com/cadriel/fluidd/commit/d7c7d945d4195318de4491583a876bacac5987b0))
* additions to the console array now no longer cause re-render ([ea35827](https://github.com/cadriel/fluidd/commit/ea3582772c35f2784a5e5111dbcbe494e70d4624))
* adjust min max + tooltip order ([bed29eb](https://github.com/cadriel/fluidd/commit/bed29eb1d964a11d22ef617be50940cb74d40660))
* adjust xaxis label for mobile ([42e17b5](https://github.com/cadriel/fluidd/commit/42e17b5683a3a3499d11fb596f97fcf90ceaeb9f))
* bump plotly version. ([e127e2d](https://github.com/cadriel/fluidd/commit/e127e2d19dda4c94854a2840a05a8ee216a8159a))
* camera cachebust no longer breaks certain urls. ([96cc695](https://github.com/cadriel/fluidd/commit/96cc6953f5f8673f137b700cb25e3c60272dd1a2))
* ensure chart returns 24h formatted dates ([17fef35](https://github.com/cadriel/fluidd/commit/17fef35dff7ae49c3c8e5af39b6a64e13ae6cd87))
* ensure dashboard jobs isn't visible if gcode root isnt ready ([4cb07d7](https://github.com/cadriel/fluidd/commit/4cb07d773752bc045bddd54312b4d719e0f6ed75))
* initial load of chart data should now be faster + retention of 1200 ([0dee1c1](https://github.com/cadriel/fluidd/commit/0dee1c19e8e14cadc40caadf7fb47d35996ffbce))
* minor style changes to bed mesh profile names ([eb60ed2](https://github.com/cadriel/fluidd/commit/eb60ed20a8a684b28475ee04d9e1423cc5a83b22))
* power devices disabled state should now match others ([51e09d2](https://github.com/cadriel/fluidd/commit/51e09d29e38c35e2b424a12893b7a1fe23f05e60))
* remove option to hide jobs in dash via ui settings ([46ee3ab](https://github.com/cadriel/fluidd/commit/46ee3ab75aecdc9a25c31fa0c084f150deeab2ff))
* should not change extruder during a print ([2af8d49](https://github.com/cadriel/fluidd/commit/2af8d49c350c869040076ebd8498b19ead307efb))
* update responses now properly scroll the console ([17e70ce](https://github.com/cadriel/fluidd/commit/17e70ce7a94797fe64ee982a02c9f3e65590a463))

## [1.7.1](https://github.com/cadriel/fluidd/compare/v1.7.0...v1.7.1) (2021-02-13)


### Bug Fixes

* apiUrl now properly formats the protocol ([345f55b](https://github.com/cadriel/fluidd/commit/345f55b767553ee0b58093c07d35f39fd979a938))

## [1.7.0](https://github.com/fluidd-core/fluidd/compare/v1.6.3...v1.7.0) (2021-02-13)


### Features

* add cache busting to cam image ([73cf97b](https://github.com/fluidd-core/fluidd/commit/73cf97b4ecd38445f3454cb1c817671c5ed81e80))
* Apply speed multiplier to requested speed ([98cac62](https://github.com/fluidd-core/fluidd/commit/98cac627dae5d2443276d09047351c577242e243))
* console autocomplete ([9ee61c2](https://github.com/fluidd-core/fluidd/commit/9ee61c2132d419b8dcf93faf14e30048a67a5f93))
* graph zoom by way of mouse wheel ([55f9fe0](https://github.com/fluidd-core/fluidd/commit/55f9fe07ffa783769e2532e2c923cbd06570082e))
* new thermals chart and layout ([947bac4](https://github.com/fluidd-core/fluidd/commit/947bac4ed9b7c218d4866fe4dd86207dd2fb5dea))
* uncontrollable fans read 'Off' when at 0 ([7870738](https://github.com/fluidd-core/fluidd/commit/7870738ff5c06d8e33c6d269ff564b1b91ff3f44))


### Bug Fixes

* Added `ADJUSTED` to the additional command list ([be20dc7](https://github.com/fluidd-core/fluidd/commit/be20dc79b7bac7939b089e3159537a00f8d2ec21))
* camera url cleared on visibility change ([7ef6fc2](https://github.com/fluidd-core/fluidd/commit/7ef6fc2edea7a220b2a8611fe9c2365fb81c0ccf))
* console shouldn't scroll with hidden temp wait events ([323dda3](https://github.com/fluidd-core/fluidd/commit/323dda32bd5114270c72a2553c1d5eecf85b1d04))
* dialog titles in file browser ([b5ede63](https://github.com/fluidd-core/fluidd/commit/b5ede63c88ce64e6b2a279d91d0b8235b61caa4f))
* ensure chart state is remembered ([0f55a1a](https://github.com/fluidd-core/fluidd/commit/0f55a1ad2a24f46505fa2d4738a7964c9dcdc47b))
* filesystem scrollbar now matches console ([31e8398](https://github.com/fluidd-core/fluidd/commit/31e83987c8bc3339850875e7881c2e07eb93292a))
* force merge strategy ([2eb1363](https://github.com/fluidd-core/fluidd/commit/2eb1363fbc97bcc046ba50430c8e9d35aa4c2330))
* light theme versions panel ([0411fb9](https://github.com/fluidd-core/fluidd/commit/0411fb9e71cfca18f0e606db358c4612c5f087de))
* macros now respect config changes between klippy restarts ([1456f01](https://github.com/fluidd-core/fluidd/commit/1456f0115fd48f01a54ae239690320002354b1fe))
* min extrude temp now properly respects a 0 ([3b68d0a](https://github.com/fluidd-core/fluidd/commit/3b68d0af566538f8e7816b1f02ec154267d11195))
* remove api hardcoded protocol ([55bc7e7](https://github.com/fluidd-core/fluidd/commit/55bc7e702237640fba5ba781b49efa33550d0863))
* resolve page refreshes on first form entry ([c2dc9fd](https://github.com/fluidd-core/fluidd/commit/c2dc9fd1857d3a32eed03ee2bee20e59b17769ad))
* speed multiplier ([0ccd46e](https://github.com/fluidd-core/fluidd/commit/0ccd46e8535ddf8dc3e819a248939b2949389d1c))

## [1.6.3](https://github.com/fluidd-core/fluidd/compare/v1.6.2...v1.6.3) (2021-02-06)


### Bug Fixes

* fan value display not having a fixed decimal ([8a14ac6](https://github.com/fluidd-core/fluidd/commit/8a14ac65828f158176cce49ddc1f796ce025ebec))
* websocket data bleed ([cff0077](https://github.com/fluidd-core/fluidd/commit/cff00771988fc240520a4d977ab00fbe2e3bad85))

## [1.6.2](https://github.com/fluidd-core/fluidd/compare/v1.6.1...v1.6.2) (2021-02-05)


### Bug Fixes

* package-lock ([02d50e1](https://github.com/fluidd-core/fluidd/commit/02d50e126876054e24586ad23988a4c05101c3cd))
* temp store with no targets won't break chart ([ddefcf7](https://github.com/fluidd-core/fluidd/commit/ddefcf7ac287b7fe2c855e333dbc0d2cc505f676))

## [1.6.1](https://github.com/fluidd-core/fluidd/compare/v1.6.0...v1.6.1) (2021-01-24)


### Bug Fixes

* resolve display warning being shown when it should not be ([622c660](https://github.com/fluidd-core/fluidd/commit/622c66004ea0d09e2b4c31de31b026fe80c93b21))

## [1.6.0](https://github.com/fluidd-core/fluidd/compare/v1.5.1...v1.6.0) (2021-01-24)


### Features

* display heater applied power ([4259e18](https://github.com/fluidd-core/fluidd/commit/4259e183de7b1ef6fc1211de3486ddbc9f16ae6f))
* ensures compatibility with latest moonraker changes ([5fbcb63](https://github.com/fluidd-core/fluidd/commit/5fbcb63053a4b8316085ea3f066ee247189625bb))
* gcodes now available after first connection to klippy ([c3a89bc](https://github.com/fluidd-core/fluidd/commit/c3a89bc961957bf796d8d833974f27bbaf5cac42))
* power plugin now respects locked_while_printing flag ([9034968](https://github.com/fluidd-core/fluidd/commit/9034968b55e8787f8f7d19911704a6b9826b48db))
* refactored warnings to include failed moonraker plugins ([069adb5](https://github.com/fluidd-core/fluidd/commit/069adb51f1abe87684f865c058b7adc960d6cafe))
* swap tab titles around so the instance name is first ([e7867b5](https://github.com/fluidd-core/fluidd/commit/e7867b5a7ac13632d5deb21d6446ac32013cf5b4))


### Bug Fixes

* add correct validators to extruder length and speed ([046a0da](https://github.com/fluidd-core/fluidd/commit/046a0da5f33cfc7eae7649d47054515f11ad1e30))
* ensure klippy card gracefully displays on mobile layout ([e2e1f4c](https://github.com/fluidd-core/fluidd/commit/e2e1f4cc7a8d42c84c48df1619530e00fbcae554))
* Ensure the filament mm length is fixed to a single decimal ([a34d149](https://github.com/fluidd-core/fluidd/commit/a34d1495b826690f24e48f2316000af5b5ba57d0))
* ensure we clear the cam url on collapse / destroy ([e9dbd2f](https://github.com/fluidd-core/fluidd/commit/e9dbd2fcb72f807cd28f1d1d9f3dc0df9b500d6f))
* file editor now won't break if the file is empty ([0d5ae1b](https://github.com/fluidd-core/fluidd/commit/0d5ae1b451b428544cc5855d6402ee4e5f853e77))
* minor klippy card layout issue ([fe76e8e](https://github.com/fluidd-core/fluidd/commit/fe76e8ea753343cdfd45e44df08b8f6a28281c46))
* no longer shows you have updates if skip client updates === false ([5851669](https://github.com/fluidd-core/fluidd/commit/5851669e0f624ea727cd955149c073bb43eb5a5b))
* opening console from a collapsed state fires scroll event properly ([373aea3](https://github.com/fluidd-core/fluidd/commit/373aea30da9e160a485433d1de00f2b346dc6ad8))
* part speed fan not allowing a 0 in the input ([1cc404e](https://github.com/fluidd-core/fluidd/commit/1cc404ea7deaa04a4100915c7d25a520e0e6d680))
* plus / minus buttons now adhere to step value ([0ef8d4b](https://github.com/fluidd-core/fluidd/commit/0ef8d4bdff7fbcb62af1aec6e1f007aeb1e45289))
* pwm boolean case now no longer breaks output pins ([f8e23a8](https://github.com/fluidd-core/fluidd/commit/f8e23a8ced4016c8f280935cf0f236eba7c36ad9))
* readjust some tool layout to prevent wrapping at 1280 ([fc577bd](https://github.com/fluidd-core/fluidd/commit/fc577bd78ee276c750a1b141bff963fe6748491d))
* rules now properly apply for limits and speed / flow ([ee1191e](https://github.com/fluidd-core/fluidd/commit/ee1191ee7b5779715330a4258473870939e480cc))
* some console clicks weren't registering ([98a1e74](https://github.com/fluidd-core/fluidd/commit/98a1e744589be290cd7855bf10d088f6fd1e5230))
* temp inputs can no longer send NaN ([5d21718](https://github.com/fluidd-core/fluidd/commit/5d21718752720d17df834f92f10eb42921ff5c8b))
* update response output ([f680525](https://github.com/fluidd-core/fluidd/commit/f680525e5cab9fea77088080aca408f04284e25c))

## [1.5.1](https://github.com/fluidd-core/fluidd/compare/v1.5.0...v1.5.1) (2021-01-17)


### Bug Fixes

* console not scrolled when navigating pages ([68018f2](https://github.com/fluidd-core/fluidd/commit/68018f24430b168a8d578ffd5dea70ae83bf2903))

## [1.5.0](https://github.com/fluidd-core/fluidd/compare/v1.4.3...v1.5.0) (2021-01-17)


### Features

* add basic icons representing types in thermals card ([e6db221](https://github.com/fluidd-core/fluidd/commit/e6db2211d6c121b196076dc36825d5c275fa6797))
* add requested speed to toolhead ([066e59f](https://github.com/fluidd-core/fluidd/commit/066e59f32798c9c9aa2d6b90384f77cd6a2d0104))
* add UI to control output pins ([5a2d4df](https://github.com/fluidd-core/fluidd/commit/5a2d4df87956b68f9e7fe2cfaecbb36a6d60b077))
* adjust layout of fans ([10e9c3c](https://github.com/fluidd-core/fluidd/commit/10e9c3c5c8ac5614764d0a732ae6a08f67253fad))
* allow input values for sliders ([7a1c63d](https://github.com/fluidd-core/fluidd/commit/7a1c63dd2e87761689d89f01b5f55a626c2c37b7))
* automated deploys ([359af43](https://github.com/fluidd-core/fluidd/commit/359af43ffb6b42c93c5822cec98fff147a0c93f3))
* implements console command history ([06560fe](https://github.com/fluidd-core/fluidd/commit/06560fe2d1534824e39810ea972e64f785f95415))
* new icon for outputs ([b6613b8](https://github.com/fluidd-core/fluidd/commit/b6613b8dc3bf05b3d6fbf9a0462d7e4c28be2414))
* releases are now linked to their respective github pages ([2807559](https://github.com/fluidd-core/fluidd/commit/280755999e2778ea248e3e9eb2b40d096021fff1))
* removes unnecessary home buttons for delta kinematics ([ffbe46a](https://github.com/fluidd-core/fluidd/commit/ffbe46a4d7d81c7cb734e51133a0b7b31b3cc394))


### Bug Fixes

* allow a step size of 0.1 for SCV ([5cb148d](https://github.com/fluidd-core/fluidd/commit/5cb148d2363d95ee284397c352411df26dd3affc))
* config page margins ([1c8fb90](https://github.com/fluidd-core/fluidd/commit/1c8fb90f9d898b1d6550c9ab7dbdc62e5f181fdb))
* console click command included prefix ([538cafb](https://github.com/fluidd-core/fluidd/commit/538cafb89fd7176080e7e7f3ab17f62cfc0ec9b1))
* console now copy / pastes as you'd expect ([dedffb4](https://github.com/fluidd-core/fluidd/commit/dedffb418299f2cbe20c7cf19ea13b3cdb00c3dc))
* disable the jobs menu on disconnect instead of hide ([c8f5b56](https://github.com/fluidd-core/fluidd/commit/c8f5b56613d04431e507657b8501a1e80bafa1ec))
* Doc links updated ([7e9412f](https://github.com/fluidd-core/fluidd/commit/7e9412f82375a0f14680020b0eaca3314e3d128f))
* ensure file search style matches other inputs ([c7150be](https://github.com/fluidd-core/fluidd/commit/c7150bea6c0f373bcca380d1ab9a47e3a1119cb3))
* ensure save and restart is not usable during a print ([ac9588c](https://github.com/fluidd-core/fluidd/commit/ac9588c2cacf418ab3a06452f99e542214ed4940))
* ensures console scroll works during layout changes ([8325c86](https://github.com/fluidd-core/fluidd/commit/8325c86e4a6cb1dda3bd9efaea1e3adc4902537c))
* freshly loaded bed meshes now show their variance ([748e46a](https://github.com/fluidd-core/fluidd/commit/748e46ae6e146668417027cf6fd472d22a51be59))
* Klippy error card is no longer delayed before being hidden ([9b7aba9](https://github.com/fluidd-core/fluidd/commit/9b7aba930dbb3fd15aa756eca00a06348f8aab49))
* minor adjustment to m117 display ([7d198fb](https://github.com/fluidd-core/fluidd/commit/7d198fbd8f89d29463f17b0624d582f38722510c))
* release action ([68d0967](https://github.com/fluidd-core/fluidd/commit/68d0967c26dcee0e0037d77d2cfa6c1c8811be15))
* removed external dependence on fonts on icon styles ([b454ac8](https://github.com/fluidd-core/fluidd/commit/b454ac8fc9151b74c3d0ff7538463e5e5dffffef))
* sliders min 1 + status only hides with no status ([77a9a99](https://github.com/fluidd-core/fluidd/commit/77a9a99d11427f3188d0222ab0ca2d0d00326bc6))
* Some items not returning prettified names ([d1472ed](https://github.com/fluidd-core/fluidd/commit/d1472edf08bff0c1ad9c89c9f39e0c8512d6a3cd))
* speed in mm/s ([ed4452a](https://github.com/fluidd-core/fluidd/commit/ed4452aabe88000b1d96457df4be26cf60e46650))
* Temp graph no longer consumes resources in a collapsed state ([f566190](https://github.com/fluidd-core/fluidd/commit/f5661906f4f9d2f308048ae86d600ca302e3018d))
* temp presets no longer error if heaters or fan names change ([1ac6d37](https://github.com/fluidd-core/fluidd/commit/1ac6d3783730019da58ee987d82fda44c68102d4))

## [1.4.3](https://github.com/fluidd-core/fluidd/compare/v1.4.2...v1.4.3) (2021-01-10)


### Features

* add Dockerfile & Github workflow ([d7c697d](https://github.com/fluidd-core/fluidd/commit/d7c697d42c5205a453ca1f2599c076f6abc3d2d0))
* automated build ([fa92e38](https://github.com/fluidd-core/fluidd/commit/fa92e38bdecf320d36b74ac3f4e6399de3e45b1b))


### Bug Fixes

* add potato to dev deps ([b4badfc](https://github.com/fluidd-core/fluidd/commit/b4badfced3c3dc55a1b02a1a6da4177309f52b57))
* client warnings should now show properly ([793d9c9](https://github.com/fluidd-core/fluidd/commit/793d9c95dd427e43579d9d18b96ea95e91bc7701))
* ensure you can't check for updates during a print ([a87fe80](https://github.com/fluidd-core/fluidd/commit/a87fe80f5da393411c2a52488fbedfda23136597))
* extrude snowflake issues when min_extrude_temp === 0 ([78f2328](https://github.com/fluidd-core/fluidd/commit/78f2328ac340cf8c6425800e309c2cfc293a307a))
* Filament reporting under 1m ([b556f46](https://github.com/fluidd-core/fluidd/commit/b556f463ed8bf375220d961c31d2378a68998ca9)), closes [#70](https://github.com/fluidd-core/fluidd/issues/70)
* OS updates should properly update status now ([aed9896](https://github.com/fluidd-core/fluidd/commit/aed9896e5ae99facffaac2cf60e0e6ced9612377))
* rename restart mcu's to firmware restart klipper ([a597aa2](https://github.com/fluidd-core/fluidd/commit/a597aa238535c1d2dce7f72eb412db453c475fc1))

## [1.4.2](https://github.com/fluidd-core/fluidd/compare/v1.4.1...v1.4.2) (2021-01-04)


### Features

* add ability to remove mesh profiles ([f2830df](https://github.com/fluidd-core/fluidd/commit/f2830dfee6e10113560b214c8b8c22c061211d22))
* Allow multiple files upload from upload button. ([15695d1](https://github.com/fluidd-core/fluidd/commit/15695d1a758a6bb6451fd4f009007fd480c4dd3a))
* make use of automated update status notifications ([791767d](https://github.com/fluidd-core/fluidd/commit/791767d88fa478ce03669d2b0b0998d0f642ad2a))
* moves home controls to a rollout ([c868d50](https://github.com/fluidd-core/fluidd/commit/c868d50ad704d4d642552df6ebf246037ebb4695))
* reduce title font size on mobile ([2dbe487](https://github.com/fluidd-core/fluidd/commit/2dbe487e322ecc0842db2bf09677c5a19dea5bad))


### Bug Fixes

* ensure an estop doesn't dispatch disconnected event ([0ec0386](https://github.com/fluidd-core/fluidd/commit/0ec0386205be5dbeae2a8b0012a97b436176280d))
* ensure home buttons color correctly ([1226f81](https://github.com/fluidd-core/fluidd/commit/1226f81a78c33185bd1cd6fe5b60919c39d3a1fc))
* generic fans now controllable ([34addf3](https://github.com/fluidd-core/fluidd/commit/34addf3477dbcc16a9d9590b4b6a9d2bcca2fa72))
* issue when printing freshly uploaded files ([eb8204c](https://github.com/fluidd-core/fluidd/commit/eb8204c5c26a571b86c148245276a968a29b0a47))
* minor layout issue on settings page ([84ae80f](https://github.com/fluidd-core/fluidd/commit/84ae80fba760137ad89a9f1990bba78743a01645))
* Now watches for klippy shutdown ([d71e513](https://github.com/fluidd-core/fluidd/commit/d71e513ccf4a9dc2d648e40c41f095a747bce12c))
* Prop type error ([e1f86d7](https://github.com/fluidd-core/fluidd/commit/e1f86d77f840df4c03f451e17220ae2306a21eda))
* temp preset validation ([895c194](https://github.com/fluidd-core/fluidd/commit/895c194e4e6525913c65f4958552d729364da191))
* toolhead title buttons overflowing ([292d2b8](https://github.com/fluidd-core/fluidd/commit/292d2b8bf016c2882bd6d4405a0787ace61a684f))
* update status no longer effects other waits in the UI ([c2751d5](https://github.com/fluidd-core/fluidd/commit/c2751d55e61f2e6739937c63b797f7a05e4600fb))

## [1.4.1](https://github.com/fluidd-core/fluidd/compare/v1.4.0...v1.4.1) (2020-12-31)


### Bug Fixes

* allow ending digits for hostnames during validation ([81c1c9a](https://github.com/fluidd-core/fluidd/commit/81c1c9a1a830208021d0a9141f18cb6617df0282))
* dialog action buttons now have more reasonable padding ([58c846a](https://github.com/fluidd-core/fluidd/commit/58c846a035c7cb45e76aa53cebcc5e275916ff9d))
* ensure logs card isn't shown when client / klippy is in error. ([004ebe0](https://github.com/fluidd-core/fluidd/commit/004ebe0780b118096fee8009ac98966884521cdf))
* loader applied only while updating ([f840ccc](https://github.com/fluidd-core/fluidd/commit/f840cccbdb44fd42078e4250039b54705e315171))

## [1.4.0](https://github.com/fluidd-core/fluidd/compare/v1.3.1...v1.4.0) (2020-12-29)


### Features

* improved upload status ([3da419e](https://github.com/fluidd-core/fluidd/commit/3da419ee52970694152213e4a12964425f1c086e))


### Bug Fixes

* ensure add printer instance url requires protocol ([17c3271](https://github.com/fluidd-core/fluidd/commit/17c327196966608b2aa2f9f263d02c124cfe5035))

## [1.3.1](https://github.com/fluidd-core/fluidd/compare/v1.3.0...v1.3.1) (2020-12-26)


### Bug Fixes

* buttons states now update properly ([36854c4](https://github.com/fluidd-core/fluidd/commit/36854c4242800d0248e93dafb09725a65366c636))
* position now reflects gcode position, not toolhead position ([e76bc41](https://github.com/fluidd-core/fluidd/commit/e76bc41e618c8ebfdac25faf057dbdc1fbe69c3a))
* revert position back to toolhead position ([b2b83e9](https://github.com/fluidd-core/fluidd/commit/b2b83e97be21d9a4ccab20d32ee4cb5ba7503582))

## [1.3.0](https://github.com/fluidd-core/fluidd/compare/v1.2.2...v1.3.0) (2020-12-26)


### Features

* draggable dashboard cards ([5286e8e](https://github.com/fluidd-core/fluidd/commit/5286e8edf4c086cfc95f4b1a2783be33170280df))


### Bug Fixes

* unable to edit new files. ([25aa5b9](https://github.com/fluidd-core/fluidd/commit/25aa5b94e5648cc8c9f9bc89f2eb41ac41960d32))

## [1.2.2](https://github.com/fluidd-core/fluidd/compare/v1.2.1...v1.2.2) (2020-12-20)


### Bug Fixes

* refresh on client update ([694d472](https://github.com/fluidd-core/fluidd/commit/694d4727baae3ef8a52b72665062e79b9efd1500))
* you should not update or restart services during a print ([e250478](https://github.com/fluidd-core/fluidd/commit/e250478aa5e9249b0b6e0420c50a207cf8a7446a))

## [1.2.1](https://github.com/fluidd-core/fluidd/compare/v1.2.0...v1.2.1) (2020-12-20)


### Bug Fixes

* version states & add tooltip for brevity ([52a2256](https://github.com/fluidd-core/fluidd/commit/52a2256b86ed638d5cfcb73bbe876a1bb52adc2b))

## [1.2.0](https://github.com/fluidd-core/fluidd/compare/v1.1.0...v1.2.0) (2020-12-20)


### Features

* add download log buttons to configuration page ([939e9a8](https://github.com/fluidd-core/fluidd/commit/939e9a86a5069d48cac535e37172c2aae89ae257))
* allow creation of new files ([2adc1d0](https://github.com/fluidd-core/fluidd/commit/2adc1d08ac77713e195b7a9c55233f5badfb3b7b))
* console entry maintains state ([a913ee6](https://github.com/fluidd-core/fluidd/commit/a913ee6f3ebddd8fb64c1ce6544b981045f04c87))
* logo & printer name now link to dashboard ([793ad14](https://github.com/fluidd-core/fluidd/commit/793ad146196e3c2ae22ec24fdd1601b55a7d475f))
* self updates ([c9c5d63](https://github.com/fluidd-core/fluidd/commit/c9c5d63889a1c142430c5d51e2bc58bb469fa926))


### Bug Fixes

* ctrl-z working properly in code editor ([4ac441b](https://github.com/fluidd-core/fluidd/commit/4ac441b7540f70fa8ec419f50c8a57d80d87d35a))
* downloads now work irrelevant of connected printer port ([aadb6f5](https://github.com/fluidd-core/fluidd/commit/aadb6f580dfe28428d6ea0524d137cec1989012f))
* ensure users can't access the jobs page on klippy disconnect ([b95e177](https://github.com/fluidd-core/fluidd/commit/b95e17745b1c414a5db42a293115569ab89da4d2))
* fix macros not updating when selecting printers ([0cd4043](https://github.com/fluidd-core/fluidd/commit/0cd4043a5ac2847fd73d3ba2cc54b02fb2f55365))
* input sliders now accept clicks properly ([552eff4](https://github.com/fluidd-core/fluidd/commit/552eff469b11fac2008d1c6322017c7a896b7748))
* issue when closing file editor with escape ([e79feaf](https://github.com/fluidd-core/fluidd/commit/e79feaf757ded163f41ec3417ec0ded7ee9a352e))
* prevent null values being saved to temp presets ([2d4951d](https://github.com/fluidd-core/fluidd/commit/2d4951d3809ffd8341777e9491db86b138962a13))
* system versions not reliant on klippy being connected ([a510bfb](https://github.com/fluidd-core/fluidd/commit/a510bfb8feafa052f055da0e7c93f271b73a1656))

## [1.1.0](https://github.com/fluidd-core/fluidd/compare/v1.0.0...v1.1.0) (2020-12-02)


### Features

* drag and drop file uploads ([28328fd](https://github.com/fluidd-core/fluidd/commit/28328fdfb9f06e2ab487d7b6a8033d2adc89791d))
* enable print fan adjustment while printing ([bcf6f71](https://github.com/fluidd-core/fluidd/commit/bcf6f71e9d2f716859d139f965107d76de8deb0c))
* show controller / hot end fan status ([e47faa9](https://github.com/fluidd-core/fluidd/commit/e47faa9621ebe2711116a0453b1e42a15926d1d5))
* temperature presets ([bb72525](https://github.com/fluidd-core/fluidd/commit/bb725251e484b522d094f0b81a04773682257e6c))
* upload & print button ([7ae24f8](https://github.com/fluidd-core/fluidd/commit/7ae24f8aa515a83e0a6dbbba6a908efdc0d1774f))


### Bug Fixes

* error loading files when connected directly to moonraker port ([11e18e6](https://github.com/fluidd-core/fluidd/commit/11e18e6646bde0553fcf7a8d4ba0382afa405a67))
* extruder warning now a snowflake ([bd59285](https://github.com/fluidd-core/fluidd/commit/bd592857e5ecd4ad35a8a321863ed1f40a84aa27))
* files other than .gcode were not updating file list ([d1230ca](https://github.com/fluidd-core/fluidd/commit/d1230cab4eff4ca754b97a9c9db18cc334651345))
* hamburger not showing all menu items at sm breakpoint ([b247e7d](https://github.com/fluidd-core/fluidd/commit/b247e7da8a7ad13951e30f1862c5da8f74934357))
* re-enable title in mobile format with ellipses ([c046398](https://github.com/fluidd-core/fluidd/commit/c0463982fb8e541fdf28eb36591d3c3c7ef26644))
* webcam eagerly renders, avoiding data consumption when collapsed ([e1fa534](https://github.com/fluidd-core/fluidd/commit/e1fa534b45406017af8cf97e7e5a1f8b276246f9))

## [1.0.0](https://github.com/fluidd-core/fluidd/compare/v1.0.0-rc.2...v1.0.0) (2020-11-22)

## [1.0.0-rc.2](https://github.com/fluidd-core/fluidd/compare/v1.0.0-rc.1...v1.0.0-rc.2) (2020-11-20)


### Bug Fixes

* error deleting single file when only one exists in jobs ([ddde730](https://github.com/fluidd-core/fluidd/commit/ddde7305b82fa91bfb66ba8c2407fd443463c544))
* reset and reprint buttons not showing up ([1e461fd](https://github.com/fluidd-core/fluidd/commit/1e461fd490db99ec99295c6f7b2d58f6f74138a7))

## [1.0.0-rc.1](https://github.com/fluidd-core/fluidd/compare/v1.0.0-rc.0...v1.0.0-rc.1) (2020-11-18)


### Bug Fixes

* Issue where all instances were disabled ([9da4a3d](https://github.com/fluidd-core/fluidd/commit/9da4a3d56c207d32ff8ffce962b80eb603433a34))

## [1.0.0-rc.0](https://github.com/fluidd-core/fluidd/compare/v0.1.0...v1.0.0-rc.0) (2020-11-16)


### Features

* allow inverting axis ([cf6a993](https://github.com/fluidd-core/fluidd/commit/cf6a993b3655d349d724bdb150211ba2d4813409))
* multi-printer management ([319e3bb](https://github.com/fluidd-core/fluidd/commit/319e3bbe60ff25ab1dc27ed8bcf93e239c2daddb))
* support for bed_screws_adjust and screws_tilt_calculate ([6e09088](https://github.com/fluidd-core/fluidd/commit/6e0908826c97bf59892ff476a23ed5d4a7ade132))
* support ip camera streams ([a055bce](https://github.com/fluidd-core/fluidd/commit/a055bce8439004ba5a2afb2582aac91c096b716d))


### Bug Fixes

* [virtual_sd_card] -> [virtual_sdcard] ([27395bb](https://github.com/fluidd-core/fluidd/commit/27395bb90c552bdd5bba00719eb38b44ac4c975e))
* ensures tool tabs present properly if only one tab is available ([fcbe166](https://github.com/fluidd-core/fluidd/commit/fcbe166686934f12ca1d7b5ce73381a38eebecf3))
* error toasts now use the default timeout ([58385c5](https://github.com/fluidd-core/fluidd/commit/58385c5049515b396870b747fc53ec2ebb5c446e))
* progress uses display_status to represent M73 if configured ([b0c575c](https://github.com/fluidd-core/fluidd/commit/b0c575c08d71ac199404ed62e88cf05279015460))

## [0.1.0](https://github.com/fluidd-core/fluidd/compare/v0.0.10...v0.1.0) (2020-11-06)


### Features

* add loader to file uploads ([0bc62f4](https://github.com/fluidd-core/fluidd/commit/0bc62f446a62696b95b18633a7fe1f19cd077172))
* add save and close to file editor ([24bc44b](https://github.com/fluidd-core/fluidd/commit/24bc44b726fae0baa6d77e26b1ec994ad1fef852))
* adds settings to control jobs card and menu item ([8290ac8](https://github.com/fluidd-core/fluidd/commit/8290ac818470bdd2d72fa1f443928a071d2c3aa4))
* allow .ufp uploads into jobs ([7691f07](https://github.com/fluidd-core/fluidd/commit/7691f07d7f29de3c81a80972fb68c3ff61e8b2d3))
* file menu shows larger thumb ([156f84b](https://github.com/fluidd-core/fluidd/commit/156f84b681a7225f9c5044dc039117bea848a4ca))
* filter thumbs folder ([1857dee](https://github.com/fluidd-core/fluidd/commit/1857dee2125faef27147311aae329d09f6560d3f))
* load meta data ([c59c0a8](https://github.com/fluidd-core/fluidd/commit/c59c0a871d8c4faefd3161c3d4fd87b27aa41cfe))
* print pushes user to dashboard if not already ([61a4f9b](https://github.com/fluidd-core/fluidd/commit/61a4f9b6b65d566b6f6e4b82bda0ca105b411fa1))
* sensors now show up in graph ([4813d0b](https://github.com/fluidd-core/fluidd/commit/4813d0b6ad1e9c07745d5349b37149b86bc42ad5))
* support power notifications ([2e27a99](https://github.com/fluidd-core/fluidd/commit/2e27a99bb4d4cf464b86e52f869a93178e82e380))


### Bug Fixes

* catch a greater subset of errors to throw to the user ([eed7c71](https://github.com/fluidd-core/fluidd/commit/eed7c7171bde452ca3eb2951a617c9ef2365b7d0))
* change file upload icon in file browser ([bade073](https://github.com/fluidd-core/fluidd/commit/bade0738ab2c576cf70303b99356c449a58cf06a))
* editing files now works in safari / ios properly ([49b33e7](https://github.com/fluidd-core/fluidd/commit/49b33e716c0c0f35517e8916fdce0e8b4ce788ed))
* ensure current_print is updated properly ([6282753](https://github.com/fluidd-core/fluidd/commit/62827537cea93a0ec9565098019edeca3ffa7392))
* incorrect console timestamps ([d3fcbaf](https://github.com/fluidd-core/fluidd/commit/d3fcbafa0b786367419f067a4b5b1e325fbffe80))
* load plugins on socket connection ([bd7c064](https://github.com/fluidd-core/fluidd/commit/bd7c0649c94a5f7556502b8c8984972cd9d7cb0e))
* send MOVE=1 for z-adjust during prints ([eee510b](https://github.com/fluidd-core/fluidd/commit/eee510b04e313bcdb7c1b2ad7876c472dc2fde6f))
* socket client was not clearing old requests ([075377b](https://github.com/fluidd-core/fluidd/commit/075377bf9c7eb973dc87a840c68e9276fe201453))
* tabs not saving due to lifecycle issues, reverting ([c2de2de](https://github.com/fluidd-core/fluidd/commit/c2de2dedba231fe7e1aff7420b895615d39f8f27))
* time estimations display Infinity ([2caccaa](https://github.com/fluidd-core/fluidd/commit/2caccaa70fd77908979b10329bd95541cbb34c5f))
* unused var ([86b163f](https://github.com/fluidd-core/fluidd/commit/86b163f552ea8e369f862d715cccf98398101d10))
* update ref for vue-plotly ([1f7d275](https://github.com/fluidd-core/fluidd/commit/1f7d2758584e77026b5f906c160c7f47272cc3e0))

## [0.0.10](https://github.com/fluidd-core/fluidd/compare/v0.0.9...v0.0.10) (2020-10-30)


### Bug Fixes

* firefox not showing logo ([31475c5](https://github.com/fluidd-core/fluidd/commit/31475c5b5fe2063535b3ac040446f13f852e4911))

## [0.0.9](https://github.com/fluidd-core/fluidd/compare/v0.0.8...v0.0.9) (2020-10-30)


### Features

* add base logo ([906bea3](https://github.com/fluidd-core/fluidd/commit/906bea365c9b0436ed098d4cd4027265ed5c6e12))
* allow flipping camera horizontally or vertically ([ae20c2b](https://github.com/fluidd-core/fluidd/commit/ae20c2bd8d7f06abad906656d895e781712d0e63))
* camera defaults to disabled, can be toggled in settings ([d4483c9](https://github.com/fluidd-core/fluidd/commit/d4483c901b50627424718afc004398d30a1fcb5e))
* collapsable panels ([ed8f288](https://github.com/fluidd-core/fluidd/commit/ed8f2886042ca2c39b5c1acbd4e00b4f99056f37))
* enable machine limits ([762399e](https://github.com/fluidd-core/fluidd/commit/762399e6f53645cdbb74aba2bba3356a42dc6c01))
* initial pwa support + icon ([c624494](https://github.com/fluidd-core/fluidd/commit/c624494d468eb9ffb9cb06adabdc1d958bef67fa))
* max constrained width ([56ce0ca](https://github.com/fluidd-core/fluidd/commit/56ce0caadb246b1995c72b7b7d37c6647e3bf79e))
* move temp targets to tabbed panel ([dc326f3](https://github.com/fluidd-core/fluidd/commit/dc326f35ace4cfe9984e4f3bd7cec5b25eb4633e))
* moves theme switcher to settings page and json config ([524a0fa](https://github.com/fluidd-core/fluidd/commit/524a0fade15eb93ec8d76c7da269b9e28db46ba3))
* settings instance name ([38c563c](https://github.com/fluidd-core/fluidd/commit/38c563c702f734b3e2289c607baf0b09888dff0a))


### Bug Fixes

* cancel now works ([8acb24f](https://github.com/fluidd-core/fluidd/commit/8acb24fc6e72006512595cacc11f3d92e4f03ca2))
* ensure power plugin is available when klippy is not ([1493738](https://github.com/fluidd-core/fluidd/commit/1493738a12425bcd390ceeae75c0acc0fc199c7e))
* file modified dates should now be correct ([9623272](https://github.com/fluidd-core/fluidd/commit/9623272e0486c7c271ad4e1bc2d7ec35afff7b5a))
* first few console items should no longer spread ([728cc55](https://github.com/fluidd-core/fluidd/commit/728cc554d8f6b7b3723fa118df490c4dca613b64))
* invalid time estimates ([2dc4dd3](https://github.com/fluidd-core/fluidd/commit/2dc4dd3ba9b2915ccb30cd5a2d7c149b215470b4))
* reprint button now works ([0667cd7](https://github.com/fluidd-core/fluidd/commit/0667cd7baf28dc83f635c87ea82877266cc8522a))
* sliders not registering if mouse released outside of control ([8dee998](https://github.com/fluidd-core/fluidd/commit/8dee9983341b6820129618137a8ecb1a4132bf8c))
* z-adjust displays to 3 decimal points, as per lcd. ([05c9869](https://github.com/fluidd-core/fluidd/commit/05c986921387059e1d379d84e9dd0db2edd57bae))

## [0.0.8](https://github.com/fluidd-core/fluidd/compare/v0.0.7...v0.0.8) (2020-10-26)


### Features

* allow toggle for temp chart ([121e36c](https://github.com/fluidd-core/fluidd/commit/121e36c8a64c98ed3f6900c807c204b445ae2973))
* animate chart show / hide transition ([5dee489](https://github.com/fluidd-core/fluidd/commit/5dee4896d393cf88625bba3cad0fd6ccdf1ecf17))
* display printer progress and instance in doc title ([18e89a2](https://github.com/fluidd-core/fluidd/commit/18e89a2cf1b0ae7e815d0f40183bacaec984d7a0))
* moonraker power plugin support ([be67ba0](https://github.com/fluidd-core/fluidd/commit/be67ba013e70ef05add40447f09e2c8a0c3cd078))
* timestamps in console ([20793b1](https://github.com/fluidd-core/fluidd/commit/20793b12cde060c032ff67c1a745563ff0e10733))


### Bug Fixes

* broken image for thumbs if they don't exist ([94602e5](https://github.com/fluidd-core/fluidd/commit/94602e59c75886585646442cd9bafb67227a5692))
* console now fills space after host reboot ([c0a43f7](https://github.com/fluidd-core/fluidd/commit/c0a43f712315b97908a9a872d8b359208c0b4d28))
* previous print thumb shouldn't on next print if there's no thumb ([eeeb7d6](https://github.com/fluidd-core/fluidd/commit/eeeb7d6124c676618e1628e2670bac7526591a55))
* updates to reflect moonraker changes to file modified ([d71712f](https://github.com/fluidd-core/fluidd/commit/d71712f4103f2e79ff76d4cbbbc2d940b9732525))
* z_tilt_adjust ([0a020b1](https://github.com/fluidd-core/fluidd/commit/0a020b16dba0dce5379db53ebcfd372deda9b2b3))

## [0.0.7](https://github.com/fluidd-core/fluidd/compare/v0.0.6...v0.0.7) (2020-10-20)


### Bug Fixes

* console now properly maintains history ([2334c3f](https://github.com/fluidd-core/fluidd/commit/2334c3f16c4bed98e01125bb9b4c5dece98c827a))
* extrude / retract now work if min extrude temp not defined ([cbc52e2](https://github.com/fluidd-core/fluidd/commit/cbc52e2f8598b65092ed7ed56f7281392b09a193))
* generic heaters now work ([99fa1e6](https://github.com/fluidd-core/fluidd/commit/99fa1e65c0a9ee9f71c66a2d699cff96b6ad7235))
* printing within a folder ([aea8257](https://github.com/fluidd-core/fluidd/commit/aea8257b5b8e80f3571a04295923cbd842616663))
* sorted endstops ([dc489f5](https://github.com/fluidd-core/fluidd/commit/dc489f52f0816501c2b61bba0e6417b5feb2b4a2))

## [0.0.6](https://github.com/fluidd-core/fluidd/compare/v0.0.5...v0.0.6) (2020-10-15)


### Features

* Add console history on load ([55403da](https://github.com/fluidd-core/fluidd/commit/55403da8eb98dd642180a1523216f3f9f14f037d))
* add machine limits card (currently disabled..) ([b03fe61](https://github.com/fluidd-core/fluidd/commit/b03fe6119a932fa1625fd0079cbe9ccd4d860d6b))
* add version information to footer ([ba77c0d](https://github.com/fluidd-core/fluidd/commit/ba77c0dde23293c5eeae5c35810d9b3fa06c6615))
* config editing available when klipper in error ([887b5f4](https://github.com/fluidd-core/fluidd/commit/887b5f401a03397c0dc1d4fc7d21a8ebb1167c9f))
* git hash in footer, footer no longer fixed ([a7eea18](https://github.com/fluidd-core/fluidd/commit/a7eea18fbf376ce5d29106bed6f81d3ef737b004))
* mobile and tablet layouts ([f79f945](https://github.com/fluidd-core/fluidd/commit/f79f94549808f4d4ad7d805cfcd4b266782ddd7a))


### Bug Fixes

* adds confirm dialogs to shutdown and reboot host buttons ([f7147c6](https://github.com/fluidd-core/fluidd/commit/f7147c69cb5f1ec4aa027078658a6976513c8295))
* host reboot and shutdown now work ([07bc5d5](https://github.com/fluidd-core/fluidd/commit/07bc5d52035aa98219971cfde127a805d0b85feb))
* macros no longer disabled during print ([8b70ac4](https://github.com/fluidd-core/fluidd/commit/8b70ac42d206fcd4a0042536b80b802c34f20c1a))

## [0.0.5](https://github.com/fluidd-core/fluidd/compare/v0.0.4...v0.0.5) (2020-10-10)


### Bug Fixes

* missing / incorrect icon definitions ([0f51496](https://github.com/fluidd-core/fluidd/commit/0f5149698cd7025cbdca833ca2626899c121d9b3))

## [0.0.4](https://github.com/fluidd-core/fluidd/compare/v0.0.3...v0.0.4) (2020-10-09)


### Features

* added confirm dialog to cancel print button ([3a70c88](https://github.com/fluidd-core/fluidd/commit/3a70c88a79ed85c08ab1059d14ff82d3dcc843df))
* configuration file editing ([03106d8](https://github.com/fluidd-core/fluidd/commit/03106d8910d1d4d9019b8664ba0596d610edf073))
* console command history ([b4c8d1d](https://github.com/fluidd-core/fluidd/commit/b4c8d1da9513dba04e0d62ff8d4b65bb386b0fe4))
* style updates to prep for light theme ([ef1cacd](https://github.com/fluidd-core/fluidd/commit/ef1cacdeee92d0c83aa347703e248253f928dc8f))
* theme switching between light and dark ([f66637d](https://github.com/fluidd-core/fluidd/commit/f66637d95d3705db4e9739db3d3a18f4a96fb934))


### Bug Fixes

* temp sensors and probes now display ([8776fbc](https://github.com/fluidd-core/fluidd/commit/8776fbcb533d32fd6624fe037876e9d98a574f0b))

## [0.0.3](https://github.com/fluidd-core/fluidd/compare/v0.0.2...v0.0.3) (2020-10-05)


### Bug Fixes

* config now correctly applies when no valid env or config.json given ([ba8ae43](https://github.com/fluidd-core/fluidd/commit/ba8ae43ed1a20524fafaccb4bba00da62bb391d4))
* macro's with spaces now show in the UI correctly ([d13bb0c](https://github.com/fluidd-core/fluidd/commit/d13bb0cac9389efb26c7223d7d3cd7a0277d5597))

## [0.0.2](https://github.com/fluidd-core/fluidd/compare/v0.0.1...v0.0.2) (2020-10-04)


### Features

* bed mesh, runout sensors & end stops ([d533b99](https://github.com/fluidd-core/fluidd/commit/d533b99ef8eccc4744c9749376171b638bce4a20))


### Bug Fixes

* allow force refresh on socket disconnection ([4c6e316](https://github.com/fluidd-core/fluidd/commit/4c6e316c01991c57f13d641dd73827b453042ff9))
* cancel button during pause ([6647b25](https://github.com/fluidd-core/fluidd/commit/6647b250197c39265ee64c55cc5b1ed83693bca1))
* default time estimation now klipper / file based ([6f1503a](https://github.com/fluidd-core/fluidd/commit/6f1503a144ecb19b95236fce077b7a4ec3654057))
* time estimations no longer return nan ([d5dea3c](https://github.com/fluidd-core/fluidd/commit/d5dea3c9efc98e9e6560cc3f2b59d7fc48a5c7f0))

### 0.0.1 (2020-09-30)


### Features

* added new time estimations + config ([7b05b82](https://github.com/fluidd-core/fluidd/commit/7b05b82afeb14b9f665261da6c373ba0dabe8c14))
* Adds flash message for save and errors ([874d6e7](https://github.com/fluidd-core/fluidd/commit/874d6e7a4baf346b93b58784f5183f57bf190b3c))
* adds standard-version for release management ([f842c16](https://github.com/fluidd-core/fluidd/commit/f842c1603b2277bd896eab1a892462dde1c20b37))
* initial impl of fluidd ([e34965e](https://github.com/fluidd-core/fluidd/commit/e34965ec1672d160978cf45c735b5f1884f7110c))
* initial vue typescript app init ([a3b933a](https://github.com/fluidd-core/fluidd/commit/a3b933a7ea10791e2b6a2d3f5f632e9170244368))
* loads env for local development, and config.json elsewhere. ([456c5a6](https://github.com/fluidd-core/fluidd/commit/456c5a63baf3998b5df04da53fdc9c5197c9289f))


### Bug Fixes

* clear out the last type warnings ([f2ef688](https://github.com/fluidd-core/fluidd/commit/f2ef688bcf8a10cd5a6eb8b9f14ab95ef01a554a))
* ensure config fetches are not cached ([928695b](https://github.com/fluidd-core/fluidd/commit/928695b0141d7bfcfec42c27ce8964e76be2b268))
* toolhead / extruder moves now work properly ([816eb35](https://github.com/fluidd-core/fluidd/commit/816eb3509bcd880799dbb731eabf6988c84aa757))
