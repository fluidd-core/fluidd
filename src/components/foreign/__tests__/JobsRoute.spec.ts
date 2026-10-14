import { afterEach, describe, expect, it, vi } from 'vitest'
import { createLocalVue, mount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import { foreignRegistry, foreignSlug } from '@/services/foreign-printers/registry'

vi.mock('@/services/foreign-printers/live', () => ({
  connectAll: async () => {},
  adapterFor: (id: string) => ({ listFiles: async () => [{ path: `${id}.gcode`, name: `${id}.gcode` }] })
}))

const { default: JobsRoute } = await import('../JobsRoute.vue')
const { default: ForeignPrinterJobs } = await import('../ForeignPrinterJobs.vue')

const records = ['first', 'second'].map(id => ({
  id,
  name: id,
  kind: 'octoprint' as const,
  host: id === 'first' ? '192.168.1.20' : '192.168.1.21',
  via: 'direct' as const,
  formFactor: 'bed-slinger' as const,
  credentialsRef: null,
  addedAt: 0
}))

afterEach(() => { foreignRegistry.records.splice(0) })

describe('foreign Jobs navigation', () => {
  it('replaces the file list when the route switches to another foreign printer', async () => {
    foreignRegistry.records.push(...records)
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    const router = new VueRouter({ mode: 'abstract', routes: [{ path: '/:printer/jobs', component: JobsRoute }] })
    await router.push(`/${foreignSlug(records[0])}/jobs`)
    const wrapper = mount(JobsRoute, { localVue, router, stubs: { ForeignJobs: ForeignPrinterJobs } })
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.text()).toContain('first.gcode')
    await router.push(`/${foreignSlug(records[1])}/jobs`)
    await new Promise(resolve => setTimeout(resolve, 0))
    expect(wrapper.text()).toContain('second.gcode')
    expect(wrapper.text()).not.toContain('first.gcode')
    wrapper.destroy()
  })
})
