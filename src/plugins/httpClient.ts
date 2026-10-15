import _Vue from 'vue'
import { EventBus } from '@/eventBus'
import { consola } from 'consola'
import axios, { AxiosError, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios'
import { Globals } from '@/globals'
import type { Store } from 'vuex'
import type { RootState } from '@/store/types'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'

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

  // For these paths, no status is toasted: the page that asked shows the
  // printer's answer itself (a developer-mode refusal names who may ask).
  const quietErrorRequests = [
    '/server/muon/dev_mode/request'
  ]

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

  const errorInterceptor = (error: AxiosError<string | { error?: string | { message?: string} } | undefined>) => {
    let message: string | undefined

    // Check if its a network / server error.
    if (!error.response || error.code === 'ERR_NETWORK') {
    // Network / Server Error.
      if (error.message) message = error.message
      consola.debug(message || 'Network error')
      return Promise.reject(error)
    }

    // All other errors. muon-link answers a refusal as {"error": "<why>"}.
    if (typeof error.response.data === 'object') {
      const answer = error.response.data.error
      message = typeof answer === 'string' ? answer : answer?.message
    } else {
      message = error.response.data
    }

    const url = error.config?.url || ''
    const quiet = quietErrorRequests.includes(url)
