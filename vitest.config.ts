import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true,
    // jsdom only where a spec asks for it via docblock; one env per worker
    environment: 'node',
    pool: 'vmThreads',
    setupFiles: [
      './tests/unit/setup.ts'
    ],
    alias: [
      { find: /^vue$/, replacement: 'vue/dist/vue.runtime.common.js' }
    ]
  }
}))
