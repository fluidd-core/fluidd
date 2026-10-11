import Vue from 'vue'
import VueRouter, { type RouteConfig } from 'vue-router'
import { applyLegacyHash } from './legacyHash'

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

const defaultRouteConfig: Partial<RouteConfig> = {
  beforeEnter: (to, from, next) => {
    if (isAuthenticated()) {
      next()
    } else {
      next('/login')
    }
  },
  meta: {
    fileDropRoot: 'gcodes'
  }
}

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    ...defaultRouteConfig
  },
  {
    path: '/console',
    name: 'Console',
    component: Console,
    ...defaultRouteConfig
  },
  {
    path: '/jobs',
    name: 'Jobs',
    component: Jobs,
    ...defaultRouteConfig
  },
  {
    path: '/tune',
    name: 'Tune',
    component: Tune,
    ...defaultRouteConfig
  },
  {
    path: '/diagnostics',
    name: 'Diagnostics',
    component: Diagnostics,
    ...defaultRouteConfig
  },
  {
    path: '/timelapse',
    name: 'Timelapse',
    component: Timelapse,
    ...defaultRouteConfig,
    meta: {
      fileDropRoot: 'timelapse'
    }
  },
  {
    path: '/history',
    name: 'History',
    component: History,
    ...defaultRouteConfig
  },
  {
    path: '/wifi',
    name: 'Wifi',
    component: Wifi,
    ...defaultRouteConfig
  },
  {
    path: '/system',
    name: 'System',
    component: System,
    ...defaultRouteConfig
  },
  {
    // The Muon3D Slicer in a frame (views/Slice.vue). Lazy, so the slicer's
    // host loads only here. Printer-independent: the slicer works with no
    // printer (export only), and its frame, with the person's plates, stays
    // while Fluidd switches printer (init.ts keeps this route then). No
    // fileDropRoot: a model dropped here is the slicer's, not an upload.
    path: '/slice',
    name: 'Slice',
    component: () => import('@/views/Slice.vue'),
    beforeEnter: defaultRouteConfig.beforeEnter,
    meta: {
      printerIndependent: true,
      keepOnPrinterSwitch: true
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
    name: 'Welcome',
    component: Welcome,
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
    path: '/configure',
    name: 'Configuration',
    component: Configure,
    ...defaultRouteConfig,
    meta: {}
  },
  {
    path: '/settings',
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
        path: '/settings/macros/:categoryId',
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
    path: '/camera/:cameraId',
    name: 'Camera',
    component: FullscreenCamera,
    ...defaultRouteConfig
  },
  {
    path: '/preview',
    name: 'Gcode Preview',
    component: GcodePreview,
    ...defaultRouteConfig
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    beforeEnter: (to, from, next) => {
      if (isAuthenticated()) {
        next('/')
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
