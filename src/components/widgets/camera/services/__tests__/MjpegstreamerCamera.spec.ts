/**
 * @vitest-environment jsdom
 */

/// <reference lib="webworker" />

import { mount } from '@vue/test-utils'
import type { Wrapper } from '@vue/test-utils'
import type Vue from 'vue'
import type { MjpegWorkerResponseMessage } from '@/workers/mjpegStream.worker'

const { workers, WorkerConstructor } = vi.hoisted(() => {
  class MockWorker {
    onmessage: ((event: MessageEvent<MjpegWorkerResponseMessage>) => void) | null = null
    onerror: ((event: ErrorEvent) => void) | null = null
    onmessageerror: (() => void) | null = null
    postMessage = vi.fn()
    terminate = vi.fn()
  }

  const workers: MockWorker[] = []
  const WorkerConstructor = vi.fn(class extends MockWorker {
    constructor () {
      super()
      workers.push(this)
    }
  })

  return { workers, WorkerConstructor }
})

vi.mock('@/workers/mjpegStream.worker?ts?worker', () => ({ default: WorkerConstructor }))
vi.mock('consola', () => ({ consola: { warn: vi.fn(), error: vi.fn() } }))

const { default: MjpegstreamerCamera } = await vi.importActual<{ default: typeof Vue }>(
  '../MjpegstreamerCamera.vue'
)

