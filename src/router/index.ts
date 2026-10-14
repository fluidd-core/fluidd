import Vue from 'vue'
import VueRouter, { type NavigationGuard, type RouteConfig, type Route } from 'vue-router'
import { applyLegacyHash } from './legacyHash'
import { readSignedOut } from '@/services/account/signed-out-note'
import { activeSlugNow, foreignSlugNow } from './printerSlugSource'
import { PRINTER_PAGE_PATHS } from './printerPagePaths'
import { ROUTE_SLUG_PATTERN } from '@/services/printer-pages/slug'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'
import Updating from '@/views/Updating.vue'

// Views. Every route is lazy (KAN-525) but Updating, which stays in the main
// chunk: while the printer restarts into an update it can't serve a chunk.
// The lazy ones that open printers must be lazy (a static import is a cycle:
// they reach services/printer-pages, which reaches this router); now all are.
const Overview = () => import('@/components/foreign/OverviewRoute.vue')
const Console = () => import('@/views/Console.vue')
const GcodePreview = () => import('@/views/GcodePreview.vue')
const Jobs = () => import('@/components/foreign/JobsRoute.vue')
const Tune = () => import('@/views/Tune.vue')
const Control = () => import('@/views/Control.vue')
const Maintenance = () => import('@/views/Maintenance.vue')
const Diagnostics = () => import('@/views/Diagnostics.vue')
const History = () => import('@/views/History.vue')
const Timelapse = () => import('@/views/Timelapse.vue')
const Configure = () => import('@/views/Configure.vue')
const Settings = () => import('@/views/Settings.vue')
const MacroCategorySettings = () => import('@/components/settings/macros/MacroCategorySettings.vue')
const Camera = () => import('@/components/foreign/CameraRoute.vue')
const NotFound = () => import('@/views/NotFound.vue')
const Login = () => import('@/views/Login.vue')
const Icons = () => import('@/views/Icons.vue')
const LinkLanding = () => import('@/views/LinkLanding.vue')
const JoinLanding = () => import('@/views/JoinLanding.vue')

Vue.use(VueRouter)

// A cloud printer is never asked for Moonraker's login (auth/logout).
const isAuthenticated = () => (
  router.app.$store.getters['auth/getAuthenticated'] ||
  !router.app.$store.state.socket.apiConnected ||
  isManagedApiUrl(router.app.$store.state.config.apiUrl)
)

/** The current printer's page, or Printers with no printer. */
const printerHome = () => {
  const slug = activeSlugNow()
  return slug ? `/${slug}` : '/'
}

