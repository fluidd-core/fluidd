import Vue from 'vue'
import { shallowMount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { compileToFunctions, parseComponent } from 'vue-template-compiler'
import appSource from '@/App.vue?raw'
import { isManagedConsolePath } from '@/router/managedPath'

// Exercise the real shell render and route classification without starting
// printer sockets or mounting the rest of the printer's controls.
const app = compileToFunctions(parseComponent(appSource).template!.content)
const Shell = Vue.extend({
  data: () => ({
    routerReady: true,
    blankedForLanguage: false,
    dragState: false,
    showTabBar: false,
    showRail: false,
    showBackgroundLogo: true,
    isMobileViewport: false,
    logoSrc: '/logo.svg',
    flashMessageState: null,
    customBackgroundImageStyle: {},
    columnCount: 1,
    deletionPending: false,
    showPageHeader: false,
    showUpdateBanner: false,
    deletionCloudView: false,
    otherPrinterRoute: false,
    foreignPrinterRoute: false,
    connection: { page: true, stale: false, banner: null, screen: null }
  }),
  computed: {
    managedConsoleRoute (): boolean { return isManagedConsolePath((this as any).$route.path) }
  },
  render: app.render as any,
  staticRenderFns: app.staticRenderFns as any
})

describe('sign-in shell', () => {
  it.each(['/sign-in', '/sign-in/'])('keeps the watermark out of the form on %s', path => {
    const box = { template: '<div><slot /></div>' }
    const wrapper = shallowMount(Shell, {
      mocks: { $route: { path, meta: {} }, $t: (key: string) => key },
      stubs: {
        'v-app': box,
        'v-main': box,
        'v-container': box,
        'inline-svg': { template: '<svg />' },
        'app-bar': { template: '<header />' },
        'router-view': { template: '<form><input type="email" aria-label="Email"></form>' }
      }
    })
    expect(wrapper.find('.muon-background-logo').exists()).toBe(false)
    expect(wrapper.find('header').exists()).toBe(false)
    wrapper.destroy()
  })
})
