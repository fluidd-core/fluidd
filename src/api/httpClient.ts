import store from '@/store'
import { EventBus, FlashMessageTypes } from '@/eventBus'
import consola from 'consola'
import Axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'
import { Globals } from '@/globals'
import { getTokenKeys } from '@/store/auth/helpers'

// Create a base instance with sane defaults.
const httpClient = Axios.create({
  withAuth: true,
  timeout: Globals.NETWORK_REQUEST_TIMEOUT
})
httpClient.prototype.CancelToken = Axios.CancelToken
httpClient.prototype.isCancel = Axios.isCancel

// For these paths, we don't emit an error because we handle them
// downstream.
const handledErrorRequests = [
  '/access/login'
]

const requestInterceptor = async (config: AxiosRequestConfig) => {
  // Common headers.
  config.headers.Accept = 'application/json'
  config.headers['Content-Type'] = 'application/json'

  if (config.withAuth) {
    // Check our auth token.
    // If the token is about to expire...
    // Attempt to refresh the token.
    // This would only run if we have tokens defined. Otherwise it's
    // assumed we're trusted by moonraker.
    const isExpiring = await store.dispatch('auth/checkToken')
    if (isExpiring) {
      await store.dispatch('auth/refreshTokens')
    }

    // Ensure we append the bearer token for authorized requests.
    // const keys = getTokenKeys()
    // const token = localStorage.getItem(keys['user-token'])
    const token = store.getters['auth/getToken']
    if (token) config.headers.Authorization = `Bearer ${token}`
  }

  return config
}

const responseInterceptor = (response: AxiosResponse) => {
  switch (response.status) {
    case 200:
      // We can reasonably assume that successfull moonraker responses
      // determine a user is trusted or authenticated in some way.
      if (
        store.state.config?.apiUrl &&
        response.config.baseURL === store.state.config?.apiUrl &&
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

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const errorInterceptor = (error: AxiosError) => {
  let message: string | undefined

  // Check if its a network / server error.
  if (!error.response) {
    // Network / Server Error.
    if (error.message) message = error.message
    consola.debug(message || 'Network error')
    return Promise.reject(error)
  }

  // All other errors
  if (error.response.data) message = error.response.data
  if (error.response.data.error.message) message = error.response.data.error.message

  const url = error.config.url || ''
  switch (error.response.status) {
    case 500:
      consola.debug(error.response.status, error.message, message)
      EventBus.$emit(message || 'Server error', { type: FlashMessageTypes.error })
      break
    case 400:
      consola.debug(error.response.status, error.message, message)
      if (!handledErrorRequests.includes(url)) {
        EventBus.$emit(message || 'Server error', { type: FlashMessageTypes.error })
      }
      break
    case 401:
      if (error.config.withAuth) {
        // logout.
        store.dispatch('auth/logout')
      }
      break
    case 404:
      consola.debug(error.response.status, error.message, message)
      break
    default:
      consola.debug(error.response.status, error.message)
      EventBus.$emit(message || 'Server error', { type: FlashMessageTypes.error })
  }

  return Promise.reject(error)
}

httpClient.interceptors.request.use(requestInterceptor, errorInterceptor)
httpClient.interceptors.response.use(responseInterceptor, errorInterceptor)

// Extend axios config to include anything we may need.
declare module 'axios' {
  export interface AxiosRequestConfig {
    // Enables axios to redirect if we encounter a 401, and sets the
    // authenticated flag dependant on our responses.
    withAuth?: boolean;
  }
}

export default httpClient
