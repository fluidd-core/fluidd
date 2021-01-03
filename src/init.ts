import Vue from 'vue'
import vuetify from './plugins/vuetify'
import store from './store'
import { Globals } from './globals'
import { ApiConfig, Config, FileConfig, HostConfig, InstanceConfig } from './store/config/types'
import { AxiosResponse } from 'axios'
import { isOfType } from './store/helpers'

// Load API configuration
/**
 * 1. Load API config.
 *    - Load from local storage, if it exists, if not;
 *    - Ping common endpoints, alongside browser url;
 * 2. Commit instance / api config to store.
 * 3. Load the active instance UI config, if it exists and commit to store.
 * 4. Resume Vue Init
 */
const getApiConfig = async (): Promise<{ config: ApiConfig | InstanceConfig; hostConfig: HostConfig | undefined }> => {
  // Always start by loading the host configuration.
  let hostConfigResponse: AxiosResponse
  let hostConfig: HostConfig | undefined
  try {
    hostConfigResponse = await Vue.$http.get('/config.json?date=' + new Date().getTime())
    if (hostConfigResponse && hostConfigResponse.data) {
      hostConfig = hostConfigResponse.data
    }
    console.debug('Loaded web host configuration', hostConfig)
  } catch (e) {
    console.debug('Failed loading web host configuration')
  }

  // Local storage load
  if (Globals.LOCAL_INSTANCES_STORAGE_KEY in localStorage) {
    const instances: InstanceConfig[] = JSON.parse(localStorage[Globals.LOCAL_INSTANCES_STORAGE_KEY])
    if (instances && instances.length) {
      for (const config of instances) {
        if (config.active) {
          console.debug('API Config from Local Storage', config)
          return { config, hostConfig }
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
    ? { config: Vue.$filters.getApiUrls(endpoints[i]), hostConfig }
    : { config: { apiUrl: '', socketUrl: '' }, hostConfig }
}

export const appInit = async (config?: ApiConfig, hostConfig?: HostConfig): Promise<Config> => {
  // Reset the store to its default state.
  store.dispatch('reset', {}, { root: true })

  // Load the API Config
  let apiConfig: ApiConfig
  if (config) {
    apiConfig = config
  } else {
    const c = await getApiConfig()
    apiConfig = c.config
    if (c.hostConfig && isOfType<HostConfig>(c.hostConfig, 'endpoints')) {
      hostConfig = c.hostConfig
    }
  }

  // if (hostConfig) store.dispatch('config/onInitHostConfig', hostConfig)
  // Just sets the api urls.
  store.dispatch('config/onInitApiConfig', apiConfig)

  // Load the File Config.
  let fileConfig: FileConfig | undefined | null
  if (
    apiConfig.apiUrl !== '' && apiConfig.socketUrl !== ''
  ) {
    try {
      const file = await fetch(apiConfig.apiUrl + '/server/files/config/' + Globals.SETTINGS_FILENAME, { cache: 'no-store' })
      fileConfig = (file.ok)
        ? await file.json()
        : null // no file yet.
    } catch (e) {
      // can't connect.
      console.debug('API Down / Not Available:', e)
    }
  }

  // fileConfig could equal;
  // - null - meaning we made a connection, but no user configuration is saved yet, which is ok.
  // - undefined - meaning the API is likely down..
  // apiConfig could have empty strings, meaning we have no valid connection.
  await store.dispatch('init', { apiConfig, fileConfig, hostConfig })

  // Set vuetify to the correct initial theme.
  if (store.state.config && store.state.config.fileConfig.general) {
    vuetify.framework.theme.dark = store.state.config.fileConfig.general.darkMode
  }

  return { apiConfig, fileConfig, hostConfig }
}