describe('MjpegstreamerCamera', () => {
  const camera: Moonraker.Webcam.Entry = {
    uid: 'camera',
    source: 'config',
    name: 'Camera',
    service: 'mjpegstreamer',
    stream_url: '/webcam/?action=stream',
    rotation: 0
  }

  let wrapper: Wrapper<Vue> | undefined
  let hidden = false

  beforeEach(() => {
    vi.useFakeTimers()
    workers.length = 0
    WorkerConstructor.mockClear()
    hidden = false
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden)
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))

    const BrowserURL = URL
    vi.stubGlobal('URL', class extends BrowserURL {
      static createObjectURL = vi.fn(() => 'blob:camera-frame')
      static revokeObjectURL = vi.fn()
    })
  })

  afterEach(() => {
    wrapper?.destroy()
    wrapper = undefined
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  function mountCamera () {
    wrapper = mount(MjpegstreamerCamera, { propsData: { camera } })
    return wrapper
  }

  function latestStatus () {
    return wrapper?.emitted('update:status')?.slice(-1)[0]?.[0]
  }

  function sendMessage (message: MjpegWorkerResponseMessage, worker = workers[0]) {
    worker.onmessage?.(new MessageEvent('message', { data: message }))
  }

  function expectNativeStream () {
    const source = wrapper?.find('img').attributes('src')
    expect(source).toBeTruthy()
    const url = new URL(source || '')
    expect(url.pathname).toBe('/webcam/')
    expect(url.searchParams.get('action')).toBe('stream')
    expect(url.searchParams.has('cacheBust')).toBe(true)
  }

  it('keeps worker playback when frames arrive', async () => {
    const camera = mountCamera()

    expect(WorkerConstructor).toHaveBeenCalledTimes(1)
    expect(workers[0].postMessage).toHaveBeenCalledWith({
      action: 'start',
      url: expect.stringContaining('/webcam/?action=stream&cacheBust=')
    })

    sendMessage({ action: 'frame', data: new Uint8Array([255, 216, 255, 217]) })
    await camera.find('img').trigger('load')
    vi.advanceTimersByTime(10000)

    expect(camera.find('img').attributes('src')).toBe('blob:camera-frame')
    expect(latestStatus()).toBe('connected')
    expect(workers[0].terminate).not.toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:camera-frame')
  })

  it('falls back after the worker cannot fetch the stream', async () => {
    const camera = mountCamera()

    sendMessage({ action: 'error', error: new TypeError('Load failed') })

    expect(workers[0].terminate).toHaveBeenCalledTimes(1)
    expectNativeStream()
    expect(latestStatus()).toBe('connecting')
    expect(camera.emitted('update:frames-per-second')?.slice(-1)[0]).toEqual([-1])
    expect(camera.emitted('update:raw-camera-url')?.slice(-1)[0]?.[0])
      .toBe(camera.find('img').attributes('src'))

    await camera.find('img').trigger('load')
    expect(latestStatus()).toBe('connected')
  })

  it('falls back when constructing a worker fails', () => {
    WorkerConstructor.mockImplementationOnce(() => { throw new Error('Worker unavailable') })
    mountCamera()

    expectNativeStream()
    expect(latestStatus()).toBe('connecting')
  })

  it('falls back on an uncaught worker error', () => {
    mountCamera()
    const error = new ErrorEvent('error', { message: 'Worker script failed', cancelable: true })
    workers[0].onerror?.(error)

    expectNativeStream()
    expect(error.defaultPrevented).toBe(true)
    expect(workers[0].terminate).toHaveBeenCalledTimes(1)
  })

  it('falls back when worker messages cannot be received', () => {
    mountCamera()
    workers[0].onmessageerror?.()

    expectNativeStream()
    expect(workers[0].terminate).toHaveBeenCalledTimes(1)
  })

  it('falls back if the worker delivers no frames within ten seconds', () => {
    mountCamera()
    vi.advanceTimersByTime(9999)
    expect(workers[0].terminate).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expectNativeStream()
    expect(workers[0].terminate).toHaveBeenCalledTimes(1)
  })

  it('revokes worker frame URLs and clears the FPS when falling back', () => {
    const camera = mountCamera()
    vi.advanceTimersByTime(100)
    sendMessage({ action: 'frame', data: new Uint8Array([255, 216, 255, 217]) })
    sendMessage({ action: 'error', error: new TypeError('Load failed') })

    expectNativeStream()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:camera-frame')
    expect(camera.emitted('update:frames-per-second')?.slice(-1)[0]).toEqual([-1])
  })

  it('falls back when the worker stream ends without a frame', () => {
    mountCamera()
    sendMessage({ action: 'done' })

    expectNativeStream()
    expect(workers[0].terminate).toHaveBeenCalledTimes(1)
  })

  it('stops normally when a worker stream ends after delivering a frame', () => {
    const camera = mountCamera()
    sendMessage({ action: 'frame', data: new Uint8Array([255, 216, 255, 217]) })
    sendMessage({ action: 'done' })

    expect(camera.find('img').attributes('src')).toBeUndefined()
    expect(latestStatus()).toBe('disconnected')
    expect(workers[0].terminate).toHaveBeenCalledTimes(1)
  })

  it('does not retry worker playback when native playback fails', async () => {
    const camera = mountCamera()
    sendMessage({ action: 'error' })
    await camera.find('img').trigger('error')
    vi.advanceTimersByTime(20000)

    expect(latestStatus()).toBe('error')
    expect(WorkerConstructor).toHaveBeenCalledTimes(1)
    expect(workers[0].terminate).toHaveBeenCalledTimes(1)
  })

  it('ignores messages from a worker after falling back', () => {
    mountCamera()
    const onmessage = workers[0].onmessage
    sendMessage({ action: 'error' })
    onmessage?.(new MessageEvent('message', {
      data: { action: 'frame', data: new Uint8Array([255, 216, 255, 217]) }
    }))

    expectNativeStream()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })

  it('cancels the pending fallback when the page is hidden', () => {
    const camera = mountCamera()
    hidden = true
    document.dispatchEvent(new Event('visibilitychange'))
    vi.advanceTimersByTime(20000)

    expect(camera.find('img').attributes('src')).toBeUndefined()
    expect(latestStatus()).toBe('disconnected')
    expect(workers[0].terminate).toHaveBeenCalledTimes(1)
  })

  it('resumes native playback when the page becomes visible', () => {
    mountCamera()
    sendMessage({ action: 'error' })
    hidden = true
    document.dispatchEvent(new Event('visibilitychange'))
    hidden = false
    document.dispatchEvent(new Event('visibilitychange'))

    expectNativeStream()
    expect(WorkerConstructor).toHaveBeenCalledTimes(1)
  })

  it('ignores an old worker after playback restarts', () => {
    mountCamera()
    const onmessage = workers[0].onmessage
    hidden = true
    document.dispatchEvent(new Event('visibilitychange'))
    hidden = false
    document.dispatchEvent(new Event('visibilitychange'))
    onmessage?.(new MessageEvent('message', { data: { action: 'error' } }))

    expect(WorkerConstructor).toHaveBeenCalledTimes(2)
    expect(workers[1].terminate).not.toHaveBeenCalled()
    expect(latestStatus()).toBe('connecting')
    expect(wrapper?.find('img').attributes('src')).toBeUndefined()
  })

  it('uses the updated camera URL after falling back', async () => {
    const camera = mountCamera()
    sendMessage({ action: 'error' })
    await camera.setProps({ camera: { ...camera.props('camera'), stream_url: '/other/stream' } })

    expect(camera.find('img').attributes('src')).toContain('/other/stream?cacheBust=')
    expect(WorkerConstructor).toHaveBeenCalledTimes(1)
  })

  it('stops the worker and cancels the pending fallback on unmount', () => {
    const camera = mountCamera()
    const worker = workers[0]
    camera.destroy()
    wrapper = undefined
    vi.advanceTimersByTime(20000)

    expect(worker.terminate).toHaveBeenCalledTimes(1)
    expect(worker.onmessage).toBeNull()
    expect(worker.onerror).toBeNull()
    expect(worker.onmessageerror).toBeNull()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })
})
