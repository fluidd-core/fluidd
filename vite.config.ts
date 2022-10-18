import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import Components from 'unplugin-vue-components/vite'
import { VuetifyResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'
import content from '@originjs/vite-plugin-content'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'

export default defineConfig({
  plugins: [
    vue(),
    content(),
    monacoEditorPlugin({
      languageWorkers: ['editorWorkerService', 'json', 'css']
    }),
    Components({
      dts: true,
      dirs: [
        'src/components/common',
        'src/components/layout',
        'src/components/ui'
      ],
      resolvers: [
        VuetifyResolver()
      ]
    })
  ],

  css: {
    preprocessorOptions: {
      css: { charset: false },
      sass: {
        additionalData: '\n@import "@/scss/variables.scss"\n'
      },
      scss: {
        additionalData: '@import "@/scss/variables.scss";'
      }
    }
  },

  build: {
    target: 'safari12'
  },

  envPrefix: 'VUE_',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },

  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [
      './tests/unit/setup.ts'
    ],
    alias: [
      { find: /^vue$/, replacement: 'vue/dist/vue.runtime.common.js' }
    ]
  },

  server: {
    host: '0.0.0.0',
    port: 8080
  }
})
