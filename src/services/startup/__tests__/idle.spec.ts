import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LOADER_ID } from '../loader'

const stubFrames = () => {
  // Fake timers own setTimeout; run rAF through it.
  window.requestAnimationFrame = (cb: FrameRequestCallback) => {
    setTimeout(() => cb(performance.now()), 0)
    return 0
  }
  delete (window as { requestIdleCallback?: unknown }).requestIdleCallback
}

describe('afterFirstPaint (KAN-525)', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    stubFrames()
    document.body.innerHTML = ''
    window.history.replaceState(null, '', '/')
  })

  it('does not run before the loader is gone, and runs after', async () => {
    document.body.innerHTML = `<div id="${LOADER_ID}"></div>`
    const { removeLoader } = await import('../loader')
    const { afterFirstPaint } = await import('../idle')
    const fn = vi.fn()

    afterFirstPaint(fn)
    await vi.advanceTimersByTimeAsync(1000)
    expect(fn).not.toHaveBeenCalled()

    const gone = removeLoader()
    await vi.advanceTimersByTimeAsync(1000)
    await gone
    await vi.advanceTimersByTimeAsync(1000)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('runs without a loader in the page, after the idle delay', async () => {
    const { afterFirstPaint } = await import('../idle')
    const fn = vi.fn()

    afterFirstPaint(fn)
    await vi.advanceTimersByTimeAsync(1000)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  afterEach(() => {
    vi.useRealTimers()
  })
})
