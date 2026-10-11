/// <reference types="vitest" />

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import { VitePWA } from 'vite-plugin-pwa'
import Components from 'unplugin-vue-components/vite'
import { VuetifyResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'
import content from '@originjs/vite-plugin-content'
import monacoEditorPluginModule from 'vite-plugin-monaco-editor'
import checker from 'vite-plugin-checker'
import version from './vite.config.inject-version'
import dns from 'dns/promises'

// Fix for incorrect typings on vite-plugin-monaco-editor
const isObjectWithDefaultFunction = (module: unknown): module is { default: typeof monacoEditorPluginModule } => (
  module != null &&
  typeof module === 'object' &&
  'default' in module &&
  typeof module.default === 'function'
)

const monacoEditorPlugin = isObjectWithDefaultFunction(monacoEditorPluginModule)
  ? monacoEditorPluginModule.default
  : monacoEditorPluginModule

const MDNS_NAME = 'muon-m1-serialnumberhere.local'

export default defineConfig(async ({ command }) => {
  // only resolve when `vite serve` (dev mode)
  let deviceIP = '192.168.55.112'
  if (command === 'serve') {
    try {
      const { address } = await dns.lookup(MDNS_NAME)
      deviceIP = address
      console.log(`[vite] resolved ${MDNS_NAME} → ${deviceIP}`)
    } catch (e) {
      console.warn(`[vite] DNS lookup failed for ${MDNS_NAME}, falling back to ${deviceIP}`)
    }
  }

  return {
  plugins: [
    VitePWA({
      srcDir: 'src',
      filename: 'sw.ts',
      strategies: 'injectManifest',
      includeAssets: [
        '**/*.svg',
        '**/*.png',
        '**/*.ico',
        'editor.theme.json'
      ],
      injectManifest: {
        globPatterns: [
          '**/*.{js,css,html,ttf,woff,woff2,wasm}'
        ],
        maximumFileSizeToCacheInBytes: 4 * 1024 ** 2
      },
      manifest: {
        name: 'Muon3D',
        short_name: 'Muon3D',
        description: 'The web interface for your Muon3D printer',
        theme_color: '#1A1F22',
        background_color: '#000000',
        icons: [
          {
            src: 'img/icons/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'img/icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'img/icons/android-chrome-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'img/icons/android-chrome-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Configuration',
            url: '/configure',
            icons: [
              {
                src: 'img/icons/shortcut-configuration-96x96.png',
                sizes: '96x96',
                type: 'image/png'
              }
            ]
          },
          {
            name: 'Settings',
            url: '/settings',
            icons: [
              {
                src: 'img/icons/shortcut-settings-96x96.png',
                sizes: '96x96',
                type: 'image/png'
              }
            ]
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html'
      }
    }),
    vue(),
    version(),
    content(),
    monacoEditorPlugin({
      languageWorkers: ['editorWorkerService', 'json', 'css']
    }),
    checker({
      vueTsc: {
        tsconfigPath: path.resolve(__dirname, './tsconfig.app.json')
      }
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
      scss: {
        additionalData: '@import "@/scss/variables";\n'
      },
      sass: {
        additionalData: '@import "@/scss/variables.scss"\n'
      }
    }
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

  // Absolute: Fluidd routes by path, so a page at /boxwood-367a/jobs must
  // still load /assets/…, not /boxwood-367a/assets/….
  base: '/',

  server: {
    host: '0.0.0.0',
    port: 8080,
    // proxy: {
    //     '/websocket': {
    //       target: `ws://${deviceIP}:7125`,
    //       ws: true,
    //       changeOrigin: true,
    //     },
    //     // SK‐daemon WS
    //     '/ws': {
    //       target: `ws://${deviceIP}:5000`,
    //       ws: true,
    //       changeOrigin: true,
    //     },
    //     // HTTP APIs
    //     '/server': {
    //       target: `http://${deviceIP}:7125`,
    //       changeOrigin: true,
    //     },
    //     '/printer': {
    //       target: `http://${deviceIP}:7125`,
    //       changeOrigin: true,
    //     },
    //   '/aux': {
    //     target: `http://${deviceIP}:6789`,
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/aux/, ''),
    //   },
    // }
  }
}})
