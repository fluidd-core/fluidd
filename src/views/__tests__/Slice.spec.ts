import Vue from 'vue'
import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Slice, { CROSS_ORIGIN_SANDBOX } from '../Slice.vue'
import { resetSlicerProbe } from '@/services/slicer-bridge/slicerUrl'
import { foreignRegistry, foreignSlug } from '@/services/foreign-printers/registry'
import type { ConfirmRequest } from '@/services/slicer-bridge/vendor/printer-client/bridge/host'

const EMBED_HTML = '<!doctype html><html><head><meta name="muon3d-embed-hosts" content="\'self\'" /><title>Muon3D Slicer</title></head></html>'
const FLUIDD_HTML = '<!doctype html><html><head><title>Fluidd</title></head><body><div id="app"></div></body></html>'

/** Lets the probe's answer, and the frame it lets in, settle. */
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

/** What this origin answers for /slicer/embed.html. */
function serve (status: number, body: string) {
  const fetch = vi.fn<[string, RequestInit?], Promise<Response>>(async () => new Response(body, { status, headers: { 'Content-Type': 'text/html' } }))
  vi.stubGlobal('fetch', fetch)
  return fetch
}

async function mountSlice (confirm: (message: string) => Promise<boolean> = async () => true, options: Record<string, unknown> = {}) {
  const store = {
    state: { config: { apiUrl: '' }, socket: { acceptingNotifications: false }, printer: { printer: {} } },
    getters: { 'socket/getConnectionState': false },
    subscribeAction: () => () => {}
  }
  const wrapper = shallowMount(Slice, {
    mocks: {
      $store: store,
      $httpClient: { get: vi.fn(), post: vi.fn() },
      $vuetify: { theme: { dark: true }, breakpoint: { mobile: false } },
      $t: (key: string) => key,
      $tc: (key: string) => key,
      $confirm: confirm
    },
    stubs: { 'print-confirm-dialog': true, 'v-alert': true },
    ...options,
    // Fluidd's theme and density, set here rather than through the mocked $vuetify, which the host reads after the probe.
    computed: { theme: () => 'dark', density: () => 'compact', ...(options.computed as object | undefined) }
  })
  await flushPromises()
  await wrapper.vm.$nextTick()
  return wrapper
}

const request = (signal = new AbortController().signal): ConfirmRequest => ({
  printer: { key: 'a'.repeat(64), name: 'Walnut', model: 'Muon3D M1', route: 'local', role: 'operator', online: true },
  paths: ['a.gcode'],
  mode: 'start',
  plateClear: 'not-needed',
  signal
})

