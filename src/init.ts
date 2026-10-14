import Vue from 'vue'
import store from './store'
import { consola } from 'consola'
import { Globals } from './globals'
import type { ApiConfig, InitConfig, HostConfig, InstanceConfig } from './store/config/types'
import axios from 'axios'
import router from './router'
import { routeAfterInit } from './router/afterInit'
import { httpClientActions } from './api/httpClientActions'
import sanitizeEndpoint from './util/sanitize-endpoint'
import webSocketWrapper from './util/web-socket-wrapper'
import promiseAny from './util/promise-any'
import sleep from './util/sleep'
import { setAuxApiBasePath } from './aux_api/useAuxApi'
import { resetSetupState } from './services/muon-setup/state'
import { isManagedApiUrl } from './services/muon-cloud/origin'
import { activeSlug, correctAddress, isActiveSlug, learnActiveIdentity } from './services/printer-pages'

// Load API configuration
/**
 * 1. Load API config.
 *    - Load from local storage, if it exists, if not;
 *    - Ping common endpoints, alongside browser url;
 * 2. Commit instance / api config to store.
 * 3. Load the active instance UI config, if it exists and commit to store.
 * 4. Resume Vue Init
 */

const getHostConfig = async () => {
  const hostConfigResponse = await httpClientActions.get<HostConfig>(`${import.meta.env.BASE_URL}config.json`)
  if (hostConfigResponse && hostConfigResponse.data) {
    consola.debug('Loaded web host configuration', hostConfigResponse.data)
    return hostConfigResponse.data
  } else {
    consola.debug('Failed loading web host configuration')
    throw new Error('Unable to load host configuration. Please check the host.')
  }
}

/** How long a start-up request may take before Fluidd stops waiting for it. */
const STARTUP_REQUEST_TIMEOUT_MS = 8000

/** How long the printer last used may take to answer before the page's own is used. */
const SAVED_PRINTER_ANSWER_MS = 3000

/** Whether anything answers HTTP at `apiUrl` within `timeout`. Any status counts. */
export const answersWithin = async (apiUrl: string, timeout: number): Promise<boolean> => {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeout)
  try {
    await fetch(`${apiUrl.replace(/\/+$/, '')}/server/info`, { mode: 'no-cors', cache: 'no-store', signal: controller.signal })
    return true
  } catch {
    return false
  } finally {
    window.clearTimeout(timer)
  }
}

/**
 * The page's own address as a printer, when the page may be one: not a
 * hosted console, and not a blacklisted host such as app.muon3d.com. A
 * console's own origin answers `/server/info` with something, and any answer
 * counts in `answersWithin`, so a hosted page must never be offered.
 */
export const ownEndpoint = (
  hostConfig: HostConfig,
  loc: { protocol: string, host: string, hostname: string } = document.location
): string | null => {
  if (hostConfig?.hosted) return null
  const hostname = loc.hostname.toLowerCase()
  const blacklist = hostConfig && 'blacklist' in hostConfig ? hostConfig.blacklist : []
  if (blacklist.some(s => s.toLowerCase() === hostname)) return null
  return `${loc.protocol}//${loc.host}`
}

/**
 * The printer to start on, given the one used last. A printer's own page
 * whose last printer is somewhere else, such as an address from another
 * network, used to wait for the operating system's connection timeout
 * (21 s on Windows, about 2 minutes on Linux and Android) on a black screen,
 * then show "No moonraker connection" for the wrong address. When the last
 * printer does not answer quickly and the page's own does, start on the
 * page's own; the other stays saved.
 */
