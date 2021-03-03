import Vue from 'vue'
import vuetify from './plugins/vuetify'
import store from './store'
import consola from 'consola'
import { Globals } from './globals'
import { ApiConfig, InitConfig, HostConfig, InstanceConfig, UiSettings } from './store/config/types'
import { AxiosError, AxiosResponse } from 'axios'

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
  const hostConfigResponse = await Vue.$http.get('/config.json?date=' + new Date().getTime())
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

  // If local storage not set, then ping some defaults if configured,
  // including the browser url.
  let endpoints: string[] = []
  let blacklist: string[] = []

  if (hostConfig && 'endpoints' in hostConfig && hostConfig.endpoints.length) {
    endpoints = hostConfig.endpoints
  }

  if (hostConfig && 'blacklist' in hostConfig && hostConfig.blacklist.length) {
    blacklist = hostConfig.blacklist
  }

  // Add the browsers url to our endpoints list, unless black listed.
  if (blacklist.findIndex(s => s.includes(document.location.hostname)) === -1) {
    endpoints.push(`${document.location.protocol}//${document.location.hostname}:7125`)
    endpoints.push(`${document.location.protocol}//${document.location.hostname}`)
  }

  // For each endpoint we have, ping each one to determine if any are active.
  // If none are, we'll force the instance add dialog.
  const results = await Promise.all(
    endpoints.map(async endpoint => {
      try {
        return await Vue.$http.get(endpoint + '/printer/info?date=' + new Date().getTime(), { timeout: Globals.NETWORK_REQUEST_TIMEOUT })
      } catch {
        consola.debug('Failed loading endpoint ping', endpoint)
      }
    })
  )

  const i = results.findIndex(endpoint => endpoint !== undefined)
  return (i > -1)
    ? Vue.$filters.getApiUrls(endpoints[i])
    : { apiUrl: '', socketUrl: '' }
}

export const appInit = async (apiConfig?: ApiConfig, hostConfig?: HostConfig): Promise<InitConfig> => {
  // Reset the store to its default state.
  store.dispatch('reset', {}, { root: true })

  // Load the Host Config
  if (!hostConfig) {
    hostConfig = await getHostConfig()
  }

  // Load the API Config
  if (!apiConfig) {
    apiConfig = await getApiConfig(hostConfig)
  }

  // Just sets the api urls.
  store.dispatch('config/onInitApiConfig', apiConfig)

  // Load any file configuration we may have.
  const fileConfig: {[index: string]: UiSettings | string[] | null} | undefined = {}
  const files: {[index: string]: string} = Globals.CONFIG_FILES
  let apiConnected = true
  if (
    apiConfig.apiUrl !== '' && apiConfig.socketUrl !== ''
  ) {
    for (const key in files) {
      await Vue.$http.get(apiConfig.apiUrl + '/server/files/config/' + files[key] + '?date=' + new Date().getTime(), { timeout: Globals.NETWORK_REQUEST_TIMEOUT })
        .then((d) => {
          consola.debug('setting file data', d.data)
          fileConfig[key] = d.data
        })
        .catch((e: AxiosError) => {
          // If this is a 404, set the file config to null and move on.
          // If this is something else, we should set the api connection to
          // false because we couldn't make contact with moonraker.
          if (e.response && e.response.status === 404) {
            fileConfig[key] = null
          } else {
            // Otherwise, API is down / not available.
            // if (e.code === 'ECONNABORTED') {
            // }
            apiConnected = false
            consola.debug('API Down / Not Available:', e.response)
          }
        })
    }
  }

  // fileConfig could equal;
  // - null - meaning we made a connection, but no user configuration is saved yet, which is ok.
  // - undefined - meaning the API is likely down..
  // apiConfig could have empty strings, meaning we have no valid connection.
  await store.dispatch('init', { apiConfig, fileConfig, hostConfig })

  // Set vuetify to the correct initial theme.
  if (store.state.config && store.state.config.uiSettings.theme) {
    vuetify.framework.theme.dark = store.state.config.uiSettings.theme.darkMode
    vuetify.framework.theme.currentTheme.primary = store.state.config.uiSettings.theme.colors.primary
  }

  return { apiConfig, hostConfig, apiConnected }
}