describe('Slice', () => {
  it('does not frame or connect the M1 slicer from a foreign printer page', async () => {
    const record = { id: 'foreign-slice', kind: 'octoprint' as const, name: 'Octo', host: '192.168.1.9', via: 'direct' as const, formFactor: 'bed-slinger' as const, credentialsRef: null, addedAt: 0 }
    foreignRegistry.records.push(record)
    const fetch = serve(200, EMBED_HTML)
    try {
      const localVue = createLocalVue()
      localVue.use(VueRouter)
      const router = new VueRouter({ mode: 'abstract', routes: [{ path: '/:printer', component: Slice }] })
      await router.push(`/${foreignSlug(record)}`)
      const wrapper = await mountSlice(undefined, { localVue, router })
      expect(wrapper.find('iframe').exists()).toBe(false)
      expect((wrapper.vm as any).host).toBeNull()
      expect(fetch).not.toHaveBeenCalled()
      wrapper.destroy()
    } finally { foreignRegistry.records.splice(0) }
  })

  beforeEach(() => {
    resetSlicerProbe()
    serve(200, EMBED_HTML)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('frames the slicer\'s embed.html once it answers and its host listens, with no sandbox on this origin', async () => {
    const fetch = serve(200, EMBED_HTML)
    const wrapper = await mountSlice()
    const embed = new URL('/slicer/embed.html', window.location.href).href
    expect(fetch).toHaveBeenCalledWith(embed, expect.objectContaining({ cache: 'no-store' }))
    const frame = wrapper.find('iframe').element as HTMLIFrameElement
    expect(frame.src).toBe(embed)
    expect(frame.getAttribute('title')).toBe('Muon3D Slicer')
    expect(frame.hasAttribute('sandbox')).toBe(false)
    expect((wrapper.vm as any).host).not.toBeNull()
    wrapper.destroy()
  })

  it("keeps the slicer's change of what's loaded on the printer: the material while idle, the colour any time", async () => {
    const printer = Vue.observable({ printing: false })
    const choices = [{ name: 'PLA', nozzle: 215, bed: 60, colour: '#E8A53B', presetId: null }, { name: 'PETG', nozzle: 240, bed: 80, colour: '#5B7FD6', presetId: null }]
    const wrapper = await mountSlice(undefined, {
      computed: {
        materialChoices: () => choices,
        loadedMaterial: () => choices[0],
        loadedColour: () => null,
        printerPrinting: () => printer.printing,
        printerPaused: () => false
      }
    })
    const vm = wrapper.vm as any
    vm.setLoadedMaterial = vi.fn()
    vm.setLoadedColour = vi.fn()

    vm.takeMaterial({ material: 'petg', colour: '#1A2B3C' })
    expect(vm.setLoadedMaterial).toHaveBeenCalledWith(choices[1])
    expect(vm.setLoadedColour).toHaveBeenCalledWith('#1A2B3C')

    printer.printing = true
    vm.setLoadedMaterial.mockClear()
    vm.takeMaterial({ material: 'PETG', colour: null })
    expect(vm.setLoadedMaterial).not.toHaveBeenCalled()
    wrapper.destroy()
  })

  it('keeps the frame hidden behind "Opening the slicer" until the slicer has said hello and drawn', async () => {
    const wrapper = await mountSlice()
    const vm = wrapper.vm as any
    expect(wrapper.find('iframe').classes()).toContain('slice-view__frame--waiting')
    expect(wrapper.find('[data-tid=slice-opening]').exists()).toBe(true)

    // The welcome settled (its last try): the frame shows two frames later.
    vm.watchFeatures(0)
    expect(vm.ready).toBe(false)
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
    await wrapper.vm.$nextTick()
    expect(vm.ready).toBe(true)
    expect(wrapper.find('iframe').classes()).not.toContain('slice-view__frame--waiting')
    expect(wrapper.find('[data-tid=slice-opening]').exists()).toBe(false)
    wrapper.destroy()
  })

  it('shows an older slicer that never says hello a moment after its page loads', async () => {
    const wrapper = await mountSlice()
    const vm = wrapper.vm as any
    vi.useFakeTimers()
    try {
      vm.onFrameLoad()
      vi.advanceTimersByTime(2900)
      expect(vm.ready).toBe(false)
      vi.advanceTimersByTime(200)
      expect(vm.ready).toBe(true)
    } finally {
      vi.useRealTimers()
      wrapper.destroy()
    }
  })

  it.each([
    ['a 404 (an image without the slicer)', 404, 'Not Found'],
    ['Fluidd\'s own index.html (the SPA fallback)', 200, FLUIDD_HTML]
  ])('frames nothing and says so when the slicer does not answer: %s', async (_case, status, body) => {
    serve(status, body)
    const wrapper = await mountSlice()
    expect(wrapper.find('iframe').exists()).toBe(false)
    expect(wrapper.find('v-alert-stub').exists()).toBe(true)
    expect((wrapper.vm as any).host).toBeNull()
    wrapper.destroy()
  })

  it('sandboxes a slicer on another origin, never letting it navigate this page', async () => {
    const fetch = serve(404, '')
    const wrapper = await mountSlice(undefined, { computed: { url: () => new URL('https://slicer.example/embed.html') } })
    expect(fetch).not.toHaveBeenCalled()
    const frame = wrapper.find('iframe').element as HTMLIFrameElement
    expect(frame.getAttribute('sandbox')).toBe(CROSS_ORIGIN_SANDBOX)
    expect(CROSS_ORIGIN_SANDBOX.split(' ')).toEqual(expect.arrayContaining(['allow-scripts', 'allow-same-origin']))
    expect(CROSS_ORIGIN_SANDBOX).not.toMatch(/allow-top-navigation/)
    expect(frame.src).toBe('https://slicer.example/embed.html')
    wrapper.destroy()
  })

  it('asks a network printer its identity through Fluidd\'s own client, every status read there', async () => {
    const wrapper = await mountSlice()
    const vm = wrapper.vm as any
    const get = vm.$httpClient.get as ReturnType<typeof vi.fn>
    get.mockResolvedValueOnce({ status: 200, data: { result: { name: 'walnut' } } })
    get.mockResolvedValueOnce({ status: 401, data: {} })
    const ask = vm.identityFetcher()
    await expect(ask('http://192.0.2.10')).resolves.toEqual({ result: { name: 'walnut' } })
    await expect(ask('http://192.0.2.10')).rejects.toThrow('401')
    expect(get).toHaveBeenCalledWith('/server/muon/identity', expect.objectContaining({ baseURL: 'http://192.0.2.10', responseType: 'json' }))
    expect(get.mock.calls[0][1].validateStatus(401)).toBe(true)
    wrapper.destroy()
  })

  it('shows one dialog at a time and answers it with the person\'s choice', async () => {
    const wrapper = await mountSlice()
    const vm = wrapper.vm as any
    const first = vm.confirm(request())
    expect(vm.dialogRequest).toEqual({ printer: 'Walnut', paths: ['a.gcode'], mode: 'start', plateClear: 'not-needed' })
    await expect(vm.confirm(request())).rejects.toMatchObject({ kind: 'busy' })
    vm.handleAnswer({ choice: 'print', plateClear: false })
    await expect(first).resolves.toEqual({ choice: 'print', plateClear: false })
    expect(vm.dialogRequest).toBeNull()
    wrapper.destroy()
  })

  it('closes the dialog when its request ends first (a switch, the frame\'s cancel): nothing starts', async () => {
    const wrapper = await mountSlice()
    const vm = wrapper.vm as any
    const abort = new AbortController()
    const pending = vm.confirm(request(abort.signal))
    abort.abort()
    await expect(pending).rejects.toThrow('The request ended')
    expect(vm.dialogRequest).toBeNull()
    vm.handleAnswer({ choice: 'print', plateClear: false })
    wrapper.destroy()
  })

  it('asks before leaving only while the slicer has changes it has not saved', async () => {
    const confirm = vi.fn(async () => false)
    const wrapper = await mountSlice(confirm)
    const vm = wrapper.vm as any
    const next = vi.fn()
    await vm.beforeRouteLeave({}, {}, next)
    expect(next).toHaveBeenLastCalledWith()
    vm.dirty = true
    await vm.beforeRouteLeave({}, {}, next)
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(next).toHaveBeenLastCalledWith(false)
    wrapper.destroy()
  })
})
