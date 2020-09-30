# TODO [fluidd]

## Next Up
- toasts on error (like move is out of bounds!!)
- Figure out a first release zip + process
- Printer setup page + bed levelling

## Known Bugs:
- during pause / resume - the button states change incorrectly
- multi line gcodes not having a Send: prefix after the first line
- move app.vue css to its own css file
- if you complete a print, then delete the original gcode;
  - then you can still attempt to reprint something that's no longer there and;
  - the metadata load fails because the file is no longer there.

## General Improvements
- add console.log wrapper for dev vs prod
- add a throttle to temp updates, print timers, position trackers.
- Performance / memory heap checks
- bed levelling
- filament sensor status
- add status of heater_fans (extruder fan and controller fan)
- allow theme change dark / light
- stick git version in the footer somewhere
- filter out temp waits from console
- cancel and pause really need a confirm dialog

## Filesystem Improvements:
- file expand details for metadata
- ability to move folder / files
- better place for print thumbs

## [Page] UI Settings
- Allow selection of default print time estimates (slicer, file or filament based)
- temp presets (needs config)
- rotate camera
- power control module

## [Page] Printer Configuration
- add a setup printer page, whereby we can set z-offset, look at configuration
  and run bed levelling and / or ztilt
- machine limits (set velocity, accel, decel and square corner velocity)
- endstops under printer config
- bed tilt, quad gantry level, other optional things in klipper
