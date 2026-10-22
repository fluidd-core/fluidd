import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/services/muon-cloud/state', async () => {
  const { default: Vue } = await import('vue')
  return { cloudState: Vue.observable({ account: null, activePrinterId: null, printers: [] }), cloudPrinterConnection: vi.fn() }
})
vi.mock('@/services/printer-pages', () => ({ activeSlug: () => null }))
vi.mock('@/services/library/print-on', () => ({ activePrinterFacts: vi.fn(), downloadGcode: vi.fn(), downloadProject: vi.fn(), gcodeFileName: vi.fn(), saveToComputer: vi.fn() }))
vi.mock('@/components/library/PrintOnDialog.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/widgets/filesystem/FileNameDialog.vue', () => ({ default: { render: () => null } }))
vi.mock('@/components/muon-cloud/CloudAccountDialog.vue', () => ({ default: { render: () => null } }))
vi.mock('@/services/library/store', async (original) => ({
  ...await original() as object,
  watchLibraryAccount: vi.fn(),
  refreshLibrary: vi.fn(async () => {})
}))

// eslint-disable-next-line import/first
import { libraryState, resetLibrary, setLibraryClient } from '@/services/library/store'
// eslint-disable-next-line import/first
import type { LibraryRun } from '@/services/library/api'
// eslint-disable-next-line import/first
import Library from '../Library.vue'

// A run as the model service lists it (src/library/runs.rs `Run`): item and version are null for an unattached run.
const run = (over: Partial<LibraryRun>): LibraryRun => ({
  id: 'run',
  item_id: 'item',
  version: 2,
  printer_id: 'p1',
  printer_name: 'Pine',
  file_name: 'cube.gcode',
  started_at: '2026-10-20T11:00:00Z',
  ended_at: null,
  outcome: 'finished',
  progress_pct: null,
  duration_s: null,
  in_library: true,
  item: null,
  ...over
})

function render () {
  return shallowMount(Library, {
    mocks: { $store: { state: { config: { apiUrl: '', instances: [] } }, getters: {} }, $vuetify: { breakpoint: { mobile: false } } },
    stubs: ['router-link', 'frame-icon', 'library-card', 'library-recent-card', 'print-on-dialog', 'file-name-dialog', 'cloud-account-dialog']
  })
}

beforeEach(() => {
  resetLibrary('fixture')
  Object.assign(libraryState, { checked: true, enabled: true })
})

describe('Library Printed tab', () => {
  it('offers Print again only for a run whose print is still in the Library and whose version is known', () => {
    const vm = render().vm as any
    expect(vm.canPrintAgain(run({}))).toBe(true)
    expect(vm.canPrintAgain(run({ in_library: false }))).toBe(false)
    expect(vm.canPrintAgain(run({ item_id: null, version: null, in_library: false }))).toBe(false)
    expect(vm.canPrintAgain(run({ version: null }))).toBe(false)
    expect(vm.printAgain(run({}))).toEqual({ path: '/print', query: { library: 'item', version: '2' } })
  })

  it('keeps the newest section: a slow answer for a tab already left is dropped', async () => {
    let finishRuns: (value: unknown) => void = () => {}
    const client = {
      runs: () => new Promise(resolve => { finishRuns = resolve }),
      sliced: async () => ({ items: [{ id: 'live', state: 'ready', deleted_at: null }, { id: 'gone', state: 'deleted', deleted_at: '2026-10-20T00:00:00Z' }], rev: 1, reset: false, more: false })
    }
    setLibraryClient(client as never)
    const vm = render().vm as any
    vm.section = 'printed'; const slow = vm.loadSection()
    vm.section = 'sliced'; await vm.loadSection()
    finishRuns({ runs: [run({ id: 'late' })], cursor: null })
    await slow
    expect(vm.runs).toEqual([])
    expect(vm.sectionItems.map((item: { id: string }) => item.id)).toEqual(['live'])
    expect(vm.sectionBusy).toBe(false)
  })
})
