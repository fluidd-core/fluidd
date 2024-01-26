---
layout: default
title: Spool Management
parent: Features
nav_order: 17
permalink: /features/spoolman
---

# Spool Management
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

Fluidd offers support for the [Spoolman](https://github.com/Donkie/Spoolman) filament spool manager.

### Print start
On print start, Fluidd will show a modal asking you to select the spool you want to use for printing.
The modal shows all available (i.e. not archived) spools.
A spool can either be selected by selecting it directly, or by scanning an associated QR code using an attached webcam.

![screenshot](/assets/images/spoolman-scan-spool.png)

Automatically opening the spool selection modal can be disabled from the Fluidd settings.

### Dashboard card
The currently selected spool and its metadata is shown in the Spoolman dashboard card.

#### Selecting a different spool
If you need to select another spool during your print (e.g. when your current spool has run out, or you have a multicolor print),
you can do so through the "Change Spool" button in the dashboard card.

![screenshot](/assets/images/spoolman-dashboard-card.png)

### Sanity checks
When starting a print or changing spools, Fluidd will automatically perform these sanity checks and warn you if they fail:  
1) a spool is selected  
2) the selected spool has enough filament left on it to finish the print job  
3) the selected spool's filament type matches the one selected in the slicer  

### Toolchanger Support
Fluidd supports selecting spools for individual toolchange macros.
For toolchange macros to show up in the "Change Spool" dropdown, simply add a `spool_id`
variable to your toolchange `gcode_macro`s with a default value of `None`.
You will also need to call the [`SET_ACTIVE_SPOOL`](https://moonraker.readthedocs.io/en/latest/configuration#setting-the-active-spool-from-klipper)
macro in an appropriate place in your toolchange macro.

```yaml
[gcode_macro T0]
variable_spool_id: None
gcode:
  ...
  SET_ACTIVE_SPOOL ID={ printer['gcode_macro T0'].spool_id }
  ...
```

![screenshot](/assets/images/spoolman-multitool.png)

#### Remembering associated spools across restarts
By default, Klipper does not keep track of Gcode macro variables across restarts.
If Fluidd detects a [`[save_variables]`](https://www.klipper3d.org/Config_Reference.html#save_variables)
section in your configuration, it will automatically emit a `SAVE_VARIABLE` command
on spool selection, saving the selected spool to the `<MACRO_NAME>__SPOOL_ID` variable.

You can use the following macro to restore the previous selection after a restart:
{% raw %}
```yaml
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
{% endraw %}
