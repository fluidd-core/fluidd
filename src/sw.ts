/// <reference lib="WebWorker" />

import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate } from 'workbox-strategies'
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
