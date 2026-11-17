# G-code preview

Read before touching `src/workers/parseGcode*`, `src/workers/gcode-extrusion-roles.ts`, `src/store/gcodePreview/`, `src/util/gcode-preview.ts`, or `src/components/widgets/gcode-preview/`.

- Parsed in `parseGcode.worker.ts` → `parseGcode.ts`, streamed via `fetch` + `ReadableStream`.
  The result is a **columnar `MoveStore`** of typed arrays (`src/store/gcodePreview/types.ts`),
  every column indexed by the same move index. The worker **transfers** the buffers; the parser
  owns nothing afterwards
- `x`/`y`/`z` are forward-filled absolute positions. `i`/`j` are only valid on a move with the
  `Arc` flag (they're truncated after the last arc)
- `MoveFlags` is a bit field — test with `(flags[i] & MoveFlags.Arc) !== 0`. `Extruding` needs E
  to increase **and** X/Y to change (or an arc), like PrusaSlicer: E-only primes and Z-only moves
  are not extrusions, and stay out of `roles` and the ranges
- `role` (`ExtrusionRole`, PrusaSlicer's enum, Brim folded into Skirt) is sticky from the last
  whole-line role comment. `gcode-extrusion-roles.ts` merges every slicer's tags into one
  case-insensitive dictionary — no slicer detection; a tag shared by two slicers must map to the
  same role (a spec enforces it)
- `speed` is the sticky feedrate in **mm/min** (UI shows mm/s). `fan` is the raw `M106 S` value
  (0–255) with Klipper semantics: no `S` = 255, `P` ignored, `M107` = 0, `SET_FAN_SPEED` ignored
- `temp` is the current tool's **heater** target in whole °C, starting at 0 (a real 0). A tool is
  mapped to a heater on first use: a temp command naming tool `n` (`M104`/`M109 T<n>`,
  `SET_HEATER_TEMPERATURE HEATER=extruder[N]`) gives it heater `n`; switching to an unmapped tool
  (`T<n>`, `M600`) makes it **share the current tool's heater**, as MMU lanes do. Missing `TARGET`
  is 0; other heaters are ignored; no seeding from file metadata
- `roles`, `speedRange`, `fanRange`, `tempRange` cover extruding moves over the whole file, so
  legends stay stable across layers. `count` is exact only up to 2 distinct values
- A layer's `move` is an **anchor** — see the comment on `buildLayerPaths`
- `LayerPaths.extrusions` is keyed by colour group per `colorBy`: `T<tool>`, `R<role>`,
  `S<bucket>`, `F<bucket>`, `C<bucket>` (temperature). `rangeBucket` picks the nearest of 11
  `rangeColors` stops (PrusaSlicer's palette). Only the current layer is coloured. No fallback: a
  file without role tags or extrusions draws as `R0` / `S0` / `F0` / `C0` with an empty legend
- Oversized files are truncated by the parser (`truncated`), surfaced as an `EventBus` warning