export const startingPrinter = async (
  active: InstanceConfig,
  own: string | null,
  answers: (apiUrl: string, timeout: number) => Promise<boolean> = answersWithin
): Promise<InstanceConfig | ApiConfig> => {
  if (!own || isManagedApiUrl(active.apiUrl)) return active
  const ownApi = Vue.$filters.getApiUrls(own)
  if (ownApi.apiUrl.replace(/\/+$/, '') === active.apiUrl.replace(/\/+$/, '')) return active
  const [lastAnswers, ownAnswers] = await Promise.all([
    answers(active.apiUrl, SAVED_PRINTER_ANSWER_MS),
    answers(ownApi.apiUrl, SAVED_PRINTER_ANSWER_MS)
  ])
  if (lastAnswers || !ownAnswers) return active
  consola.debug('The printer used last did not answer; starting on this page\'s own', active.apiUrl, ownApi)
  return ownApi
}

export const getApiConfig = async (hostConfig: HostConfig): Promise<ApiConfig | InstanceConfig> => {
  // Local storage load
  if (Globals.LOCAL_INSTANCES_STORAGE_KEY in localStorage) {
    const instances = JSON.parse(localStorage[Globals.LOCAL_INSTANCES_STORAGE_KEY]) as InstanceConfig[]
    if (instances && instances.length) {
      for (const config of instances) {
        if (config.active) {
          consola.debug('API Config from Local Storage', config)
          return startingPrinter(config, ownEndpoint(hostConfig))
        }
      }
    }
  }

  // If local storage not set, then ping the browser url.
  const endpoints: string[] = []
  const blacklist: string[] = []

  if (hostConfig && 'blacklist' in hostConfig && hostConfig.blacklist.length) {
    blacklist.push(...hostConfig.blacklist)
  }

  // If endpoints are defined in the hostConfig file,
  // we want to load these on initial application launch
  if (hostConfig && 'endpoints' in hostConfig && hostConfig.endpoints.length) {
    endpoints.push(
      ...hostConfig.endpoints
        .map(sanitizeEndpoint)
        .filter((endpoint): endpoint is string => !!endpoint))
  }

  // Add the browsers url to our endpoints list, unless black listed. The
  // match is on the whole host: a fragment such as "muon3d" or "app" is not a
  // blacklisted host, and a printer so named must still probe itself.
  const hostname = document.location.hostname.toLowerCase()
  if (!blacklist.some(s => s.toLowerCase() === hostname)) {
    // Add the browser url.
    endpoints.push(`${document.location.protocol}//${document.location.host}`)

    // Add the moonraker endpoints...
    const port = document.location.protocol === 'https:' ? '7130' : '7125'

    endpoints.push(`${document.location.protocol}//${document.location.hostname}:${port}`)
  }

  // Nothing left to probe, as on a blacklisted host such as app.muon3d.com:
  // no printer can answer, so don't hold the first paint for the timeout.
  if (endpoints.length === 0) {
    return {
      apiUrl: '',
      socketUrl: ''
    } satisfies ApiConfig
  }

  const abortController = new AbortController()

  try {
    const { signal } = abortController

    const defaultOnTimeout = async () => {
      await sleep(5000, signal)

      return {
        apiUrl: '',
        socketUrl: ''
      } satisfies ApiConfig
    }

    return await promiseAny([
      ...endpoints.map(async (endpoint) => {
        const apiEndpoints = Vue.$filters.getApiUrls(endpoint)

        await webSocketWrapper(apiEndpoints.socketUrl, signal)

        return apiEndpoints
      }),
      defaultOnTimeout()
    ])
  } finally {
    abortController.abort()
  }
}

