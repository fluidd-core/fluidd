import Vue from 'vue'
import VueRouter, { type RouteConfig, type Route } from 'vue-router'
import { applyLegacyHash } from './legacyHash'
import { activeSlugNow } from './printerSlugSource'
import { PRINTER_PAGE_PATHS } from './printerPagePaths'
import { ROUTE_SLUG_PATTERN } from '@/services/printer-pages/slug'

// Views
import Dashboard from '@/views/Dashboard.vue'
import Console from '@/views/Console.vue'
import GcodePreview from '@/views/GcodePreview.vue'
import Jobs from '@/views/Jobs.vue'
import Tune from '@/views/Tune.vue'
import Diagnostics from '@/views/Diagnostics.vue'
import History from '@/views/History.vue'
import Timelapse from '@/views/Timelapse.vue'
import Configure from '@/views/Configure.vue'
import System from '@/views/System.vue'
import Settings from '@/views/Settings.vue'
import AppSettingsNav from '@/components/layout/AppSettingsNav.vue'
import MacroCategorySettings from '@/components/settings/macros/MacroCategorySettings.vue'
import FullscreenCamera from '@/views/FullscreenCamera.vue'
import NotFound from '@/views/NotFound.vue'
import Login from '@/views/Login.vue'
import Icons from '@/views/Icons.vue'
import Wifi from '@/views/Wifi.vue'
import Fleet from '@/views/Fleet.vue'
import LinkLanding from '@/views/LinkLanding.vue'
import JoinLanding from '@/views/JoinLanding.vue'
import Welcome from '@/views/Welcome.vue'

Vue.use(VueRouter)

const isAuthenticated = () => (
  router.app.$store.getters['auth/getAuthenticated'] ||
  !router.app.$store.state.socket.apiConnected
)

/** The current printer's page, or Printers with no printer. */
const printerHome = () => {
  const slug = activeSlugNow()
  return slug ? `/${slug}` : '/'
}

const defaultRouteConfig: Partial<RouteConfig> = {
  beforeEnter: (to, from, next) => {
    // A page for another printer opens that printer (services/printer-pages):
    // whether it wants a password is that printer's to say, not this one's.
    if (to.params.printer && to.params.printer !== activeSlugNow()) {
      next()
    } else if (isAuthenticated()) {
      next()
    } else {
      next('/login')
    }
  },
  meta: {
    fileDropRoot: 'gcodes'
  }
}

/** One printer's pages: /boxwood-367a, /boxwood-367a/jobs (U1). */
const P = `/:printer(${ROUTE_SLUG_PATTERN})`

const printerRoutes: Array<RouteConfig> = [
  {
    path: P,
    name: 'Dashboard',
    component: Dashboard,
    ...defaultRouteConfig
  },
  {
    path: `${P}/console`,
    name: 'Console',
    component: Console,
    ...defaultRouteConfig
  },
  {
    path: `${P}/jobs`,
    name: 'Jobs',
    component: Jobs,
    ...defaultRouteConfig
  },
  {
    path: `${P}/tune`,
    name: 'Tune',
    component: Tune,
    ...defaultRouteConfig
  },
  {
    path: `${P}/diagnostics`,
    name: 'Diagnostics',
    component: Diagnostics,
    ...defaultRouteConfig
  },
  {
    path: `${P}/timelapse`,
    name: 'Timelapse',
    component: Timelapse,
    ...defaultRouteConfig,
    meta: {
      fileDropRoot: 'timelapse'
    }
  },
  {
    path: `${P}/history`,
    name: 'History',
    component: History,
    ...defaultRouteConfig
  },
  {
    path: `${P}/wifi`,
    name: 'Wifi',
    component: Wifi,
    ...defaultRouteConfig
  },
  {
    path: `${P}/system`,
    name: 'System',
    component: System,
    ...defaultRouteConfig
  },
  {
    // The Muon3D Slicer in a frame (views/Slice.vue). Lazy, so the slicer's
    // host loads only here. Its frame, with the person's plates, stays while
    // Fluidd switches printer (init.ts keeps this route then). No
    // fileDropRoot: a model dropped here is the slicer's, not an upload.
    path: `${P}/slice`,
    name: 'Slice',
    component: () => import('@/views/Slice.vue'),
    beforeEnter: defaultRouteConfig.beforeEnter,
    meta: {
      printerIndependent: true,
      keepOnPrinterSwitch: true
    }
  },
  {
    path: `${P}/configure`,
    name: 'Configuration',
    component: Configure,
    ...defaultRouteConfig,
    meta: {}
  },
  {
    path: `${P}/settings`,
    name: 'Settings',
    ...defaultRouteConfig,
    meta: {
      hasSubNavigation: true
    },
    components: {
      default: Settings,
      navigation: AppSettingsNav
    },
    children: [
      {
        path: 'macros/:categoryId',
        name: 'Macros',
        meta: {
          hasSubNavigation: true
        },
        components: {
          default: MacroCategorySettings,
          navigation: AppSettingsNav
        }
      }
    ]
  },
  {
    path: `${P}/camera/:cameraId`,
    name: 'Camera',
    component: FullscreenCamera,
    ...defaultRouteConfig
  },
  {
    path: `${P}/preview`,
    name: 'Gcode Preview',
    component: GcodePreview,
    ...defaultRouteConfig
  }
]

