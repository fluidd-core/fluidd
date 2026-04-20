import Vue from 'vue'
import VueRouter, { type RouteConfig } from 'vue-router'
import store from '@/store'

Vue.use(VueRouter)

// Protected routes are blocked only while the socket state machine is in
// `authenticating` — the one state that demands the login form. Every other
// state (disconnected, connecting, identifying, ready) lets the route render;
// App.vue's SocketDisconnected overlay handles the not-yet-ready UX so
// deep-linked URLs survive bootstrap.
const canEnterProtectedRoute = (): boolean => (
  store.state.socket.status !== 'authenticating'
)

const defaultRouteConfig: Partial<RouteConfig> = {
  beforeEnter: (to, from, next) => {
    if (canEnterProtectedRoute()) {
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
    component: () => import('@/views/Dashboard.vue'),
    ...defaultRouteConfig,
    meta: {
      ...defaultRouteConfig.meta,
      dashboard: true
    }
  },
  {
    path: '/console',
    name: 'console',
    component: () => import('@/views/Console.vue'),
    ...defaultRouteConfig
  },
  {
    path: '/jobs',
    name: 'jobs',
    component: () => import('@/views/Jobs.vue'),
    ...defaultRouteConfig
  },
  {
    path: '/tune',
    name: 'tune',
    component: () => import('@/views/Tune.vue'),
    ...defaultRouteConfig
  },
  {
    path: '/diagnostics',
    name: 'diagnostics',
    component: () => import('@/views/Diagnostics.vue'),
    ...defaultRouteConfig,
    meta: {
      ...defaultRouteConfig.meta,
      dashboard: true
    }
  },
  {
    path: '/timelapse',
    name: 'timelapse',
    component: () => import('@/views/Timelapse.vue'),
    ...defaultRouteConfig,
    meta: {
      fileDropRoot: 'timelapse'
    }
  },
  {
    path: '/history',
    name: 'history',
    component: () => import('@/views/History.vue'),
    ...defaultRouteConfig
  },
  {
    path: '/system',
    name: 'system',
    component: () => import('@/views/System.vue'),
    ...defaultRouteConfig
  },
  {
    path: '/configure',
    name: 'configure',
    component: () => import('@/views/Configure.vue'),
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
      default: () => import('@/views/Settings.vue'),
      navigation: () => import('@/components/layout/AppSettingsNav.vue')
    },
    children: [
      {
        path: 'macros/:categoryId',
        name: 'macro_category_settings',
        meta: {
          hasSubNavigation: true
        },
        components: {
          default: () => import('@/components/settings/macros/MacroCategorySettings.vue'),
          navigation: () => import('@/components/layout/AppSettingsNav.vue')
        }
      }
    ]
  },
  {
    path: '/camera/:cameraId',
    name: 'camera',
    component: () => import('@/views/FullscreenCamera.vue'),
    ...defaultRouteConfig
  },
  {
    path: '/preview',
    name: 'gcode_preview',
    component: () => import('@/views/GcodePreview.vue'),
    ...defaultRouteConfig
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue'),
    beforeEnter: (to, from, next) => {
      if (store.state.socket.status === 'ready') {
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
    component: () => import('@/views/Icons.vue')
  },
  {
    path: '*',
    name: 'not_found',
    component: () => import('@/views/NotFound.vue')
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
  store.commit('config/setContainerColumnCount', 2)
  store.commit('config/setLayoutMode', false)
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
