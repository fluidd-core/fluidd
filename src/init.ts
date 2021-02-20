import Vue from 'vue'
import vuetify from './plugins/vuetify'
import store from './store'
import { Globals } from './globals'
import { ApiConfig, Config, HostConfig, InstanceConfig, UiSettings } from './store/config/types'

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
    console.debug('Loaded web host configuration', hostConfigResponse.data)
    return hostConfigResponse.data
  } else {
    console.debug('Failed loading web host configuration')
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
          console.debug('API Config from Local Storage', config)
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
        return await Vue.$http.get(endpoint + '/printer/info?date=' + new Date().getTime(), { timeout: 500 })
      } catch {
        console.debug('Failed loading endpoint ping', endpoint)
      }
    })
  )

  const i = results.findIndex(endpoint => endpoint !== undefined)
  return (i > -1)
    ? Vue.$filters.getApiUrls(endpoints[i])
    : { apiUrl: '', socketUrl: '' }
}

export const appInit = async (apiConfig?: ApiConfig, hostConfig?: HostConfig): Promise<Config> => {
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
  const fileConfig: {[index: string]: UiSettings | string[]} = {}
  const files: {[index: string]: string} = Globals.CONFIG_FILES
  if (
    apiConfig.apiUrl !== '' && apiConfig.socketUrl !== ''
  ) {
    try {
      for (const key in files) {
        const file = await fetch(apiConfig.apiUrl + '/server/files/config/' + files[key], { cache: 'no-store' })
        fileConfig[key] = (file.ok)
          ? await file.json()
          : null // no file yet.
      }
    } catch (e) {
      // can't connect.
      console.debug('API Down / Not Available:', e)
    }
  }

  // uiSettings could equal;
  // - null - meaning we made a connection, but no user configuration is saved yet, which is ok.
  // - undefined - meaning the API is likely down..
  // apiConfig could have empty strings, meaning we have no valid connection.
  await store.dispatch('init', { apiConfig, fileConfig, hostConfig })

  // Set vuetify to the correct initial theme.
  if (store.state.config && store.state.config.uiSettings.general) {
    vuetify.framework.theme.dark = store.state.config.uiSettings.general.darkMode
  }

  return { apiConfig, hostConfig }
}
