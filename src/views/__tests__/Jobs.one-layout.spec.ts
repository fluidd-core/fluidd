import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import Jobs from '../Jobs.vue'
import { setProMode } from '@/services/pro-mode'
import { SocketActions } from '@/api/socketActions'

function mountJobs (mobile = false, control = true) {
  return shallowMount(Jobs, {
    mocks: {
      $store: { state: { config: { apiUrl: '', uiSettings: { general: {} } }, socket: {}, printer: { printer: {} } }, getters: { 'files/getRootProperties': () => ({}), 'files/getDirectory': () => [], 'history/getHistory': [], 'server/componentSupport': () => true }, dispatch: vi.fn() },
      $route: { name: 'Jobs', params: {} }, $router: { currentRoute: { name: 'Jobs' } }, $vuetify: { breakpoint: { mobile } }, $confirm: vi.fn(async () => true)
    },
    computed: {
      queue: () => [{ job_id: '1', filename: 'one.gcode' }], busy: () => false, history: () => [],
      printerName: () => 'M1',
      isMobileViewport: () => mobile, commandControlAvailable: () => control, controlReady: () => control,
      klippyReady: () => control, klippyConnected: () => control, socketConnected: () => control, apiConnected: () => control, authenticated: () => control
    },
    stubs: ['router-link', 'frame-icon', 'jobs-table', 'job-viewer', 'job-detail', 'seg-picker', 'tone-pill', 'job-card']
  })
}

describe('Jobs one layout', () => {
  it.each([false, true])('offers Pictures, List and Table with legacy Pro=%s', pro => {
    setProMode(pro)
    const wrapper = mountJobs()
    expect((wrapper.vm as any).viewOptions.map((v: any) => v.label)).toEqual(['Pictures', 'List', 'Table'])
    expect(wrapper.find('[data-tid="jobs-up-next"]').exists()).toBe(true)
    wrapper.destroy()
  })

  it('keeps the selected desktop table view while showing list on a phone', async () => {
    const wrapper = mountJobs(true)
    ;(wrapper.vm as any).setView('table')
    expect((wrapper.vm as any).effectiveView).toBe('list')
    expect((wrapper.vm as any).view).toBe('table')
  })

  it('refuses queue mutations after control or the connection is lost', async () => {
    const remove = vi.spyOn(SocketActions, 'serverJobQueueDeleteJobs').mockImplementation(vi.fn() as any)
    const wrapper = mountJobs(false, false)
    await (wrapper.vm as any).unqueue({ job_id: '1' })
    await (wrapper.vm as any).clearQueue()
    expect(remove).not.toHaveBeenCalled()
  })
})
