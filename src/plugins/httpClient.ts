import _Vue from 'vue'
import { EventBus } from '@/eventBus'
import { consola } from 'consola'
import axios, { AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { Globals } from '@/globals'
import type { Store } from 'vuex'
import type { RootState } from '@/store/types'

const createHttpClient = (store: Store<RootState>) => {
  // Create a base instance with sane defaults.
  const httpClient = axios.create({
    withAuth: true,
    timeout: Globals.NETWORK_REQUEST_TIMEOUT
  })

  httpClient.defaults.headers.common['Content-Type'] = 'application/json'

  // For these paths, we force remove the withAuth flag.
  const unauthenticatedPaths = [
    '/access/login',
    '/access/refresh_token'
  ]

  // For these paths, we don't emit an error because we handle them
  // downstream.
  const handledErrorRequests = {
    400: [
      '/access/login'
    ],
    502: [
      '/access/oneshot_token',
      '/access/user'
    ]
  }

  const requestInterceptor = async (config: InternalAxiosRequestConfig) => {
    // Check our auth token.
    // If the token is about to expire...
    // Attempt to refresh the token.
    // This would only run if we have tokens defined. Otherwise it's
    // assumed we're trusted by moonraker.
    // Don't check for the refresh token path
    if (config.url !== '/access/refresh_jwt') {
      const isExpiring = await store.dispatch('auth/checkToken')
      if (isExpiring) {
        const token = await store.dispatch('auth/refreshTokens')
        if (token) config.headers.Authorization = `Bearer ${token}`
      }
    }

    // If this is a request for an api path known to not be authenticated, then
    // remove the withAuth flag.
    const path = config.url || ''
    if (unauthenticatedPaths.includes(path)) config.withAuth = false

    return config
  }

  const responseInterceptor = (response: AxiosResponse) => {
    switch (response.status) {
      case 200:
      // We can reasonably assume that successfull moonraker responses
      // determine a user is trusted or authenticated in some way.
        if (
          store.state.config.apiUrl &&
          response.config.baseURL === store.state.config.apiUrl &&
          response.config.withAuth
        ) {
        // Set authenticated to true.
          store.commit('auth/setAuthenticated', true)
        }
        break
      default:
    }
    return response
  }

  const errorInterceptor = async (error: AxiosError<string | { error?: { message?: string} } | undefined>) => {
    let message: string | undefined

    // Check if its a network / server error.
    if (!error.response || error.code === 'ERR_NETWORK') {
    // Network / Server Error.
      if (error.message) message = error.message
      consola.debug(message || 'Network error')
      throw error
    }

    // All other errors
    if (typeof error.response.data === 'object') {
      message = error.response.data.error?.message
    } else {
      message = error.response.data
    }

    const url = error.config?.url || ''
    switch (error.response.status) {
      case 500:
        consola.debug(error.response.status, error.message, message)
        EventBus.$emit(message || 'Server error', { type: 'error' })
        break
      case 502:
      case 400:
        consola.debug(error.response.status, error.message, message)
        if (!handledErrorRequests[error.response.status].includes(url)) {
          EventBus.$emit(message || 'Server error', { type: 'error' })
        }
        break
      case 401:
        if (error.config?.withAuth) {
        // logout.
          await store.dispatch('auth/logout')
        }
        break
      case 404:
        consola.debug(error.response.status, error.message, message)
        // EventBus.$emit(message || 'Server error', { type: 'warning' })
        break
      default:
        consola.debug(error.response.status, error.message)
        EventBus.$emit(message || 'Server error', { type: 'error' })
    }

    throw error
  }

  httpClient.interceptors.request.use(requestInterceptor, errorInterceptor)
  httpClient.interceptors.response.use(responseInterceptor, errorInterceptor)

  return httpClient
}

// Extend axios config to include anything we may need.
declare module 'axios' {
  export interface AxiosRequestConfig {
    // Enables axios to redirect if we encounter a 401, and sets the
    // authenticated flag dependant on our responses.
    withAuth?: boolean;
  }
}

export const HttpClientPlugin = {
  install (Vue: typeof _Vue, options?: HttpClientPluginOptions) {
    if (!options?.store) {
      throw new Error('store is required')
    }

    const httpClient = createHttpClient(options.store)
    Vue.prototype.$httpClient = httpClient
    Vue.$httpClient = httpClient
  }
}

interface HttpClientPluginOptions {
  store?: Store<RootState>
}

declare module 'vue/types/vue' {
  interface Vue {
    $httpClient: ReturnType<typeof createHttpClient>;
  }

  interface VueConstructor {
    $httpClient: ReturnType<typeof createHttpClient>;
  }
}
