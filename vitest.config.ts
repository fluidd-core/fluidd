import path from 'path'
import vue from '@vitejs/plugin-vue2'
import content from '@originjs/vite-plugin-content'
import Components from 'unplugin-vue-components/vite'
import { VuetifyResolver } from 'unplugin-vue-components/resolvers'
import { defineConfig } from 'vitest/config'

// vite-plugin-pwa supplies virtual:pwa-register, and unit tests don't load it.
// RegisterServiceWorker.vue imports it, so a spec that imports App.vue needs a stand-in.
const pwaRegisterStub = {
  name: 'pwa-register-stub',
  resolveId: (id: string) => id === 'virtual:pwa-register' ? '\0virtual:pwa-register' : undefined,
  load: (id: string) => id === '\0virtual:pwa-register' ? 'export function registerSW () { return () => Promise.resolve() }' : undefined
}

// Keep unit tests independent of Vite's development server and production build plugins.
export default defineConfig({
  plugins: [pwaRegisterStub, vue(), content(), Components({
    dts: false,
    dirs: ['src/components/common', 'src/components/layout', 'src/components/ui'],
    resolvers: [VuetifyResolver()]
  })],
  css: {
    preprocessorOptions: {
      scss: { additionalData: '@import "@/scss/variables";\n' },
      sass: { additionalData: '@import "@/scss/variables.scss"\n' }
    }
  },
  envPrefix: ['VUE_', 'VITE_'],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/unit/setup.ts'],
    alias: [{ find: /^vue$/, replacement: 'vue/dist/vue.runtime.common.js' }],
    pool: 'forks',
    maxWorkers: 1,
    minWorkers: 1,
    testTimeout: 60000
  }
})
