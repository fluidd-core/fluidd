/// <reference lib="WebWorker" />

import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute, PrecacheFallbackPlugin } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'
import escapeRegExp from '@/util/escape-regexp'

declare let self: ServiceWorkerGlobalScope

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

precacheAndRoute(self.__WB_MANIFEST)

cleanupOutdatedCaches()

const escapedBaseUrl = escapeRegExp(import.meta.env.BASE_URL)

const denylist = import.meta.env.DEV
  ? undefined
  : [
      'websocket',
      '(printer|api|access|machine|server)/',
      'webcam[2-4]?/'
    ].map(item => new RegExp(`^${escapedBaseUrl}${item}`))

const allowlist = import.meta.env.DEV
  ? [/^\/$/]
  : undefined

registerRoute(
  new NavigationRoute(createHandlerBoundToURL(`${import.meta.env.BASE_URL}index.html`), {
    allowlist,
    denylist
  })
)

registerRoute(
  ({ sameOrigin, url }) => sameOrigin && url.pathname === `${import.meta.env.BASE_URL}config.json`,
  new StaleWhileRevalidate({
    cacheName: 'config',
    matchOptions: {
      ignoreSearch: true
    },
    plugins: [
      new PrecacheFallbackPlugin({
        fallbackURL: `${import.meta.env.BASE_URL}config.json`
      })
    ]
  }),
  'GET'
)
