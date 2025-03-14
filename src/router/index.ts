import Vue from 'vue'
import VueRouter, { type RouteConfig } from 'vue-router'

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

Vue.use(VueRouter)

const isAuthenticated = (): boolean => (
  router.app.$typedState.auth.authenticated ||
  !router.app.$typedState.socket.apiConnected
)

const defaultRouteConfig: Partial<RouteConfig> = {
  beforeEnter: (to, from, next) => {
    if (isAuthenticated()) {
      next()
    } else {
      next({ name: 'login' })
    }
  },
  meta: {
    fileDropRoot: 'gcodes'
  }
}

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'home',
    component: Dashboard,
    ...defaultRouteConfig,
    meta: {
      ...defaultRouteConfig.meta,
      dashboard: true
    }
  },
  {
    path: '/console',
    name: 'console',
    component: Console,
    ...defaultRouteConfig
  },
  {
    path: '/jobs',
    name: 'jobs',
    component: Jobs,
    ...defaultRouteConfig
  },
  {
    path: '/tune',
    name: 'tune',
    component: Tune,
    ...defaultRouteConfig
  },
  {
    path: '/diagnostics',
    name: 'diagnostics',
    component: Diagnostics,
    ...defaultRouteConfig,
    meta: {
      ...defaultRouteConfig.meta,
      dashboard: true
    }
  },
  {
    path: '/timelapse',
    name: 'timelapse',
    component: Timelapse,
    ...defaultRouteConfig,
    meta: {
      fileDropRoot: 'timelapse'
    }
  },
  {
    path: '/history',
    name: 'history',
    component: History,
    ...defaultRouteConfig
  },
  {
    path: '/system',
    name: 'system',
    component: System,
    ...defaultRouteConfig
  },
  {
    path: '/configure',
    name: 'configure',
    component: Configure,
    ...defaultRouteConfig,
    meta: {}
  },
  {
    path: '/settings',
    name: 'settings',
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
        name: 'macro_category_settings',
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
    name: 'camera',
    component: FullscreenCamera,
    ...defaultRouteConfig
  },
  {
    path: '/preview',
    name: 'gcode_preview',
    component: GcodePreview,
    ...defaultRouteConfig
  },
  {
    path: '/login',
    name: 'login',
    component: Login,
    beforeEnter: (to, from, next) => {
      if (isAuthenticated()) {
        next({ name: 'home' })
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
    name: 'icons',
    component: Icons
  },
  {
    path: '*',
    name: 'not_found',
    component: NotFound
  }
]

const router = new VueRouter({
  base: import.meta.env.BASE_URL,
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
  router.app?.$store.commit('config/setLayoutMode', false)
  next()
})

declare module 'vue-router' {
  interface RouteMeta {
    fillHeight?: boolean
    hasSubNavigation?: boolean
    fileDropRoot?: string
  }
}

export default router