/**
 * An address from before a page per printer (/jobs, /settings#auth, a PWA
 * shortcut): the same page of the printer Fluidd is on, or Printers when it
 * is on none.
 */
const toPrinterPage = (to: Route) => {
  const slug = activeSlugNow()
  return slug ? { path: `/${slug}${to.path}`, query: to.query, hash: to.hash } : '/'
}

// /slice has a page of its own with no printer (the slicer exports without one).
const LEGACY_PRINTER_PAGES = [
  ...PRINTER_PAGE_PATHS.filter(path => !['/slice', '/camera'].includes(path)),
  '/settings/macros/:categoryId',
  '/camera/:cameraId'
]

const routes: Array<RouteConfig> = [
  {
    // Every printer: those found on this network, the account's, and a
    // welcome with none. A printer's own address opens that printer instead
    // (U2): see main.ts.
    path: '/',
    name: 'Printers',
    component: Welcome,
    meta: {
      printerIndependent: true
    }
  },
  {
    path: '/fleet',
    name: 'Fleet',
    component: Fleet,
    meta: {
      printerIndependent: true
    }
  },
  {
    path: '/welcome',
    redirect: '/'
  },
  {
    path: '/link',
    name: 'Link a printer',
    component: LinkLanding,
    meta: {
      printerIndependent: true
    }
  },
  {
    // An invite link (AB-CON-1): the console sends /j/<code> here.
    path: '/join',
    name: 'Join a printer',
    component: JoinLanding,
    meta: {
      printerIndependent: true
    }
  },
  {
    // The console's sign-in page (WEB-12): /authorize sends a browser with no
    // session here with `continue`. Lazy, and mounted without appInit.
    path: '/sign-in',
    name: 'Sign in',
    component: () => import('@/views/SignIn.vue'),
    meta: {
      printerIndependent: true
    }
  },
  {
    // First-run setup, served by the printer and opened by a phone's
    // captive-portal window. Lazy, so it paints before the rest of Fluidd
    // loads, and printer-independent, so it renders before any socket.
    path: '/setup',
    name: 'setup',
    component: () => import('@/views/Setup.vue'),
    meta: {
      printerIndependent: true
    }
  },
  {
    // The slicer works with no printer too (export only).
    path: '/slice',
    name: 'Slice (no printer)',
    component: () => import('@/views/Slice.vue'),
    beforeEnter: (to, from, next) => {
      const slug = activeSlugNow()
      if (slug) next({ path: `/${slug}/slice`, query: to.query, hash: to.hash })
      else next()
    },
    meta: {
      printerIndependent: true,
      keepOnPrinterSwitch: true
    }
  },
  {
    // The printer's own user login (Moonraker), for the printer Fluidd is on.
    path: '/login',
    name: 'Login',
    component: Login,
    beforeEnter: (to, from, next) => {
      if (isAuthenticated()) {
        next(printerHome())
      } else {
        next()
      }
    },
    meta: {
      fillHeight: true
    }
  },
  {
    path: '/icons',
    name: 'Icons',
    component: Icons
  },
  ...LEGACY_PRINTER_PAGES.map(path => ({ path, redirect: toPrinterPage })),
  ...printerRoutes,
  {
    path: '*',
    name: '404',
    component: NotFound
  }
]

// Before the router reads the address: an old hash address (/#/jobs, the
// printer's /setup redirect to /#/setup) becomes the path it now is.
applyLegacyHash()

// Path addresses (/jobs, /link?code=), served from the root of the host. The
// printer's nginx and the console answer a navigation they have no file for
// with index.html, and the service worker does too once installed.
const router = new VueRouter({
  mode: 'history',
  base: '/',
  routes,
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) return savedPosition
    if (to.hash) {
      return {
        selector: to.hash,
        offset: { x: 0, y: 60 },
        behavior: 'smooth'
      }
    }
    return { x: 0, y: 0 }
  }
})

router.beforeEach((to, from, next) => {
  router.app?.$store.commit('config/setContainerColumnCount', 2)
  next()
})

declare module 'vue-router' {
  interface RouteMeta {
    fillHeight?: boolean
    hasSubNavigation?: boolean
    fileDropRoot?: string
    printerIndependent?: boolean
    /** A printer switch (appInit) leaves this route where it is instead of going to the dashboard. */
    keepOnPrinterSwitch?: boolean
  }
}

export default router
