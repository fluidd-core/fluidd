/// <reference lib="WebWorker" />

import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { warmStrategyCache } from 'workbox-recipes'
import { NAVIGATION_DENYLIST, networkFirstNavigation } from './swNavigation'

declare let self: ServiceWorkerGlobalScope

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

precacheAndRoute(self.__WB_MANIFEST)

cleanupOutdatedCaches()

const configPathname = new URL('config.json', self.location.href).pathname

const configStrategy = new StaleWhileRevalidate({
  cacheName: 'config',
  fetchOptions: {
    cache: 'no-cache'
  }
})

warmStrategyCache({
  urls: [
    configPathname
  ],
  strategy: configStrategy
})

registerRoute(configPathname, configStrategy, 'GET')

// Static assets the precache no longer covers (KAN-525): a lazy chunk, a
// Monaco worker, an icon stays a week past its first fetch instead of
// downloading with every install. Never Moonraker or the API: those are the
// printer's answers, not files to reuse.
const MOONRAKER_PATHS = /^\/(?:server|printer|machine|access|websocket|api)(?:\/|$)/
const ASSET_DESTINATIONS = new Set(['script', 'style', 'font', 'image', 'worker'])

registerRoute(
  ({ url, request }) => (
    url.origin === self.location.origin &&
    url.pathname !== configPathname &&
    !MOONRAKER_PATHS.test(url.pathname) &&
    (ASSET_DESTINATIONS.has(request.destination) ||
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/monacoeditorwork/'))
  ),
  new StaleWhileRevalidate({
    cacheName: 'muon-assets',
    plugins: [
      new ExpirationPlugin({ maxEntries: 300, purgeOnQuotaError: true })
    ]
  }),
  'GET'
)

const denylist = import.meta.env.DEV
  ? undefined
  : NAVIGATION_DENYLIST

const allowlist = import.meta.env.DEV
  ? [/^\/$/]
  : undefined

// The network first, the cached index.html when offline (swNavigation.ts says
// why the denylist alone is not enough).
registerRoute(
  new NavigationRoute(networkFirstNavigation((request) => fetch(request), createHandlerBoundToURL('index.html')), {
    allowlist,
    denylist
  })
)
