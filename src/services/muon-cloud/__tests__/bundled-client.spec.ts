import { afterEach, expect, it, vi } from 'vitest'

const binding = vi.hoisted(() => ({ init: vi.fn<[unknown], Promise<void>>().mockResolvedValue(undefined), create: vi.fn(async () => ({ endpointId: () => 'browser', secretKey: () => new Uint8Array(32), connect: vi.fn(async () => ({ printerId: () => 'boxwood' })), close: async () => {} })) }))
vi.mock('../vendor/muon-link-web/d71dbe1/muon_link_web.js', () => ({ default: binding.init, MuonEndpoint: { create: binding.create } }))

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); localStorage.clear() })

it('initializes the bundled client with Fluidd\'s own WASM URL and dials even when the old console path is 404', async () => {
  vi.resetModules()
  // No console client exists in this simulated deployment.
  const requests: string[] = []
  vi.stubGlobal('fetch', vi.fn(async (url: string) => { requests.push(String(url)); return new Response(null, { status: 404 }) }))
  const { browserEndpoint, dialPrinter } = await import('../iroh')
  const endpoint = await browserEndpoint('https://relay.example.test')
  const printer = await dialPrinter(endpoint, 'boxwood')
  expect(printer.printerId()).toBe('boxwood')
  expect((binding.init.mock.calls[0]?.[0] as any)?.module_or_path).toMatch(/\/muon_link_web_bg\.wasm(?:\?|$)/)
  expect(requests).toEqual([])
})
