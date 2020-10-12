# TODO [fluidd]

## Next Up
- confirm  host restart and shutdown works
- why on klippy crash did eddie not get the disconnected screen stuff?
  - maybe because none of the state updated, or something else?
- expand current print metadata (with bigger thumb?)
- file / folder move
- dynamic favicon that looks like the percent finished ring
- probed vs mesh bed level display option
- mobile layout
- temperature presets
- sqv etc..

## Known Bugs:
- multi line gcodes not having a Send: prefix after the first line
- if you complete a print, then delete the original gcode;
  - then you can still attempt to reprint something that's no longer there and;
  - the metadata load fails because the file is no longer there.

## General Improvements
- should be able to force part speed fan during a print
- console line item management needs improving
- draggable dashboard panels?
- allow contraction and expansion of dashboard panels?
- add console.log wrapper for dev vs prod
- add a throttle to (socket notifications) temp updates, print timers, position trackers.
- Performance / memory heap checks
- add status of heater_fans (extruder fan and controller fan)
- stick git version in the footer somewhere for klipper, moonraker and fluidd
- filter out temp waits from console
- cancel and pause really need a confirm dialog

## Filesystem Improvements:
- file expand details for metadata
- ability to move folder / files
- better place for print thumbs

## [Page] UI Settings
- temp presets (needs config)
- rotate camera
- power control module

## [Page] Printer Configuration
- add widget for setting z offset during configuration
- add a widget to configure ztilt
- machine limits (set velocity, accel, decel and square corner velocity)

## User wants
- Dry run. (print without extruding)
- Cancel object, cancel area,
- gcode viewer that works with more than 25mb
- timelapses
- plugins for raise cloud, astroprint and alike
- to remote access without vpn and shit
- more secure