# Printer setup & macros

Fluidd requires some basic configuration to applied in order to function correctly. Fluidd should warn you if these are not found in your configuration upon startup.

## Configuration

### [virtual_sdcard]
Fluidd requires your printer be setup with `virtual_sdcard`. This allows file uploads to work correctly. If you get a geodes path not found error in Fluidd this is generally the first place to look.
```yml
[virtual_sdcard]
path: ~/gcode_files
```

### [display_status]
Required to properly support display updates in fluidd- with no other lines required.
```yml
[display_status]
```

### [pause_resume]
Enables Pause / Resume functionality within klipper. This is a single block, with no other lines required.
```yml
[pause_resume]
```

## Macros
These can be assumed sane defaults, but should be checked and modified to your own needs.

```yml
[gcode_macro PAUSE]
rename_existing: BASE_PAUSE
default_parameter_X: 230    # edit to your preferred park position
default_parameter_Y: 230    # edit to your preferred park position
default_parameter_Z: 10     # edit to your preferred park position
default_parameter_E: 1      # edit to your preferred retract length
gcode:
    SAVE_GCODE_STATE NAME=PAUSE_state
    BASE_PAUSE
    G91
    G1 E-{E} F2100
    G1 Z{Z}
    G90
    G1 X{X} Y{Y} F6000
```

```yml
[gcode_macro RESUME]
rename_existing: BASE_RESUME
default_parameter_E: 1      # edit to your preferred retract length
gcode:
    G91
    G1 E{E} F2100
    G90
    RESTORE_GCODE_STATE NAME=PAUSE_state MOVE=1
    BASE_RESUME
```

```yml
[gcode_macro CANCEL_PRINT]
rename_existing: BASE_CANCEL_PRINT
gcode:
    TURN_OFF_HEATERS
    CLEAR_PAUSE
    SDCARD_RESET_FILE
    BASE_CANCEL_PRINT
```
