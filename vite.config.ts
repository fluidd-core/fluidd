import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
// import { VitePWA, VitePWAOptions } from 'vite-plugin-pwa'
import Components from 'unplugin-vue-components/vite'
import { VuetifyResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'
import content from '@originjs/vite-plugin-content'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'

// const PWAConfig: Partial<VitePWAOptions> = {
//   registerType: 'autoUpdate',
//   strategies: 'injectManifest',
//   srcDir: 'src',
//   filename: 'registerServiceWorker.ts',
//   includeAssets: ['fonts/**/*.woff2', 'img/**/*.svg', 'img/**/*.png'],
//   manifest: {
//     name: 'Fluidd',
//     short_name: 'Fluidd',
//     theme_color: '#2196F3',
//     background_color: '#000000'
//     // icons: [
//     //   {
//     //     src: '/img/icons/icon-192-maskable.png',
//     //     sizes: '192x192',
//     //     type: 'image/png'
//     //   },
//     //   {
//     //     src: '/img/icons/icon-512-maskable.png',
//     //     sizes: '512x512',
//     //     type: 'image/png'
//     //   },
//     //   {
//     //     src: '/img/icons/icon-512-maskable.png',
//     //     sizes: '512x512',
//     //     type: 'image/png',
//     //     purpose: 'any maskable'
//     //   }
//     // ]
//   },
//   /* enable sw on development */
//   devOptions: {
//     enabled: true
//   }
// }

export default defineConfig({
  plugins: [
    // VitePWA(PWAConfig),
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
        additionalData: [
          '@import "@/scss/variables.scss"',
          ''
        ].join('\n')
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
