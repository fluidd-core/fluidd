/// <reference types="vitest" />

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue2'
import { VitePWA } from 'vite-plugin-pwa'
import Components from 'unplugin-vue-components/vite'
import { VuetifyResolver } from 'unplugin-vue-components/resolvers'
import path from 'path'
import content from '@originjs/vite-plugin-content'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import checker from 'vite-plugin-checker'
import version from './vite.config.inject-version'

export default defineConfig({
  plugins: [
    VitePWA({
      includeAssets: [
        '**/*.svg',
        '**/*.png',
        '**/*.ico',
        '*.json'
      ],
      workbox: {
        globPatterns: [
          '**/*.{js,css,html}',
          'assets/*.*'
        ],
        maximumFileSizeToCacheInBytes: 4 * 1024 ** 2,
        navigateFallbackDenylist: [
          /^\/websocket/,
          /^\/(printer|api|access|machine|server)\//,
          /^\/webcam[2-4]?\//
        ],
        runtimeCaching: [
          {
            urlPattern: (options) => (options.sameOrigin && options.url.pathname.startsWith('/config.json')),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'config',
              matchOptions: {
                ignoreSearch: true
              },
              precacheFallback: {
                fallbackURL: 'config.json'
              }
            }
          }
        ]
      },
      manifest: {
        name: 'fluidd',
        short_name: 'fluidd',
        description: 'The Klipper web interface for managing your 3d printer',
        theme_color: '#2196F3',
        background_color: '#000000',
        icons: [
          {
            src: '/img/icons/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/img/icons/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/img/icons/android-chrome-maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/img/icons/android-chrome-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
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
      sass: {
        additionalData: [
          '@import "@/scss/variables.scss"',
          ''
        ].join('\n')
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

  server: {
    host: '0.0.0.0',
    port: 8080
  }
})
