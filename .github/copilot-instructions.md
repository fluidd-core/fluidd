# Fluidd AI Development Guide

Fluidd is a Vue 2.7 + TypeScript web interface for Klipper 3D printers that communicates with Moonraker via WebSocket.

## Architecture Overview

- **Vue 2.7 + Vuetify 2**: UI framework with Material Design components
- **Vuex Store**: Modular state management mirroring Klipper/Moonraker domains (`printer/`, `files/`, `console/`, etc.)
- **WebSocket Communication**: Real-time bidirectional communication with Moonraker API via `socketActions.ts`
- **Component Structure**: Mixins-based architecture with `StateMixin` providing common printer state access

## Key Patterns

### State Management
- Store modules in `src/store/` mirror Moonraker API endpoints (printer, files, macros, etc.)
- Use `$typedState` and `$typedGetters` for type-safe store access
- WebSocket actions in `api/socketActions.ts` follow pattern: `baseEmit(method, {dispatch, wait, params})`

### Component Architecture
```typescript
// Standard component pattern
@Component({
  components: { /* ... */ }
})
export default class MyComponent extends Vue {
  // Component logic here
}

// Widget component needing printer state
@Component({
  components: { /* ... */ }
})
export default class PrinterWidget extends Mixins(StateMixin) {
  // Access printer state via StateMixin getters
  get printerState() { return this.printerState } // 'printing' | 'paused' | etc.
}
```

### WebSocket Integration
- All printer communication through `SocketActions` (not direct HTTP)
- Use `wait` parameter for loading states: `wait: Waits.onPrintStart`
- Real-time updates handled via store mutations from socket events

## Development Workflow

### Essential Commands
```bash
npm run bootstrap    # Install git hooks (after clone)
npm run dev          # Start development server
npm run build        # Production build
npm run type-check   # TypeScript validation
npm run lint         # ESLint with Vue/TS rules
npm run test         # Vitest unit tests
```

### File Organization
- `src/components/widgets/`: Dashboard cards organized by domain (status/, thermals/, macros/)
- `src/views/`: Page-level components (Dashboard.vue, Console.vue, etc.)
- `src/store/[domain]/`: Vuex modules matching Moonraker API structure
- `src/api/`: WebSocket and HTTP client abstractions

### Router & Authentication
- Routes in `src/router/` with authentication guards

### Icons & Theming
- Material Design Icons via `src/globals.ts` constants
- Vuetify theme system with custom color schemes
- PWA support with service worker in `src/sw.ts`

## Integration Points

### Klipper/Moonraker Communication
- All printer commands via `SocketActions` methods
- Store updates from WebSocket events (not polling)
- File operations through Moonraker's file API (`src/store/files/`)

### Component Communication
- Parent-child: Props down, events up
- Cross-component: Vuex store or event bus
- Use `vue-property-decorator` for TypeScript components

## Testing Conventions
- Unit tests in `tests/unit/` with Vitest + jsdom
- Mock WebSocket connections for component testing
- Test store actions/mutations independently from UI

## Code Style
- Vue class-style components with `vue-property-decorator`
- ESLint enforced: neostandard + Vue 2 rules and further rules defined in 'eslint.config.mjs'
- camelCase for variables/methods, PascalCase for components
- Use `consola` for logging, not `console.log`
- Type imports: `import type { ... }` for types only

## Common Gotchas
- Vue 2.7 limitations: No Composition API in production builds
- WebSocket reconnection handled automatically by `socketClient.ts`
- File uploads use FormData with progress tracking in store
- Dynamic imports for code splitting (see `vue-echarts-chunk.ts`)
