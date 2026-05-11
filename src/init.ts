import Vue from 'vue'
import store from './store'
import { consola } from 'consola'
import { Globals } from './globals'
import type { ApiConfig, HostConfig, InstanceConfig } from './store/config/types'
import sanitizeEndpoint from './util/sanitize-endpoint'
import webSocketWrapper from './util/web-socket-wrapper'
import promiseAny from './util/promise-any'
import md5 from 'md5'

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
  const response = await fetch(`${import.meta.env.BASE_URL}config.json`)

  if (!response.ok) {
    consola.debug('Failed loading web host configuration')
    throw new Error('Unable to load host configuration. Please check the host.')
  }

  const hostConfig = await response.json() as HostConfig

  consola.debug('Loaded web host configuration', hostConfig)

  return hostConfig
}

const getApiConfig = async (hostConfig: HostConfig, apiUrlHash?: string | null): Promise<ApiConfig | InstanceConfig> => {
  // Local storage load
  if (Globals.LOCAL_INSTANCES_STORAGE_KEY in localStorage) {
    const instancesValue = localStorage[Globals.LOCAL_INSTANCES_STORAGE_KEY]

    if (typeof instancesValue === 'string') {
      const instances = JSON.parse(instancesValue) as InstanceConfig[]
      if (instances && instances.length) {
        if (apiUrlHash) {
          for (const config of instances) {
            if (md5(config.apiUrl) === apiUrlHash) {
              consola.debug('API Config from Local Storage', config)
              return config
            }
          }
        }
        for (const config of instances) {
          if (config.active) {
            consola.debug('API Config from Local Storage', config)
            return config
          }
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

  const abortController = new AbortController()

  try {
    const { signal } = abortController

    return await promiseAny(
      endpoints
        .map(async (endpoint) => {
          const apiEndpoints = Vue.$filters.getApiUrls(endpoint)

          const result = await webSocketWrapper(apiEndpoints.socketUrl, {
            timeout: 1200,
            signal
          })

          if (!result.ok) {
            throw new Error(result.message)
          }

          return apiEndpoints
        })
    )
  } catch {
    return {
      apiUrl: '',
      socketUrl: ''
    } satisfies ApiConfig
  } finally {
    abortController.abort()
  }
}

export const appInit = async (apiConfig?: ApiConfig, hostConfig?: HostConfig): Promise<void> => {
  try {
    Vue.$socket.close()

    // Reset the store to its default state.
    await store.typedDispatch('reset', undefined)

    // Load the Host Config
    if (!hostConfig) {
      hostConfig = await getHostConfig()
    }

    if (!(Globals.LOCAL_INSTANCES_STORAGE_KEY in localStorage)) {
      for (const endpoint of hostConfig.endpoints) {
        apiConfig = Vue.$filters.getApiUrls(endpoint)
        store.typedCommit('config/setInitInstances', apiConfig)
      }
    }

    const locationUrl = new URL(window.location.href)

    // Load the API Config
    if (!apiConfig) {
      const apiUrlHash = locationUrl.searchParams.get('printer')

      apiConfig = await getApiConfig(hostConfig, apiUrlHash)
    }

    // Set the printer url hash in the search params so that the url is bookmarkable
    if (apiConfig.apiUrl) {
      locationUrl.searchParams.set('printer', md5(apiConfig.apiUrl))

      window.history.replaceState(window.history.state, '', locationUrl)
    }

    consola.debug('inited apis', store.state.config, apiConfig)

    await store.typedDispatch('config/initConfig', { apiConfig, hostConfig })

    Vue.$socket.connect()
  } catch (e) {
    consola.error('Error during app initialization', e)

    // store.dispatch('reset') above set status back to `initializing`, so
    // without this transition SocketDisconnected stays on the "connecting…"
    // spinner indefinitely and the reconnect button never appears.
    await store.typedDispatch('socket/onSetStatus', 'disconnected')
  }
}
