# Theme Icon Separation & Multiple Sponsor Links

## Overview

Extract inline SVG icon data from `config.json` into separate SVG files, split theme visual assets into three distinct roles (toolbar logo, nav icon, background watermark), and support multiple sponsor links per theme preset.

## Motivation

Theme presets currently store nav sidebar icons as raw `SvgIconPath[]` (SVG path `d` attributes + fill colors) inline in `config.json`. Some of these are enormous path strings that bloat the config. Meanwhile, toolbar logos are already stored as separate SVG files in `public/`. This change:

- Moves nav icons to separate SVG files, matching the existing logo pattern
- Allows sponsors to provide distinct assets for toolbar, nav sidebar, and background
- Supports multiple sponsor links per theme (e.g. main site, shop, docs)
- Maintains backwards compatibility with old-format configs

## Data Model Changes

### `ThemeLogo` (revised)

```ts
export interface ThemeLogo {
  src: string          // toolbar logo filename (required)
  icon?: string        // nav sidebar icon filename (optional, falls back to src)
  background?: string  // background watermark filename (optional, falls back to src)
  dark?: string        // dark theme color (existing)
  light?: string       // light theme color (existing)
}
```

Fallback chain: `icon` → `src`, `background` → `src`.

### `ThemeLink` (new)

```ts
export interface ThemeLink {
  title: string        // display name in sidebar
  url: string          // target URL
  icon?: string        // per-link icon override filename (optional, falls back to preset's logo.icon → logo.src)
}
```

### `ThemePreset` (revised)

```ts
export interface ThemePreset {
  name: string
  color: string
  isDark: boolean
  logo: ThemeLogo
  links?: ThemeLink[]           // new: multiple sponsor links
  url?: string                  // deprecated: single-link shorthand, still supported
  icon?: SvgIconPath[]          // deprecated: inline SVG paths, still supported
}
```

### Deprecation Strategy

- `url` (string): If `links` is absent but `url` exists, treated as `[{ title: preset.name, url: preset.url }]`
- `icon` (SvgIconPath[]): If `logo.icon` is absent but top-level `icon` array exists, used as legacy fallback
- Both deprecated fields can be removed in a future major version

## SVG File Format

Icon SVG files use CSS variable references for dynamic theming:

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56">
  <path d="M 15.273 33.573..." fill="var(--v-primary-offset-base, #2e75ae)" />
  <path d="M 28 0.895..." fill="var(--v-primary-base, #2196f3)" />