const getMoorakerDatabase = async (apiConfig: ApiConfig, namespace: string) => {
  const result = {
    data: {} as any,
    apiConnected: true,
    apiAuthenticated: true
  }

  if (apiConfig.apiUrl !== '' && apiConfig.socketUrl !== '') {
    try {
      // A printer on the network gets a time limit. One that is not there
      // used to hold the first paint for the operating system's own timeout.
      // A cloud printer's requests travel over Iroh, which has its own.
      const options = isManagedApiUrl(apiConfig.apiUrl) ? {} : { timeout: STARTUP_REQUEST_TIMEOUT_MS }
      const response = await httpClientActions.serverDatabaseItemGet(namespace, options)

      result.data = response.data.result.value

      consola.debug('loaded db', namespace, result.data)
    } catch (e) {
      switch (axios.isAxiosError(e) ? e.response?.status : 0) {
        case 404:
          // Connected but database does not yet exist
          break

        case 401:
          // The API is technically connected, but we're un-authenticated.
          result.apiAuthenticated = false
          break

        default:
          consola.debug('API Down / Not Available:', e)
          result.apiConnected = false
          break
      }
    }
  } else {
    result.apiConnected = false
    result.apiAuthenticated = false
  }

  return result
}

export const appInit = async (apiConfig?: ApiConfig, hostConfig?: HostConfig): Promise<InitConfig> => {
  // Reset the store to its default state.
  await store.dispatch('reset', undefined, { root: true })
  // The setup state lives outside Vuex; drop the previous printer's too, or a
  // higher rev from it would win over the new printer's notifications.
  resetSetupState()

  // Load the Host Config
  if (!hostConfig) {
    hostConfig = await getHostConfig()
  }

  if (!(Globals.LOCAL_INSTANCES_STORAGE_KEY in localStorage)) {
    for (const endpoint of hostConfig.endpoints) {
      apiConfig = Vue.$filters.getApiUrls(endpoint)
      await store.dispatch('config/initLocal', { apiConfig })
    }
  }

  // Load the API Config
  if (!apiConfig) {
    apiConfig = await getApiConfig(hostConfig)
  }

  // Setup axios
  if (apiConfig.apiUrl) httpClientActions.defaults.baseURL = apiConfig.apiUrl

  if (apiConfig.apiUrl) setAuxApiBasePath(apiConfig.apiUrl)

  // Just sets the api urls
  await store.dispatch('config/onInitApiConfig', apiConfig)
  consola.debug('inited apis', store.state.config, apiConfig)

  // Init authentication
  await store.dispatch('auth/initAuth')

  // Load any configuration we may have in moonrakers db
  let apiConnected = true
  let apiAuthenticated = true
  for (const { NAMESPACE, ROOTS } of Object.values(Globals.MOONRAKER_DB)) {
    if (!apiConnected && !apiAuthenticated) {
      break
    }

    if (Object.keys(ROOTS).length === 0) {
      continue
    }

    const result = await getMoorakerDatabase(apiConfig, NAMESPACE)

    apiAuthenticated = result.apiAuthenticated
    apiConnected = result.apiConnected

    if (!apiConnected || !apiAuthenticated) {
      break
    }

    const { data } = result

    const roots = Object.values<Record<string, any>>(ROOTS)

    const promises = roots.map(async (root) => {
      const value = root.name ? data[root.name] : data

      if (root.migrate_only) {
        if (value) store.dispatch(root.dispatch, value)
      } else {
        if (!value) {
          try {
            await httpClientActions.serverDatabaseItemPost(NAMESPACE, root.name, {})
          } catch (e) {
            consola.debug('Error creating database item', e)
          }
        }

        await store.dispatch(root.dispatch, value || {})
      }
    })

    await Promise.all(promises)
  }

  // apiConfig could have empty strings, meaning we have no valid connection.
  await store.dispatch('init', { apiConfig, hostConfig, apiConnected })

  // After a switch, a page of the old printer becomes the same page of this
  // one: the address always names the printer shown.
  const nextRoute = routeAfterInit(router.currentRoute, { slug: activeSlug(), isActive: isActiveSlug })
  if (nextRoute) router.replace(nextRoute).catch(() => {})

  // Learn the printer's own slug (its name and serial suffix), and correct an
  // address made before it was known, such as one from a saved IP.
  if (apiConnected && apiAuthenticated) {
    learnActiveIdentity().then(() => correctAddress(router)).catch(() => {})
  }

  return { apiConfig, hostConfig, apiConnected, apiAuthenticated }
}
