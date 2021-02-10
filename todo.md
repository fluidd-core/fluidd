# TODO [fluidd]

## Next Up

- sync instances across fluidd.json files
- implement final filesystem features (bulk actions & move)
- More macro layout options (categorize macros, ability to define layout in some way, color)
- temperature graph tooltips / hover
- i18n (translations)
- filesystem browser to use same scrollbar as console
- primary color picker
- macros have inputs via settings, impl a UI dialog for this?

- refactor store modules
- loading heaters, fans or pins means these are constantly updated - due to temps changing
  often. Need a more elegant way to load just the names of these items without parts of the
  reactive data that is changed so often

- print history
- allow deletion of all printers on fluidd.xyz
- show known meta data on print dialog (for dashboard jobs page..)?
- print instances having data bleed? [github issue]
- ability to reprint after cancel
- client showing in update menu when swapping printers via fluidd.xyz
- allow users to show / hide pin outputs

## Filesystem Improvements

- add filesystem usage
- ability to move folder / files
- Bulk actions on files
- Drag and Drop move.

## Refactoring / Core

- adding multiple printers to carry over between devices
- cleanup socket store / move socket out and keep printer data
- split utils mixin into many mixins, in a logical way
- add console.log wrapper for dev vs prod
- add a cached throttle to (socket notifications) temp updates, print timers, position trackers.
- Performance / memory heap checks

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