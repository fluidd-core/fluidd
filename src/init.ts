import Vue from 'vue'
import store from './store'
import consola from 'consola'
import { Globals } from './globals'
import { ApiConfig, InitConfig, HostConfig, InstanceConfig } from './store/config/types'
import axios from 'axios'
import router from './router'
import { httpClientActions } from '@/api/httpClientActions'
import sanitizeEndpoint from '@/util/sanitize-endpoint'

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
  const hostConfigResponse = await httpClientActions.get<HostConfig>(`/config.json?date=${Date.now()}`)
  if (hostConfigResponse && hostConfigResponse.data) {
    consola.debug('Loaded web host configuration', hostConfigResponse.data)
    return hostConfigResponse.data
  } else {
    consola.debug('Failed loading web host configuration')
    throw new Error('Unable to load host configuration. Please check the host.')
  }
}

const getApiConfig = async (hostConfig: HostConfig): Promise<ApiConfig | InstanceConfig> => {
  // Local storage load
  if (Globals.LOCAL_INSTANCES_STORAGE_KEY in localStorage) {
    const instances = JSON.parse(localStorage[Globals.LOCAL_INSTANCES_STORAGE_KEY]) as InstanceConfig[]
    if (instances && instances.length) {
      for (const config of instances) {
        if (config.active) {
          consola.debug('API Config from Local Storage', config)
          return config
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

  // Add the browsers url to our endpoints list, unless black listed.
  if (blacklist.findIndex(s => s.includes(document.location.hostname)) === -1) {
    // Add the browser url.
    endpoints.push(`${document.location.protocol}//${document.location.host}`)

    // Add the moonraker endpoints...
    const port = document.location.protocol === 'https:' ? '7130' : '7125'

    endpoints.push(`${document.location.protocol}//${document.location.hostname}:${port}`)
  }

  // For each endpoint we have, ping each one to determine if any are active.
  // If none are, we'll force the instance add dialog.
  // A 401 would indicate a good ping, since it's potentially an authenticated,
  // endpoint but working instance.
  const results = await Promise.all(
    endpoints.map(async endpoint => {
      return httpClientActions.get(`${endpoint}/server/info?date=${Date.now()}`, { timeout: 1000 })
        .then(() => true)
        .catch((error) => error.response?.status === 401)
    })
  )

  const i = results.findIndex(endpoint => endpoint)
  return (i > -1)
    ? Vue.$filters.getApiUrls(endpoints[i])
    : { apiUrl: '', socketUrl: '' }
}

const getMoorakerDatabase = async (apiConfig: ApiConfig, namespace: string) => {
  const result = {
    data: {} as any,
    apiConnected: true,
    apiAuthenticated: true
  }

  if (apiConfig.apiUrl !== '' && apiConfig.socketUrl !== '') {
    try {
      const response = await httpClientActions.serverDatabaseItemGet(namespace)

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

  // Load the Host Config
  if (!hostConfig) {
    hostConfig = await getHostConfig()
  }

  // Load the API Config
  if (!apiConfig) {
    apiConfig = await getApiConfig(hostConfig)
  }

  // Setup axios
  if (apiConfig.apiUrl) httpClientActions.defaults.baseURL = apiConfig.apiUrl

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

    const result = await getMoorakerDatabase(apiConfig, NAMESPACE)

    apiAuthenticated = result.apiAuthenticated
    apiConnected = result.apiConnected

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

  // Ensure users start on the dash.
  if (router.currentRoute.path !== '/' && store.state.auth.authenticated) router.push('/')

  return { apiConfig, hostConfig, apiConnected, apiAuthenticated }
}
