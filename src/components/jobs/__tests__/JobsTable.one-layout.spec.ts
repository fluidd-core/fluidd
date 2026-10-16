import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import JobsTable from '../JobsTable.vue'
import { SocketActions } from '@/api/socketActions'

const folder = { type: 'directory', name: 'parts', dirname: 'parts', modified: 1, size: 0 }
const file = (filename: string, path = '', printed = false) => ({
  type: 'file',
  filename,
  path,
  modified: 1,
  size: 2,
  history: printed ? { job_id: 'done' } : {}
})

function mountTable (view: 'pictures' | 'list' | 'table' = 'table', control = true) {
  const directories: Record<string, any[]> = {
    gcodes: [folder, file('root.gcode')],
    'gcodes/parts': [file('old.gcode', 'parts', true), file('new.gcode', 'parts')]
  }
  return shallowMount(JobsTable, {
    propsData: { view },
    mocks: {
      $store: {
        state: { files: { pathFiles: {} }, config: { apiUrl: '', uiSettings: { general: {} } }, socket: {}, printer: { printer: {} } },
        getters: {
          'files/getDirectory': (path: string) => directories[path],
          'files/getCurrentPathByRoot': () => '',
          'files/getUsage': {},
          'files/getRootProperties': () => ({}),
          'server/componentSupport': () => true
        },
        dispatch: vi.fn()
      },
      $confirm: vi.fn(async () => true)
    },
    computed: {
      controlReady: () => control,
      commandControlAvailable: () => control,
      busy: () => false,
      printerName: () => 'M1'
    },
    stubs: ['frame-icon', 'file-name-dialog', 'v-dialog', 'seg-picker']
  })
}

describe('JobsTable one layout', () => {
  beforeEach(() => {
    vi.spyOn(SocketActions, 'serverFilesGetDirectory').mockImplementation(vi.fn() as any)
    if (!globalThis.CSS) (globalThis as any).CSS = {}
    if (!globalThis.CSS.escape) globalThis.CSS.escape = (value: string) => value
    Element.prototype.scrollIntoView = vi.fn()
  })
  afterEach(() => { localStorage.setItem('muon3d.pro', '0'); vi.restoreAllMocks() })

  it.each([false, true])('renders every view independently of legacy Pro=%s', pro => {
    localStorage.setItem('muon3d.pro', pro ? '1' : '0')
    for (const view of ['pictures', 'list', 'table'] as const) {
      const wrapper = mountTable(view)
      expect(wrapper.classes()).toContain(`jt--${view}`)
      wrapper.destroy()
    }
  })

  it('opens folders, goes up, and builds breadcrumbs', () => {
    const wrapper = mountTable()
    const vm = wrapper.vm as any
    vm.openFolder('parts')
    expect(vm.path).toBe('parts')
    expect(vm.crumbs).toEqual([{ name: 'parts', path: 'parts' }])
    vm.openFolder(vm.parent)
    expect(vm.path).toBe('')
  })

  it.each(['pictures', 'list'] as const)('opens a file with one click in %s', view => {
    const wrapper = mountTable(view)
    const row = (wrapper.vm as any).fileRows[0]
    ;(wrapper.vm as any).onRowClick(row, { shiftKey: false, ctrlKey: false, metaKey: false })
    expect(wrapper.emitted('open')?.[0]?.[0]).toEqual(row.job)
  })

  it('filters printed files in every view', async () => {
    const wrapper = mountTable('pictures')
    const vm = wrapper.vm as any
    vm.openFolder('parts')
    vm.filter = 'never'
    await wrapper.vm.$nextTick()
    expect(vm.files.map((job: any) => job.filename)).toEqual(['new.gcode'])
  })

  it('refuses bulk queueing for viewers and disconnected printers', async () => {
    const queue = vi.spyOn(SocketActions, 'serverJobQueuePostJob').mockImplementation(vi.fn() as any)
    const wrapper = mountTable('table', false)
    ;(wrapper.vm as any).selected = ['root.gcode']
    await (wrapper.vm as any).queueSelected()
    expect(queue).not.toHaveBeenCalled()
  })
})
