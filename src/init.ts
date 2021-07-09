import Vue from 'vue'
import httpClient from '@/api/httpClient'
import store from './store'
import consola from 'consola'
import { Globals } from './globals'
import { ApiConfig, InitConfig, HostConfig, InstanceConfig } from './store/config/types'
import { AxiosError } from 'axios'
import router from './router'

// Load API configuration
/**
 * 1. Load API config.
 *    - Load from local storage, if it exists, if not;
 *    - Ping common endpoints, alongside browser url;
 * 2. Commit instance / api config to store.
 * 3. Load the active instance UI config, if it exists and commit to store.
 * 4. Resume Vue Init
 */

const getHostConfig = async (): Promise<HostConfig> => {
  const hostConfigResponse = await httpClient.get('/config.json?date=' + new Date().getTime())
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
    const instances: InstanceConfig[] = JSON.parse(localStorage[Globals.LOCAL_INSTANCES_STORAGE_KEY])
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
  let blacklist: string[] = []

  if (hostConfig && 'blacklist' in hostConfig && hostConfig.blacklist.length) {
    blacklist = hostConfig.blacklist
  }

  // Add the browsers url to our endpoints list, unless black listed.
  if (blacklist.findIndex(s => s.includes(document.location.hostname)) === -1) {
    // Add the browser url.
    endpoints.push(`${document.location.protocol}//${document.location.host}`)

    // Add the moonraker endpoints...
    let port = '7125'
    if (document.location.protocol === 'https:') port = '7130'
    endpoints.push(`${document.location.protocol}//${document.location.hostname}:${port}`)
  }

  // For each endpoint we have, ping each one to determine if any are active.
  // If none are, we'll force the instance add dialog.
  // A 401 would indicate a good ping, since it's potentially an authenticated,
  // endpoint but working instance.
  const results = await Promise.all(
    endpoints.map(async endpoint => {
      return httpClient.get(endpoint + '/server/info?date=' + new Date().getTime(), { timeout: 1000 })
        .then(() => true)
        .catch((response) => (response.status === 401))
    })
  )

  const i = results.findIndex(endpoint => endpoint)
  return (i > -1)
    ? Vue.$filters.getApiUrls(endpoints[i])
    : { apiUrl: '', socketUrl: '' }
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
  if (apiConfig.apiUrl) httpClient.defaults.baseURL = apiConfig.apiUrl

  // Just sets the api urls
  await store.dispatch('config/onInitApiConfig', apiConfig)
  consola.debug('inited apis', store.state.config, apiConfig)

  // Init authentication
  await store.dispatch('auth/initAuth')

  // Load any configuration we may have in moonrakers db
  let apiConnected = true
  let apiAuthenticated = true
  const roots: { [index: string]: any } = Globals.MOONRAKER_DB.ROOTS
  for (const key in roots) {
    if (apiConnected && apiAuthenticated) {
      const root = roots[key]
      let d = {}
      if (apiConfig.apiUrl !== '' && apiConfig.socketUrl !== '') {
        d = await httpClient.get(`/server/database/item?namespace=${Globals.MOONRAKER_DB.NAMESPACE}&key=${root.name}`)
          .then(r => {
            consola.debug('loaded db root', root.name, r.data.result.value)
            return r.data.result.value
          })
          .catch((r: AxiosError) => {
            if (r.response && r.response.status === 404) {
              // Init the db store with an empty object.
              httpClient.post('/server/database/item?namespace=' + Globals.MOONRAKER_DB.NAMESPACE, {
                key,
                value: {}
              })
              apiConnected = true
              return {}
            }
            if (r.response && r.response.status === 401) {
              // The API is technically connected, but we're un-authenticated.
              apiConnected = true
              apiAuthenticated = false
            } else {
              consola.debug('API Down / Not Available:', r)
              apiConnected = false
            }
            return {}
          })
      } else {
        apiConnected = false
        apiAuthenticated = false
      }
      if (d) store.dispatch(root.dispatch, d)
    }
  }

  // apiConfig could have empty strings, meaning we have no valid connection.
  await store.dispatch('init', { apiConfig, hostConfig, apiConnected })

  // Ensure users start on the dash.
  if (router.currentRoute.path !== '/' && store.state.auth?.authenticated) router.push('/')

  return { apiConfig, hostConfig, apiConnected, apiAuthenticated }
}
