# Draggable Sidebar Links & Bookmarks Popup

## Overview

Add drag-to-reorder for sidebar navigation icons and a bookmarks popup for collapsed custom links. System links and custom links are independently reorderable within their own groups. Collapsed items are accessible via popup menus: the hamburger menu for system links, a new bookmarks menu for custom links.

## Sidebar Layout

```
[draggable: visible system links]
[hamburger menu]                    <- v-if collapsed system links exist
[draggable: visible custom links]
[bookmarks menu]                    <- v-if collapsed custom links exist
[settings]                          <- always last, not draggable
```

Both popup menus are hidden when their collapsed group is empty.

## Data Model

### New fields in `NavigationConfig`

```ts
systemLinkOrder: string[]       // master order of system link IDs (empty = hardcoded order)
collapsedCustomLinks: string[]  // IDs of custom links collapsed into bookmarks popup
```

Defaults: both `[]`.

### Existing fields used

- `collapsedSystemLinks: string[]` -- already implemented
- `CustomNavLink.position: number` -- already used for custom link ordering

### New icon

Register `mdiBookmarkMultiple` as `$bookmarkMultiple` in `globals.ts`.

## Drag-and-Drop

Uses the existing `AppDraggable` wrapper (sortablejs) already used by dashboard, diagnostics, macros, and job queue.

**Interaction model:** Natural drag detection. Click navigates, click-and-drag reorders. No mode toggle needed -- sortablejs handles the distinction natively.

**System links group:**
- `<app-draggable v-model="orderedVisibleSystemLinks" @end="saveSystemLinkOrder">`
- On drag end, persist the full master order (visible + collapsed) to `systemLinkOrder` via `config/saveByPath`
- Collapsed items in the hamburger popup maintain their position in the master order but are not draggable within the popup

**Custom links group:**
- `<app-draggable v-model="orderedVisibleCustomLinks" @end="saveCustomLinkOrder">`
- On drag end, update `position` values based on new indices via existing `updateCustomNavLink` action
- Collapsed items in the bookmarks popup maintain their `position`-field order but are not draggable within the popup

## Context Menus

### System links (existing -- no change)

- Right-click visible system link: "Collapse to More menu"
- Right-click item in hamburger popup: "Show in sidebar"

### User-created custom links (new)

- Right-click visible or popup item, three options:
  - "Collapse to bookmarks" / "Show in sidebar" (eye toggle)
  - "Edit" (opens existing NavLinkDialog)
  - "Delete" (existing confirm-and-remove flow)

### Theme links (new)

- Right-click visible or popup item, two options:
  - "Collapse to bookmarks" / "Show in sidebar" (eye toggle)
  - "Hide" (uses existing `hiddenThemeLinks` mechanism)

### Implementation

A single context menu `v-menu` in `AppNavDrawer.vue` handles all groups. Menu items rendered depend on `contextMenuState.type` (`'system'` | `'custom'` | `'theme'`).

`AppNavExternalItem.vue` needs the same `@contextmenu.prevent="$emit('contextmenu', $event)"` treatment applied to `AppNavItem.vue`.

## Bookmarks Popup

Mirrors the hamburger menu pattern:
- `v-menu` with `right`, `offset-x`, `close-on-content-click`
- Activator: `v-list-item` with `$bookmarkMultiple` icon, wrapped in `v-tooltip`
- Content: `v-list` of collapsed custom links, each opening its external URL
- Hidden when no custom links are collapsed (`v-if="collapsedCustomLinkItems.length > 0"`)

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `src/globals.ts` | Import + register `mdiBookmarkMultiple` as `$bookmarkMultiple` |
| 2 | `src/store/config/types.ts` | Add `systemLinkOrder: string[]`, `collapsedCustomLinks: string[]` |
| 3 | `src/store/config/state.ts` | Add defaults for both new fields |
| 4 | `src/components/layout/AppNavDrawer.vue` | Wrap both groups in `app-draggable`, add bookmarks popup, extend context menu, add order persistence |
| 5 | `src/components/ui/AppNavExternalItem.vue` | Add contextmenu event forwarding |
| 6 | `src/locales/en.yaml` | Add `bookmarks`, `collapse_to_bookmarks` locale strings |

## Locale Strings

```yaml
# app.general.title
bookmarks: Bookmarks

# app.general.label
collapse_to_bookmarks: Collapse to bookmarks
# show_in_sidebar already exists
# collapse_to_more_menu already exists
```
