# TODO [fluidd]

## Next Up
- cleanup socket store / move socket out and keep printer data
- split utils mixin into many mixins, in a logical way
- expand current print metadata (with bigger thumb?)
- file / folder move
- dynamic favicon that looks like the percent finished ring
- probed vs mesh bed level display option
- temperature presets
- sqv, machine limits etc..

## Known Bugs:
- if you complete a print, then delete the original gcode;
  - then you can still attempt to reprint something that's no longer there and;
  - the metadata load fails because the file is no longer there.
- max_accel and max_accel_to_decel are actually floats, even tho they're potentially very large
  whole numbers. max_accel_to_decel is half of max_accel if not defined in your printer.cfg, so
  potentially returns a float (3001 / 2 === 1500.5). The v-slider doesn't really represent this
  at the moment tho. Is this a problem?

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

## [Page] UI Settings
- temp presets (needs config)
- rotate camera
- power control module

## [Page] Printer Configuration
- add pid heater calibrate
- add stepper buzz
- add z endstop calibrate
- 
- add widget for setting z offset during configuration
- add a widget to configure ztilt
- machine limits (set velocity, accel, decel and square corner velocity)

## User wants
- maybe look at tightening the mobile ui. have fan's as a value, that you can click
  on which then makes a popout to adjust fan?
- gcode viewer
- gcode analyser
- ability to categorise / group macros and expand contract them
- Dry run. (print without extruding)
- Cancel object, cancel area,
- gcode viewer that works with more than 25mb
- timelapses
- plugins for raise cloud, astroprint and alike
- to remote access without vpn
- more security?