---
title: Macros
---

# Macros

Fluidd displays all G-code macros defined in your Klipper configuration. You
can toggle their visibility, organize them into categories, and assign colors.

Macros prefixed with an underscore (`_`) are hidden from the macro panel
automatically.

To categorize a macro, first create a category in the settings menu, then click
a macro's menu to assign it to a category and choose a color.

![screenshot](/assets/images/macros2.png)
![screenshot](/assets/images/macros1.png)

## Tool Card Macros

Fluidd detects specific macro names and adds dedicated buttons to the
Toolhead card's Tools dropdown. If multiple names are defined for the same
action, the first match in the list is used:

| Action              | Detected Macro Names                                                     |
|---------------------|--------------------------------------------------------------------------|
| **Load Filament**   | `LOAD_FILAMENT`, `FILAMENT_LOAD`, `M701`                                 |
| **Unload Filament** | `UNLOAD_FILAMENT`, `FILAMENT_UNLOAD`, `M702`                             |
| **Clean Nozzle**    | `CLEAN_NOZZLE`, `NOZZLE_CLEAN`, `WIPE_NOZZLE`, `NOZZLE_WIPE`, `G12`      |
| **Park Toolhead**   | `PARK_TOOLHEAD`, `TOOLHEAD_PARK`, `G27`                                  |