</svg>
```

Theme creators will be given instructions on how to format SVG files with appropriate CSS variable tags. Files are rendered via `inline-svg` (injected into the DOM), so CSS variables resolve naturally from the page context.

### File Naming Convention

Prefix pattern matching existing `logo_*.svg` convention:

- `logo_fluidd.svg` — toolbar logo (existing)
- `icon_fluidd.svg` — nav sidebar icon (new)
- `bg_fluidd.svg` — background watermark (new, optional)

All files live flat in `public/`.

### Initial Migration

- Create `icon_*.svg` from current inline `SvgIconPath[]` data (viewbox 0 0 56 56)
- Leave `logo_*.svg` unchanged (toolbar logo)
- No `bg_*.svg` files initially — fall back to `logo.src` until sponsors provide custom backgrounds

## config.json Example

### Before

```json
{
  "name": "Fluidd",
  "color": "#2196F3",
  "isDark": true,
  "logo": {
    "src": "logo_fluidd.svg"
  },
  "icon": [
    { "d": "M 15.273 33.573 L 26.518...", "fill": "var(--v-primary-offset-base, #2e75ae)" },
    { "d": "M 28 0.895 L 51.64...", "fill": "var(--v-primary-base, #2196f3)" }
  ],
  "url": "https://docs.fluidd.xyz/"
}
```

### After

```json
{
  "name": "Fluidd",
  "color": "#2196F3",
  "isDark": true,
  "logo": {
    "src": "logo_fluidd.svg",
    "icon": "icon_fluidd.svg"
  },
  "links": [
    { "title": "Fluidd", "url": "https://docs.fluidd.xyz/" }
  ]
}
```

### Multiple Links Example

```json
{
  "name": "Cocoa Press",
  "color": "#F27121",
  "isDark": true,
  "logo": {
    "src": "logo_cocoapress.svg",
    "icon": "icon_cocoapress.svg"
  },
  "links": [
    { "title": "Cocoa Press", "url": "https://cocoapress.com/" },
    { "title": "Shop", "url": "https://shop.cocoapress.com/", "icon": "icon_cocoapress_shop.svg" }
  ]
}
```

## Rendering Changes

### Nav Icon (`AppNavLinkIcon.vue`)

Add a new rendering path for SVG filenames. Updated priority:

1. `customImage` (base64 data URI) → `<img>` tag *(existing)*
2. `customIcon` as `SvgIconPath[]` → multi-path SVG *(existing, kept for legacy)*
3. **`customIcon` as string ending in `.svg`** → `<inline-svg :src="baseUrl + customIcon">` *(new)*
4. `customIcon` as data URL → masked/img *(existing)*
5. `customIcon` as single SVG path string → single-path SVG *(existing)*
6. Fallback → `<v-icon>` with MDI icon *(existing)*

This only affects theme/sponsor icons in practice — user-created custom links store icon data in the moonraker DB (MDI names, emoji, data URIs) and never reference `.svg` filenames.

### Background Watermark (`App.vue`)

Resolve `logo.background` with fallback to `logo.src`:

```ts
get logoSrc (): string {
  const bg = this.theme.logo.background || this.theme.logo.src
  return `${import.meta.env.BASE_URL}${bg}`
}
```

No other changes to background rendering (positioning, opacity, toggle all stay the same).

## Getter Changes (`getThemeNavLinks`)

Rewrite to handle multiple links and the icon fallback chain:

```
1. Resolve links array:
   - preset.links exists? → use it
   - preset.url exists?   → [{ title: preset.name, url: preset.url }]
   - neither?             → return [] (no nav links)

2. Resolve icon per link:
   - link.icon exists?              → use it (svg filename)
   - preset.logo.icon exists?       → use it (svg filename)
   - preset.icon exists? (array)    → use it (legacy SvgIconPath[])
   - fallback                       → preset.logo.src (rendered via inline-svg)

3. Generate stable IDs:
   - Single link:    "preset-{logo.src}" (preserves existing user settings)
   - Multiple links: "preset-{logo.src}-{index}" for index > 0
```

## Link ID Stability

User settings (`themeLinkPositions`, `hiddenThemeLinks`, `collapsedCustomLinks`) key off link IDs. To avoid breaking existing settings:

- First link in a preset keeps the original ID format: `preset-${logo.src}`
- Additional links use indexed format: `preset-${logo.src}-1`, `preset-${logo.src}-2`, etc.

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `src/store/config/types.ts` | Add `ThemeLink` interface, add `icon`/`background` to `ThemeLogo`, add `links` to `ThemePreset` |
| 2 | `src/store/config/getters.ts` | Rewrite `getThemeNavLinks` — resolve links array, icon fallback chain, stable IDs |
| 3 | `src/components/ui/AppNavLinkIcon.vue` | Add `inline-svg` rendering path for `.svg` filenames |
| 4 | `src/components/App.vue` | Resolve `logo.background` → `logo.src` fallback for background watermark |
| 5 | `public/config.json` | Migrate all presets: add `logo.icon`, convert `url` to `links`, remove inline `icon` arrays |
| 6 | `public/icon_*.svg` | New files — extracted from current inline `SvgIconPath[]` data |

### Files NOT modified

- `AppNavExternalItem.vue` — passes props through, no icon awareness
- `AppNavDrawer.vue` — consumes `getCustomNavLinks`, unaffected by upstream changes
- `NavigationSettings.vue` — displays whatever `getCustomNavLinks` returns
- `AppDraggable.vue` — no icon awareness
- Store actions/mutations/state — no changes beyond types
