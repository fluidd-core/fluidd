import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import JobsTable from '../JobsTable.vue'
import { SocketActions } from '@/api/socketActions'
import { setProMode } from '@/services/pro-mode'
import { EventBus } from '@/eventBus'
import Vue from 'vue'

const folder = { type: 'directory', name: 'parts', dirname: 'parts', modified: 1, size: 0 }
const file = (filename: string, path = '', printed = false) => ({
  type: 'file',
  filename,
  path,
  modified: 1,
  size: 2,
  history: printed ? { job_id: 'done' } : {}
})

function mountTable (view: 'pictures' | 'list' | 'table' = 'table', access: { control: boolean, target: string, role?: boolean, connected?: boolean } = { control: true, target: 'account-a|printer-a' }, confirm = vi.fn(async () => true)) {
  const ready = () => access.control && access.role !== false && access.connected !== false
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
      $confirm: confirm
    },
    computed: {
      commandTarget: () => access.target,
      controlReady: ready,
      commandControlAvailable: ready,
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
  afterEach(() => { setProMode(false); vi.restoreAllMocks() })

  it.each([false, true])('renders every view independently of legacy Pro=%s', pro => {
    setProMode(pro)
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

  it('gives the nested-folder Up row a complete accessible grid row', async () => {
    const wrapper = mountTable()
    ;(wrapper.vm as any).openFolder('parts')
    await wrapper.vm.$nextTick()
    const grid = wrapper.get('[role="grid"]')
    const up = wrapper.get('.jt__row--up')
    expect(grid.attributes('aria-rowcount')).toBe('4')
    expect(up.findAll('[role="gridcell"]').length).toBe(9)
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

  it('announces the keyboard cursor through a stable active row id', async () => {
    const wrapper = mountTable()
    const vm = wrapper.vm as any
    vm.cursor = 'root.gcode'
    await wrapper.vm.$nextTick()

    const grid = wrapper.get('[role="grid"]')
    const row = wrapper.get('[data-key="root.gcode"]')
    expect(row.attributes('id')).toBe('jobs-row-root.gcode')
    expect(row.attributes('aria-rowindex')).toBe('3')
    expect(grid.attributes('aria-activedescendant')).toBe(row.attributes('id'))
    expect(grid.attributes('aria-describedby')).toBe('jobs-table-hint')
  })

  it('uses focusable native checkboxes and supports keyboard selection', async () => {
    const wrapper = mountTable()
    const vm = wrapper.vm as any
    const boxes = wrapper.findAll('input[type="checkbox"]')
    expect(boxes.length).toBe(3)

    await boxes.at(1).trigger('click')
    expect(vm.selected).toEqual(['parts'])

    vm.cursor = 'root.gcode'
    await wrapper.vm.$nextTick()
    await wrapper.get('[role="grid"]').trigger('keydown', { key: ' ' })
    expect(vm.selected).toEqual(['parts', 'root.gcode'])

    await boxes.at(0).trigger('click')
    expect(vm.selected).toEqual([])
    expect(wrapper.get('#jobs-table-hint').text()).toContain('Space selects')
  })

  it('refuses bulk queueing for viewers and disconnected printers', async () => {
    const queue = vi.spyOn(SocketActions, 'serverJobQueuePostJob').mockImplementation(vi.fn() as any)
    const wrapper = mountTable('table', { control: false, target: 'a|p' })
    ;(wrapper.vm as any).selected = ['root.gcode']
    await (wrapper.vm as any).queueSelected()
    expect(queue).not.toHaveBeenCalled()
  })

  it.each(['role', 'connection', 'account', 'printer'])('rechecks %s after bulk-delete confirmation', async change => {
    let accept!: (value: boolean) => void
    const confirmation = new Promise<boolean>(resolve => { accept = resolve })
    const access = Vue.observable({ control: true, role: true, connected: true, target: 'account-a|printer-a' })
    const remove = vi.spyOn(SocketActions, 'serverFilesDeleteFile').mockImplementation(vi.fn() as any)
    const wrapper = mountTable('table', access, vi.fn(() => confirmation))
    const pending = (wrapper.vm as any).deleteRows([(wrapper.vm as any).fileRows[0]])
    if (change === 'role') access.role = false
    else if (change === 'connection') access.connected = false
    else access.target = change === 'account' ? 'account-b|printer-a' : 'account-a|printer-b'
    accept(true)
    await pending
    expect(remove).not.toHaveBeenCalled()
  })

  it.each(['rename', 'move'])('refuses stale %s dialog submissions after a target switch', async action => {
    const access = Vue.observable({ control: true, target: 'account-a|printer-a' })
    const move = vi.spyOn(SocketActions, 'serverFilesMove').mockImplementation(vi.fn() as any)
    const wrapper = mountTable('table', access)
    const vm = wrapper.vm as any
    vm.selected = ['root.gcode']
    action === 'rename' ? vm.openRename() : vm.openMove()
    access.target = 'account-a|printer-b'
    vm.onCommandTarget()
    action === 'rename' ? vm.rename('renamed.gcode') : vm.moveInto('parts')
    expect(move).not.toHaveBeenCalled()
    expect(vm.selected).toEqual([])
  })

  it.each(['printer', 'account', 'control'])('stops a sequential upload when the %s changes', async change => {
    const access = Vue.observable({ control: true, target: 'account-a|printer-a' })
    const wrapper = mountTable('table', access)
    const uploaded: string[] = []
    vi.spyOn(wrapper.vm as any, 'uploadFile').mockImplementation(async (...args: unknown[]) => {
      const picked = args[0] as File
      uploaded.push(picked.name)
      if (change === 'control') access.control = false
      else access.target = change === 'printer' ? 'account-a|printer-b' : 'account-b|printer-a'
    })
    const stopped = vi.spyOn(EventBus, '$emit')
    const files = ['one.gcode', 'two.gcode', 'three.gcode'].map(name => new File(['gcode'], name))
    ;(wrapper.vm as any).$store.state.files.uploads = files.map(file => ({ filepath: file.name, cancelled: false }))

    await (wrapper.vm as any).onPicked({ target: { files, value: 'chosen' } })

    expect(uploaded).toEqual(['one.gcode'])
    expect(stopped).toHaveBeenCalledWith('Stopped: the printer changed', { type: 'warning', timeout: 5000 })
  })

  it('uploads a normal multi-file selection sequentially and in order', async () => {
    const wrapper = mountTable()
    const uploaded: string[] = []
    vi.spyOn(wrapper.vm as any, 'uploadFile').mockImplementation(async (...args: unknown[]) => { uploaded.push((args[0] as File).name) })
    const files = ['one.gcode', 'two.gcode', 'three.gcode'].map(name => new File(['gcode'], name))
    ;(wrapper.vm as any).$store.state.files.uploads = files.map(file => ({ filepath: file.name, cancelled: false }))

    await (wrapper.vm as any).onPicked({ target: { files, value: 'chosen' } })

    expect(uploaded).toEqual(['one.gcode', 'two.gcode', 'three.gcode'])
  })

  it('does not offer a completed upload to print after its target changes', async () => {
    const access = Vue.observable({ control: true, target: 'account-a|printer-a' })
    const wrapper = mountTable('table', access)
    vi.spyOn(wrapper.vm as any, 'uploadFile').mockImplementation(async () => { access.target = 'account-a|printer-b' })
    const ready = vi.fn()
    EventBus.bus.$on('job-ready', ready)
    ;(wrapper.vm as any).$store.state.files.uploads = [{ filepath: 'one.gcode', cancelled: false }]

    await (wrapper.vm as any).onPicked({ target: { files: [new File(['gcode'], 'one.gcode')], value: 'chosen' } })

    expect(ready).not.toHaveBeenCalled()
    EventBus.bus.$off('job-ready', ready)
  })
})
