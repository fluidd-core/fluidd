# TODO [fluidd]

## Next Up

- use components instead of plugins with moonraker
- move config widgets and sort into config vs tune
  - general component layout re-arrangement
  - rename device power store
- multiple cameras
- add git history
- change card states to db and be driven by getters..
- move klipper restarts elsewhere so service restarts are their own thing
  - allow users to restart webcamd service if webcam is enabled

- update docs to mention cura uploads
- docs on configuring a camera

- bulk actions to delete or move?
- move dialog
- bulk action move

- More macro layout options (categorize macros, ability to define layout in some way, color)
- cleanup card layout stuff
- sync instances across moonraker db
- i18n (translations)

- allow deletion of all printers on fluidd.xyz
- show known meta data on print dialog (for dashboard jobs page..)?
- allow users to show / hide pin outputs

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

- allow defining more than one camera
- themes (pick a specific theme (red, green etc..)
- figure out https
- click / tap image camara update option (i.e., not constant image updates)
- probed vs mesh bed level display option
- should be able to force part speed fan during a print?

## [Page] Printer Configuration

- PID calibrate option for heaters (hotend + bed etc)
- z-offset configuration + sheet config + probe calibration
- add stepper buzz
- add z endstop calibrate
- add widget for setting z offset during configuration
- add a widget to configure ztilt (needed?)

## User wants (not necessarily something we'll implement in the suggested way...)

- option to customize color of the logo at top-left (and subsequently on your browser tab and bookmark)
- add QUERY_PROBE to endstops widget
- parse underscores out of macro names
- another request to have the current temps above the macors etc during a print, but not while not printing.
- draggable dashboard panels?
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