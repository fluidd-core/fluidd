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

![Macro panel showing a macro with category assignment and color picker](/assets/images/macros2.png)
![Macro dashboard card showing categorized macro buttons](/assets/images/macros1.png)

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

## Further reading

- [Klipper `[gcode_macro]` configuration reference](https://www.klipper3d.org/Config_Reference.html#gcode_macro) — all parameters including `variable_*`, `rename_existing`, and `description`.
- [Klipper command templates](https://www.klipper3d.org/Command_Templates.html) — Jinja2 templates, the `printer` object, delayed G-code, and macro sequencing.

## Troubleshooting

### Macro not appearing on the dashboard

- Macros prefixed with `_` are hidden automatically. Remove the underscore if you want the macro visible.
- Verify the macro loaded without errors — check the Fluidd console for any startup messages after a Klipper restart. A config syntax problem will prevent macros from loading.
- If the macro appears in Klipper but not Fluidd, try refreshing the page after restarting Klipper.

### Tool Card button not appearing

Fluidd matches macro names case-insensitively, but the name must be an exact match otherwise. Confirm your macro name matches one of the names listed in the [Tool Card Macros](#tool-card-macros) table above.
