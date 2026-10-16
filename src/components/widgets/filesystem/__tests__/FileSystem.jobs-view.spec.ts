import { createLocalVue, shallowMount } from '@vue/test-utils'
import VueRouter from 'vue-router'
import { describe, expect, it, vi } from 'vitest'
import FileSystem from '../FileSystem.vue'

describe('FileSystem Jobs preview', () => {
  it.each([['table', false], ['list', true], ['pictures', true]] as const)('uses the %s Jobs view to decide navigation', async (view, navigates) => {
    const push = vi.fn()
    const localVue = createLocalVue()
    localVue.use(VueRouter)
    const router = new VueRouter({ mode: 'abstract', routes: [{ path: '/jobs', name: 'Jobs' }, { path: '/preview' }] })
    await router.push('/jobs')
    vi.spyOn(router, 'push').mockImplementation(push as any)
    const wrapper = shallowMount(FileSystem, {
      localVue,
      router,
      propsData: { roots: 'gcodes', name: 'Files', jobsView: view },
      mocks: {
        $store: { state: { config: { uiSettings: { fileSystem: { activeFilters: {} } } }, files: { pathFiles: {} } }, getters: { 'files/getRootProperties': () => ({}), 'files/isRootAvailable': () => true, 'files/getCurrentPathByRoot': () => 'gcodes', 'files/getDirectory': () => [], 'layout/isEnabledInCurrentLayout': () => false }, dispatch: vi.fn() },
        $waits: { onFileSystem: '' }, $t: (x: string) => x
      },
      methods: { getGcode: vi.fn(async () => ({ data: 'G1 X1' })), refreshPath: vi.fn() },
      computed: { availableRoots: () => ['gcodes'], headers: () => [], currentUploads: () => [], filesLoading: () => false },
      stubs: ['v-card', 'file-system-toolbar', 'file-system-bulk-actions', 'file-system-browser', 'file-system-context-menu', 'file-editor-dialog', 'file-name-dialog', 'app-drag-overlay', 'file-system-upload-dialog', 'file-preview-dialog', 'file-system-go-to-file-dialog']
    })
    await (wrapper.vm as any).handlePreviewGcode({ filename: 'a.gcode' })
    expect(push.mock.calls.length > 0).toBe(navigates)
  })
})
