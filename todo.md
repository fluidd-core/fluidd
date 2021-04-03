# TODO [fluidd]

## Next Up

- sotware updates to interface screen?
- add notification in hamburger menu again, and to interface option..

- impl new version recovery
- impl git commit history

### Features

- More macro layout options (categorize macros, ability to define layout in some way, color)
- alternate bed mesh scales
- file system enhancements
  - bulk actions to delete or move?
  - copy file
  - move dialog
  - bulk action move
- allow deletion of all printers on fluidd.xyz
- allow users to show / hide pin outputs

### Refactors

- sync instances across moonraker db
- use components instead of plugins with moonraker
- rename device power store
- cleanup card layout stuff
  - hide enabled flag for collapsable card for camera panel on dashboard
- change card states to db and be driven by getters..

### Docs

- update docs to mention cura uploads
- update docs re: output pins

## Filesystem Improvements

- Bulk actions on files

## Refactoring / Core

- loading heaters, fans or pins means these are constantly updated - due to temps changing
  often. Need a more elegant way to load just the names of these items without parts of the
  reactive data that is changed so often

- adding multiple printers to carry over between devices
- add a cached throttle to (socket notifications) temp updates, print timers, position trackers.

## Known Bugs

- if you complete a print, then delete the original gcode;
  - then you can still attempt to reprint something that's no longer there and;
  - the metadata load fails because the file is no longer there.

## General Improvements

- probed vs mesh bed level display option

## [Page] Printer Configuration

- PID calibrate option for heaters (hotend + bed etc)
- z-offset configuration + sheet config + probe calibration
- add stepper buzz
- add z endstop calibrate
- add widget for setting z offset during configuration
- add a widget to configure ztilt (needed?)

## User wants (not necessarily something we'll implement in the suggested way...)

- add QUERY_PROBE to endstops widget
- maybe look at tightening the mobile ui. have fan's as a value, that you can click
  on which then makes a popout to adjust fan?
- gcode viewer
- gcode analyser
- Cancel object, cancel area,
- gcode viewer that works with more than 25mb
- timelapses
- plugins for raise cloud, astroprint and alike
- to remote access without vpn
- more security?