const defaultRouteConfig: Partial<RouteConfig> = {
  beforeEnter: (to, from, next) => {
    const foreignRedirect = foreignPageRedirect(to)
    if (foreignRedirect) return next(foreignRedirect)
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

function foreignPageRedirect (to: Route): string | null {
  return foreignSlugNow(to.params.printer) && !['Dashboard', 'Jobs', 'Slice', 'Camera'].includes(String(to.name))
    ? `/${to.params.printer}`
    : null
}

/** One printer's pages: /boxwood-367a, /boxwood-367a/jobs (U1). */
const P = `/:printer(${ROUTE_SLUG_PATTERN})`

const printerRoutes: Array<RouteConfig> = [
  {
    path: P,
    name: 'Dashboard',
    component: Overview,
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
    path: `${P}/control`,
    name: 'Control',
    component: Control,
    ...defaultRouteConfig
  },
  {
    path: `${P}/maintenance`,
    name: 'Maintenance',
    component: Maintenance,
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
  // Wi-Fi and System are sections of Settings with pages of their own: they
  // open inside it, its list beside them (views/Settings.vue).
  {
    path: `${P}/wifi`,
    name: 'Wifi',
    component: Settings,
    ...defaultRouteConfig
  },
  {
    path: `${P}/system`,
    name: 'System',
    component: Settings,
    ...defaultRouteConfig
  },
  {
    // The printer updating. In the main chunk, not lazy: while the printer
    // restarts it can't serve a chunk (above).
    path: `${P}/updating`,
    name: 'Updating',
    component: Updating,
    ...defaultRouteConfig
  },
  {
    // The Muon3D Slicer in a frame (views/Slice.vue). Lazy, so the slicer's
    // host loads only here. Its frame, with the person's plates, stays while
    // Fluidd switches printer (init.ts keeps this route then). No
    // fileDropRoot: a model dropped here is the slicer's, not an upload.
    path: `${P}/slice`,
    name: 'Slice',
    component: () => import('@/components/foreign/SliceRoute.vue'),
    beforeEnter: defaultRouteConfig.beforeEnter,
    meta: {
      printerIndependent: true,
      keepOnPrinterSwitch: true,
      // The printer's page all the same: the rail and the E-STOP stay (KAN-511).
      frame: 'printer'
    }
  },
  {
    // Your Library (KAN-521): the prints saved from Slice, the account's, so
    // the same whichever printer is open, drawn beside its rail. Lazy, as
    // Printers is: Print on… opens printers, and the services that do import
    // the router.
    path: `${P}/library`,
    name: 'Library',
    component: () => import('@/views/Library.vue'),
    meta: {
      printerIndependent: true,
      frame: 'printer'
    }
  },
  {
    // One print: its picture, your printers, its versions.
    path: `${P}/library/:item`,
    name: 'Library print',
    component: () => import('@/views/LibraryPrint.vue'),
    meta: {
      printerIndependent: true,
      frame: 'printer'
    }
  },
  {
    // Your account (KAN-532), the account's like the Library, so the same
    // whichever printer is open, drawn beside its rail. Lazy: the first load
    // doesn't carry it.
    path: `${P}/account/:section?`,
    name: 'Account',
    component: () => import('@/views/Account.vue'),
    meta: {
      printerIndependent: true,
      frame: 'printer'
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
    component: Settings,
    ...defaultRouteConfig,
    children: [
      {
        path: 'macros/:categoryId',
        name: 'Macros',
        component: MacroCategorySettings
      }
    ]
  },
  {
    path: `${P}/camera/:cameraId?`,
    name: 'Camera',
    component: Camera,
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

/** The Library (and the account) under the printer Fluidd is on, when one is: /library is /boxwood-367a/library. */
const toLibraryOfActivePrinter: NavigationGuard = (to, from, next) => {
  const slug = activeSlugNow()
  if (slug) next({ path: `/${slug}${to.path}`, query: to.query, hash: to.hash })
  else next()
}

// /slice and the Library have pages of their own with no printer (the slicer
// exports without one; the Library is the account's).
const LEGACY_PRINTER_PAGES = [
  ...PRINTER_PAGE_PATHS.filter(path => !['/slice', '/camera', '/library', '/account'].includes(path)),
  '/settings/macros/:categoryId',
  '/camera',
  '/camera/:cameraId'
]

const routes: Array<RouteConfig> = [
  {
    // Every printer: printing now, your groups, those found on this network
    // and those offline, and a welcome with none. A printer's own address
    // opens that printer instead (U2): see main.ts. Loaded on its own: it
    // lists printers through the services that open them, and those import
    // the router (activate -> init -> router), so a static import here is a
    // cycle, and the page's pictures stay out of every printer page's load.
    path: '/',
    name: 'Printers',
    component: () => import('@/views/Printers.vue'),
    // KAN-532: the console's /logout comes back here; a tab that has just
    // signed out goes on to say so.
    beforeEnter: (to, from, next) => (readSignedOut() ? next({ path: '/signed-out', replace: true }) : next()),
    meta: {
      printerIndependent: true
    }
  },
  {
    // The fleet is the Printers page now.
    path: '/fleet',
    redirect: '/'
  },
  {
    path: '/welcome',
    redirect: '/'
  },
  // Your Library (KAN-521) with no printer open: with one, the same pages
  // under that printer, so the rail and the printer stay beside it.
  {
    path: '/library',
    name: 'Library (no printer)',
    component: () => import('@/views/Library.vue'),
    beforeEnter: toLibraryOfActivePrinter,
    meta: {
      printerIndependent: true
    }
  },
  {
    path: '/library/:item',
    name: 'Library print (no printer)',
    component: () => import('@/views/LibraryPrint.vue'),
    beforeEnter: toLibraryOfActivePrinter,
    meta: {
      printerIndependent: true
    }
  },
  // KAN-532: the pages the console's emails open (its links are
  // /#/account/<page>?token=, which legacyHash turns into these paths), and
  // signing out. No printer chrome, like /sign-in; before /account/:section?.
  {
    path: '/account/verify-email',
    name: 'Email link',
    component: () => import('@/views/AccountEmailLink.vue'),
    meta: {
      printerIndependent: true
    }
  },
  {
    path: '/account/reset-password',
    name: 'Password link',
    component: () => import('@/views/AccountEmailLink.vue'),
    meta: {
      printerIndependent: true
    }
  },
  {
    path: '/sign-out',
    name: 'Sign out',
    component: () => import('@/views/SignOut.vue'),
    meta: {
      printerIndependent: true
    }
  },
  {
    path: '/signed-out',
    name: 'Signed out',
    component: () => import('@/views/SignedOut.vue'),
    meta: {
      printerIndependent: true
    }
  },
  // Your account (KAN-532) with no printer open: with one, under that printer.
  {
    path: '/account/:section?',
    name: 'Account (no printer)',
    component: () => import('@/views/Account.vue'),
    beforeEnter: toLibraryOfActivePrinter,
    meta: {
      printerIndependent: true
    }
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
    // Settings' sections are its anchors: one opens at the top, in place of the last.
    if (to.name === 'Settings' && from.name === 'Settings') return { x: 0, y: 0 }
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
  const foreignRedirect = foreignPageRedirect(to)
  if (foreignRedirect) return next(foreignRedirect)
  router.app?.$store.commit('config/setContainerColumnCount', 2)
  next()
})

declare module 'vue-router' {
  interface RouteMeta {
    fillHeight?: boolean
    fileDropRoot?: string
    printerIndependent?: boolean
    /** A printer switch (appInit) leaves this route where it is instead of going to the dashboard. */
    keepOnPrinterSwitch?: boolean
    /** 'printer': drawn as the printer's page (the rail, the E-STOP) though it works without one. */
    frame?: 'printer'
  }
}

export default router
