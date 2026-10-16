import { shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Jobs from '../Jobs.vue'
import { SocketActions } from '@/api/socketActions'
import { controlPreferenceStore } from '@/services/account/control-preferences'

function mountJobs (mobile = false, control = true) {
  return shallowMount(Jobs, {
    mocks: {
      $store: { state: { config: { apiUrl: '', uiSettings: { general: {} } }, socket: {}, printer: { printer: {} } }, getters: { 'files/getRootProperties': () => ({}), 'files/getDirectory': () => [], 'history/getHistory': [], 'server/componentSupport': () => true }, dispatch: vi.fn() },
      $vuetify: { breakpoint: { mobile } },
      $confirm: vi.fn(async () => true)
    },
    computed: {
      queue: () => [{ job_id: '1', filename: 'one.gcode' }],
      busy: () => false,
      history: () => [],
      printerName: () => 'M1',
      isMobileViewport: () => mobile,
      commandControlAvailable: () => control,
      controlReady: () => control,
      klippyReady: () => control,
      klippyConnected: () => control,
      socketConnected: () => control,
      apiConnected: () => control,
      authenticated: () => control
    },
    stubs: ['router-link', 'frame-icon', 'jobs-table', 'job-viewer', 'job-detail', 'seg-picker', 'tone-pill', 'job-card']
  })
}

describe('Jobs one layout', () => {
  beforeEach(() => { vi.spyOn(SocketActions, 'serverFilesGetDirectory').mockImplementation(vi.fn() as any) })
  afterEach(() => { localStorage.setItem('muon3d.pro', '0'); controlPreferenceStore.state.folds = {}; vi.restoreAllMocks() })

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
    const wrapper = mountJobs(false, false)
    await (wrapper.vm as any).unqueue({ job_id: '1' })
    await (wrapper.vm as any).clearQueue()
    await (wrapper.vm as any).startQueue()
    await (wrapper.vm as any).moveQueued({ job_id: '1' }, 1)
    expect(remove).not.toHaveBeenCalled()
    expect(start).not.toHaveBeenCalled()
    expect(reorder).not.toHaveBeenCalled()
    expect(wrapper.find('[data-tid="jobs-queue-start"]').attributes('disabled')).toBe('disabled')
  })

  it('refuses print-or-queue for viewers and disconnected printers', async () => {
    const wrapper = mountJobs(false, false)
    const print = vi.spyOn(wrapper.vm as any, 'printAgain')
    await (wrapper.vm as any).printOrQueue({ path: 'part.gcode' })
    expect(print).not.toHaveBeenCalled()
    const viewer = wrapper.findComponent({ name: 'JobDetail' })
    expect(viewer.attributes('can-print')).toBeUndefined()
  })
})
