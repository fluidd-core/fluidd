---
title: Multi-Material
---

# Multi-Material

Fluidd supports multi-extruder setups and integrates with Spoolman for
filament spool tracking.

## Multiple Extruders

Fluidd supports single extruder, multiple extruder, and multiple extruder
stepper configurations. Pressure Advance values can be set for all
configurations.

![Multiple extruder controls with per-extruder Pressure Advance settings](/assets/images/multiple-extruders.png)

For multiple extruder stepper setups, Fluidd shows a section for each stepper
where you can enable or disable it, associate it with an extruder, and set
Pressure Advance values.

![Multiple extruder stepper panel with enable, extruder, and Pressure Advance controls](/assets/images/multiple-extruder-steppers.png)

## Spool Management (Spoolman)

Fluidd integrates with
[Spoolman](https://github.com/Donkie/Spoolman) for filament spool tracking.

### Print start

On print start, Fluidd shows a modal asking you to select a spool. You can
pick one from the list or scan an associated QR code using an attached webcam.
This modal can be disabled in Fluidd settings.

![Spoolman spool selection modal with a QR code scanner](/assets/images/spoolman-scan-spool.png)

### Dashboard card

The currently selected spool and its metadata are shown in the Spoolman
dashboard card. Use the "Change Spool" button to switch spools mid-print.

![Spoolman dashboard card showing the active spool details with filament info](/assets/images/spoolman-dashboard-card.png)

### Sanity checks

When starting a print or changing spools, Fluidd automatically checks:

1. A spool is selected.
2. The spool has enough filament to finish the job.
3. The spool's filament type matches the one selected in the slicer.

### Toolchanger support

For toolchange macros to appear in the "Change Spool" dropdown, add a
`spool_id` variable to your `gcode_macro` with a default value of `None`,
and call
[`SET_ACTIVE_SPOOL`](https://moonraker.readthedocs.io/en/latest/configuration#setting-the-active-spool-from-klipper)
in your toolchange macro:

```ini title="printer.cfg"
[gcode_macro T0]
variable_spool_id: None
gcode:
  ...
  SET_ACTIVE_SPOOL ID={ printer['gcode_macro T0'].spool_id }
  ...
```

![Spoolman multi-tool panel with per-toolchange-macro spool assignment](/assets/images/spoolman-multitool.png)

### Remembering spools across restarts

If Fluidd detects a
[`[save_variables]`](https://www.klipper3d.org/Config_Reference.html#save_variables)
section in your configuration, it will automatically save the selected spool
on each change. Use this macro to restore the selection after a restart:

```ini title="printer.cfg"
[delayed_gcode RESTORE_SELECTED_SPOOLS]
initial_duration: 0.1
gcode:
  {% set svv = printer.save_variables.variables %}
  {% for object in printer %}
    {% if object.startswith('gcode_macro ') and printer[object].spool_id is defined %}
      {% set macro = object.replace('gcode_macro ', '') %}
      {% set var = (macro + '__SPOOL_ID')|lower %}
      {% if svv[var] is defined %}
        SET_GCODE_VARIABLE MACRO={macro} VARIABLE=spool_id VALUE={svv[var]}
      {% endif %}
    {% endif %}
  {% endfor %}
```
