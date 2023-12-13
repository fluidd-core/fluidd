/// <reference lib="WebWorker" />

import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute, PrecacheFallbackPlugin } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'

declare let self: ServiceWorkerGlobalScope

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

registerRoute(
  'config.json',
  new StaleWhileRevalidate({
    cacheName: 'config',
    fetchOptions: {
      cache: 'no-cache'
    },
    plugins: [
      new PrecacheFallbackPlugin({
        fallbackURL: 'config.json'
      })
    ]
  }),
  'GET'
)

precacheAndRoute(self.__WB_MANIFEST)

cleanupOutdatedCaches()

const denylist = import.meta.env.DEV
  ? undefined
  : [
      /\/websocket/,
      /\/(printer|api|access|machine|server)\//,
      /\/webcam[2-4]?\//
    ]

const allowlist = import.meta.env.DEV
  ? [/^\/$/]
  : undefined

registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    allowlist,
    denylist
  })
)
