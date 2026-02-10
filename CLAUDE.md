# Fluidd Project Notes

Running notes for Claude sessions to maintain context across conversations.

## Session Startup

**ALWAYS load superpowers at the start of every session:**
```
/superpowers:using-superpowers
```

This ensures skills are available for brainstorming, debugging, TDD, code review, etc.

## Current Work: Custom Navigation Links Feature

**Branch:** `feat/custom-nav-links`
**Base:** `develop`
**Status:** Feature complete, pending final review/PR

### Feature Overview

Adding user-configurable custom navigation links to the Fluidd sidebar with:
- Add/edit/delete custom external links
- Icon selection (Material Design, Klipper categories, URL favicons, custom emoji)
- Drag-to-reorder for both system and custom links
- Collapsible links with bookmarks popup for hidden custom links
- Import/export configuration
- Expandable sidebar with hover-to-expand functionality
- Context menus for all link types (system/custom/theme)

### Key Files

| Component | Path |
|-----------|------|
| Main sidebar | `src/components/layout/AppNavDrawer.vue` |
| Add/edit dialog | `src/components/settings/navigation/NavLinkDialog.vue` |
| Settings panel | `src/components/settings/navigation/NavigationSettings.vue` |
| External link item | `src/components/ui/AppNavExternalItem.vue` |
| Icon renderer | `src/components/ui/AppNavLinkIcon.vue` |
| Draggable wrapper | `src/components/ui/AppDraggable.vue` |
| Store types | `src/store/config/types.ts` |
| Store state | `src/store/config/state.ts` |
| Store actions | `src/store/config/actions.ts` |
| Store getters | `src/store/config/getters.ts` |
| Locale strings | `src/locales/en.yaml` |

### Implementation Plan

See: `docs/plans/2026-01-28-draggable-sidebar-and-bookmarks-design.md`

### Commits on This Branch

1. `e8e85a2d` - Initial custom navigation links implementation
2. `0dacdc75` - Enhanced dialog with icon type selector
3. `2fabd70c` - Draggable sidebar links, bookmarks popup, unified context menu
4. `d7b1f9e7` - Expandable sidebar with persistent toggle and hover-to-expand
5. `fbae938a` - Import/export, drag fixes, Firefox compatibility
6. `45b39dd8` - Theme link position reactivity fix

### Data Model

```ts
// CustomNavLink in store/config/types.ts
interface CustomNavLink {
  id: string
  title: string
  url: string
  iconType: 'material' | 'klipper' | 'url' | 'emoji'
  icon: string        // MDI icon name, klipper category, URL, or emoji
  position: number
}

// NavigationConfig additions
systemLinkOrder: string[]       // master order of system link IDs
collapsedCustomLinks: string[]  // IDs collapsed into bookmarks popup
```

### Decisions Made

- Custom links stored in local Fluidd config (not moonraker)
- Drag detection is native sortablejs behavior (click navigates, click-and-drag reorders)
- Theme links use existing `hiddenThemeLinks` mechanism for hiding
- Bookmarks popup mirrors hamburger menu pattern for collapsed system links
- Icon types support: Material Design icons, Klipper category icons, favicon URLs, emoji

### Known Issues / Considerations

- `components.d.ts` shows as modified (auto-generated, may need to be committed or gitignored)
- Screenshots in repo root for documentation/PR (cleanup before merge?)

---

## Session Log

### 2026-01-29
- Created this CLAUDE.md to maintain context across sessions
- Feature appears complete per implementation plan
- Next steps: final testing, cleanup, PR creation

### 2026-01-29 (continued) - Theme Link Position Bug

**Bug:** When switching themes, new theme link appeared second instead of first. Only correct after page refresh.

**Previous attempts:** Tried Vue.set() for reactivity, reordering operations in updateTheme action. Did not fix.

**Root cause found:** SortableJS in AppDraggable manages DOM order independently from Vue's data. When the backing array (`customLinksLocal`) changed externally (via theme switch → store update → watcher), SortableJS was never told to re-order the DOM elements. The data was correct but DOM was stale.

**Evidence from logs:**
- `getCustomNavLinks` returned correct order: `["Cocoa Press(pos:-1)", "Printables(pos:0)", ...]`
- Watcher received and set correct order to `customLinksLocal`
- But SortableJS DOM still showed old order from initial attach

**Fix:** Added `@Watch('items')` in `AppDraggable.vue` that calls `this.sortable.sort(newOrder)` when the backing array changes and the order differs from current DOM order.

**Key insight:** SortableJS + Vue data binding requires explicit DOM sync when data changes externally (not via drag). This is a common pitfall with SortableJS integration.

---

## Project Context

**Fluidd** is a Vue.js-based web interface for Klipper 3D printer firmware, communicating via Moonraker API.

### Tech Stack
- Vue 2 + Vuetify
- Vuex for state management
- TypeScript
- Vite build system

### Repo Structure
- `src/components/` - Vue components
- `src/store/` - Vuex store modules
- `src/locales/` - i18n translation files
- `docs/` - Documentation
- `public/` - Static assets
