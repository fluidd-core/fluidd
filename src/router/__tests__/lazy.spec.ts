import { describe, expect, it } from 'vitest'
import type { RouteConfig } from 'vue-router'
import router from '../index'

const isLazy = (component: RouteConfig['component']) => {
  if (typeof component !== 'function') return false
  try {
    // A lazy loader answers a promise; a component constructor throws called so.
    const r = (component as () => unknown)()
    return !!r && typeof (r as Promise<unknown>).then === 'function'
  } catch {
    return false
  }
}

describe('lazy routes (KAN-525)', () => {
  const check = (routes: RouteConfig[]) => {
    for (const route of routes) {
      if (route.component) {
        if (route.name === 'Updating') {
          // In the main chunk: a restarting printer can't serve a chunk.
          expect(isLazy(route.component), `${route.name} must be static`).toBe(false)
        } else {
          expect(isLazy(route.component), `${route.name ?? route.path} must be lazy`).toBe(true)
        }
      }
      if (route.children) check(route.children)
    }
  }

  it('every route component is a lazy import but Updating', () => {
    check(router.options.routes)
  })
})
