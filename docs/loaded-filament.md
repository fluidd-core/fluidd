# Loaded filament (KAN-516)

This is the contract for Fluidd, the embedded Muon3D Slicer and MuonUI.
Klipper's `save_variables.variables` is the authority on an M1:

```json
{ "muon_material": "PETG", "muon_material_colour": "2F63C6" }
```

`muon_material` is the material name already written by MuonUI (KAN-479).
`muon_material_colour` is an optional six-digit RGB hex string, stored without
`#` so it cannot start a G-code comment. Writers uppercase it; readers accept
either case, an optional `#`, and surrounding quotes from older clients.
Missing or invalid colour means unknown, not the material type's swatch.
Runtime APIs and the existing `printer.material` bridge use `#RRGGBB` or null.
Colour names are optional presentation labels derived from the hex; clients
must preserve custom hex colours even when they have no palette name.

Use Klipper's existing command, for example:

```gcode
SAVE_VARIABLE VARIABLE=muon_material VALUE='"PETG"'
SAVE_VARIABLE VARIABLE=muon_material_colour VALUE='"2F63C6"'
```

Each command updates a field of the same loaded-filament record. Changing a
material preserves the colour; changing a colour preserves the material.
The two commands are not an atomic transaction: subscribers can see the
material before its new colour. Treat Moonraker's confirmed status as truth,
including after write errors, reconnects and a switch of printers. Never
write in response to a status update; that would create an echo loop.

Fluidd PR #57 wrote `muon_material_color`. Readers use that legacy spelling
only when the canonical key is absent. They never write it. A present invalid
canonical value does not resurrect an old colour. Existing printers migrate
on the next explicit colour selection; no boot-time write is needed.

Overview and Control use Fluidd's existing subscription to all Klipper
objects, including `save_variables`. Slice keeps PR #57's `printer.material`
callback and sends `printer.setup` after confirmed changes. The slicer also
subscribes to its selected printer's saved variables. MuonUI already
subscribes to `save_variables.variables`; its material and colour lists read
that store live. The M1 part and loose filament share the loaded colour.

The saved loaded record takes precedence over Spoolman's active spool or
heater-derived guesses. Spoolman and heater fallback remain useful when no
loaded material has been recorded. A printer without `[save_variables]`
retains Fluidd's existing local fallback.

Material selection is locked while printing or paused, as in PR #57. Colour
may change at any time. These writes neither heat nor move the printer and
do not alter filament auto-load, `insert_gcode`, or developer-mode policy.
No MuonOS default or macro change is required: `SAVE_VARIABLE` creates the
colour key on first selection.
