import { shallowMount } from '@vue/test-utils'
import { afterEach, expect, it, vi } from 'vitest'
import PrinterOpening from '@/components/muon-cloud/PrinterOpening.vue'

const source = vi.hoisted(() => ({
  cloudState: { ready: true, account: { id: 'account' }, printers: [{ id: 'boxwood', name: 'Boxwood', online: false, last_seen: 0 }], status: {} },
  activationState: { switching: 'boxwood' as string | null, error: null as string | null, fallbackUrl: null }
}))
vi.mock('../state', () => ({ cloudState: source.cloudState }))
vi.mock('../activate', () => ({ activationState: source.activationState }))
vi.mock('@/services/printer-pages', () => ({ resolveSlug: () => ({ kind: 'cloud', printerId: 'boxwood' }), printerPagesState: { missing: null }, openPrinterAt: vi.fn() }))

afterEach(() => { vi.useRealTimers() })

it('says Reconnecting while a recently seen cloud printer is opening, and Offline after the grace period', () => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-13T12:00:00Z'))
  source.cloudState.printers[0].last_seen = Date.now() / 1000 - 60
  const options = { propsData: { slug: 'boxwood' }, stubs: ['v-icon', 'v-btn', 'v-progress-circular'] }
  const opening = shallowMount(PrinterOpening, options)
  expect(opening.find('h2').text()).toBe('Reconnecting…')
  opening.destroy()
  vi.setSystemTime(new Date('2026-10-13T12:01:00Z'))
  source.activationState.switching = null
  source.activationState.error = 'Printer is offline'
  const offline = shallowMount(PrinterOpening, options)
  expect(offline.find('h2').text()).toBe('Offline')
  offline.destroy()
})
