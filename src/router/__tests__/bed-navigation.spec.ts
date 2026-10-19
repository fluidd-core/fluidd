import { expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import Vue from 'vue'
import { SECTIONS, visiblePages } from '../printerSections'
import FrameMixin from '@/mixins/frame'

vi.mock('@/services/printer-pages', () => ({ activeSlug: () => 'mock', isForeignSlug: () => false }))
vi.mock('@/api/socketActions', () => ({ SocketActions: {} }))

it('uses Bed capability for page links', () => {
  const section = SECTIONS.find(s => s.id === 'maintenance')!
  const context = { slicer: false, camera: null, history: false, timelapse: false, diagnostics: false, foreign: false, bedMesh: true }
  expect(visiblePages(section, context).map(p => p.label)).toEqual(['Health', 'Bed'])
  expect(visiblePages(section, { ...context, bedMesh: false }).map(p => p.path)).toEqual(['/maintenance'])
})

it('reads mesh capability from the live store for desktop and phone navigation', async () => {
  const getters = Vue.observable({ 'webcams/getVisibleWebcams': [], 'server/componentSupport': () => false, 'mesh/getSupportsBedMesh': true })
  const wrapper = mount(Vue.extend({ mixins: [FrameMixin], render: h => h('div') }), {
    mocks: { $store: { getters, state: { config: { uiSettings: { general: {} } } } }, $route: { params: { printer: 'mock' } } }
  })
  const vm = wrapper.vm as any
  expect(vm.pagesOf(SECTIONS.find(s => s.id === 'maintenance')).map((p: any) => p.path)).toEqual(['/maintenance', '/tune'])
  getters['mesh/getSupportsBedMesh'] = false; await Vue.nextTick()
  expect(vm.pagesOf(SECTIONS.find(s => s.id === 'maintenance')).map((p: any) => p.path)).toEqual(['/maintenance'])
  wrapper.destroy()
})
