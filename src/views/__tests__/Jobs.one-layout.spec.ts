import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Jobs from '../Jobs.vue'
import { SocketActions } from '@/api/socketActions'
import { controlPreferenceStore } from '@/services/account/control-preferences'
import Vue from 'vue'

function mountJobs (mobile = false, access: { control: boolean, target: string, role?: boolean, connected?: boolean } = { control: true, target: 'account-a|printer-a' }, confirm = vi.fn(async () => true)) {
  const ready = () => access.control && access.role !== false && access.connected !== false
  return shallowMount(Jobs, {
    mocks: {
      $store: { state: { config: { apiUrl: '', uiSettings: { general: {} } }, socket: {}, printer: { printer: {} } }, getters: { 'files/getRootProperties': () => ({}), 'files/getDirectory': () => [], 'history/getHistory': [], 'server/componentSupport': () => true }, dispatch: vi.fn() },
      $vuetify: { breakpoint: { mobile } },
      $confirm: confirm
    },
    computed: {
      queue: () => [{ job_id: '1', filename: 'one.gcode' }],
      busy: () => false,
      history: () => [],
      printerName: () => 'M1',
      isMobileViewport: () => mobile,
      commandTarget: () => access.target,
      commandControlAvailable: ready,
      controlReady: ready,
      klippyReady: ready,
      klippyConnected: ready,
      socketConnected: ready,
      apiConnected: ready,
      authenticated: ready
    },
    stubs: ['router-link', 'frame-icon', 'jobs-table', 'job-viewer', 'job-detail', 'seg-picker', 'tone-pill', 'job-card']
  })
}

describe('Jobs one layout', () => {
  beforeEach(() => { vi.spyOn(SocketActions, 'serverFilesGetDirectory').mockImplementation(vi.fn() as any) })
  afterEach(() => { controlPreferenceStore.state.folds = {}; vi.restoreAllMocks() })

  it.each([false, true])('offers Pictures, List and Table with legacy Pro=%s', pro => {
    localStorage.setItem('muon3d.pro', pro ? '1' : '0')
    const wrapper = mountJobs()
    expect((wrapper.vm as any).viewOptions.map((v: any) => v.label)).toEqual(['Pictures', 'List', 'Table'])
    expect(wrapper.find('[data-tid="jobs-up-next"]').exists()).toBe(true)
    wrapper.destroy()
  })

  it('keeps the selected desktop table view while showing list on a phone', async () => {
    const wrapper = mountJobs(true)
    const save = vi.spyOn(controlPreferenceStore, 'setFold')
    ;(wrapper.vm as any).setView('table')
    expect((wrapper.vm as any).effectiveView).toBe('list')
    expect((wrapper.vm as any).view).toBe('table')
    expect(save).not.toHaveBeenCalled()
  })

  it('restores the view from remembered fold choices', async () => {
    const wrapper = mountJobs()
    controlPreferenceStore.state.folds = { 'jobs.view.list': false, 'jobs.view.table': true }
    await wrapper.vm.$nextTick()
    expect((wrapper.vm as any).view).toBe('table')
  })

  it('steps through the files currently shown in every view', () => {
    const wrapper = mountJobs()
    const files = [{ key: 'folder/one.gcode' }, { key: 'folder/two.gcode' }]
    ;(wrapper.vm as any).view = 'pictures'
    ;(wrapper.vm as any).tableFiles = files
    ;(wrapper.vm as any).detail = files[0]
    ;(wrapper.vm as any).step(1)
    expect((wrapper.vm as any).detail).toBe(files[1])
  })

  it('refuses queue mutations after control or the connection is lost', async () => {
    const remove = vi.spyOn(SocketActions, 'serverJobQueueDeleteJobs').mockImplementation(vi.fn() as any)
    const start = vi.spyOn(SocketActions, 'serverJobQueueStart').mockImplementation(vi.fn() as any)
    const reorder = vi.spyOn(SocketActions, 'serverJobQueuePostJob').mockImplementation(vi.fn() as any)
    const wrapper = mountJobs(false, { control: false, target: 'a|p' })
    await (wrapper.vm as any).unqueue({ job_id: '1' })
    await (wrapper.vm as any).clearQueue()
    await (wrapper.vm as any).startQueue()
    await (wrapper.vm as any).moveQueued({ job_id: '1' }, 1)
    expect(remove).not.toHaveBeenCalled()
    expect(start).not.toHaveBeenCalled()
    expect(reorder).not.toHaveBeenCalled()
    expect(wrapper.find('[data-tid="jobs-queue-start"]').attributes('disabled')).toBe('disabled')
  })

  it.each(['role', 'connection', 'account', 'printer'])('rechecks %s before a confirmed single delete is sent', async change => {
    let accept!: (value: boolean) => void
    const confirmation = new Promise<boolean>(resolve => { accept = resolve })
    const access = Vue.observable({ control: true, role: true, connected: true, target: 'account-a|printer-a' })
    const remove = vi.spyOn(SocketActions, 'serverFilesDeleteFile').mockImplementation(vi.fn() as any)
    const wrapper = mountJobs(false, access, vi.fn(() => confirmation))
    const pending = (wrapper.vm as any).removeJob({ title: 'Part', path: 'part.gcode' })
    if (change === 'role') access.role = false
    else if (change === 'connection') access.connected = false
    else access.target = change === 'account' ? 'account-b|printer-a' : 'account-a|printer-b'
    accept(true)
    await pending
    expect(remove).not.toHaveBeenCalled()
  })

  it.each(['print', 'queue'])('clears stale detail state and refuses its %s command after a target switch', async action => {
    const access = Vue.observable({ control: true, target: 'account-a|printer-a' })
    const queue = vi.spyOn(SocketActions, 'serverJobQueuePostJob').mockImplementation(vi.fn() as any)
    const wrapper = mountJobs(false, access)
    const print = vi.spyOn(wrapper.vm as any, 'printAgain')
    const job = { key: 'part.gcode', path: 'part.gcode' }
    ;(wrapper.vm as any).open(job)
    access.target = 'account-a|printer-b'
    ;(wrapper.vm as any).onCommandTarget()
    if (action === 'print') await (wrapper.vm as any).printDetail(job)
    else await (wrapper.vm as any).queueDetail(job)
    expect(queue).not.toHaveBeenCalled()
    expect(print).not.toHaveBeenCalled()
    expect((wrapper.vm as any).detail).toBeNull()
  })

  it('clears only the queue IDs shown by the confirmation', async () => {
    let accept!: (value: boolean) => void
    const confirmation = new Promise<boolean>(resolve => { accept = resolve })
    const remove = vi.spyOn(SocketActions, 'serverJobQueueDeleteJobs').mockImplementation(vi.fn() as any)
    const wrapper = mountJobs(false, { control: true, target: 'a|p' }, vi.fn(() => confirmation))
    const pending = (wrapper.vm as any).clearQueue()
    ;(wrapper.vm as any).queue.push({ job_id: '2', filename: 'two.gcode' })
    accept(true)
    await pending
    expect(remove).toHaveBeenCalledWith(['1'])
  })

  it('refuses print-or-queue for viewers and disconnected printers', async () => {
    const wrapper = mountJobs(false, { control: false, target: 'a|p' })
    const print = vi.spyOn(wrapper.vm as any, 'printAgain')
    await (wrapper.vm as any).printOrQueue({ path: 'part.gcode' })
    expect(print).not.toHaveBeenCalled()
    const viewer = wrapper.findComponent({ name: 'JobDetail' })
    expect(viewer.attributes('can-print')).toBeUndefined()
  })
})
