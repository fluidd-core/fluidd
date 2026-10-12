import type { M1Viewer } from './viewer'

/**
 * The live M1 between views. Building the model and its shaders takes a
 * second or more (several on a browser that has never drawn it), so it is
 * built once and kept: built ahead while the overview is still connecting
 * to its printer, and parked with its canvas when a view lets it go, for
 * the next view to take up at once. One is kept; its GPU memory is the one
 * WebGL context's.
 */

export interface Held {
  viewer: M1Viewer;
  canvas: HTMLCanvasElement;
}

/** Whether this browser can draw WebGL at all, asked once. */
let webgl: boolean | null = null
export function canDrawWebgl (): boolean {
  if (webgl === null) {
    try {
      const c = document.createElement('canvas')
      webgl = !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {
      webgl = false
    }
  }
  return webgl
}

let viewerModule: Promise<typeof import('./viewer')> | null = null
export const loadViewer = () => (viewerModule ??= import('./viewer'))

let parked: Held | null = null
let building: Promise<void> | null = null

/** The canvas the live M1 draws on; made in code, so a view's scoped styles reach it by this class. */
export function newCanvas (): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.className = 'm1-live__canvas'
  return canvas
}

/** Builds the live M1 ahead and parks it, unless one is parked or building. */
export function prebuild (): Promise<void> {
  if (parked || !canDrawWebgl() || typeof IntersectionObserver === 'undefined') return Promise.resolve()
  building ??= loadViewer()
    .then(({ createViewer }) => {
      const canvas = newCanvas()
      const viewer = createViewer(canvas)
      viewer.setActive(false)
      park({ viewer, canvas })
    })
    .catch(e => console.warn('[m1] the live M1 could not be built ahead; it is tried again when shown', e))
    .finally(() => {
      building = null
    })
  return building
}

/** Waits for a build under way, if there is one. */
export const built = (): Promise<void> => building ?? Promise.resolve()

/** Keeps a live M1 a view let go, for the next. */
export function park (held: Held) {
  held.viewer.setActive(false)
  held.viewer.onFrame = null
  held.canvas.remove()
  if (parked && parked !== held) parked.viewer.dispose()
  parked = held
}

/** The parked M1, unless the browser has taken its WebGL context back meanwhile. */
export function takeParked (): Held | null {
  const held = parked
  parked = null
  if (!held) return null
  const gl = held.canvas.getContext('webgl2') ?? held.canvas.getContext('webgl')
  if (!gl || gl.isContextLost()) {
    held.viewer.dispose()
    return null
  }
  return held
}
