import Vue from 'vue'
import vuetify from './plugins/vuetify'
import store from './store'
import { Globals } from './globals'
import { ApiConfig, Config, FileConfig, InstanceConfig } from './store/config/types'
import { AxiosResponse } from 'axios'

// Load API configuration
/**
 * 1. Load API config.
 *    - Load from local storage, if it exists, if not;
 *    - Ping common endpoints, alongside browser url;
 * 2. Commit instance / api config to store.
 * 3. Load the active instance UI config, if it exists and commit to store.
 * 4. Resume Vue Init
 */
const getApiConfig = async (): Promise<ApiConfig | InstanceConfig> => {
  // Local storage load
  if (Globals.LOCAL_INSTANCES_STORAGE_KEY in localStorage) {
    const instances: InstanceConfig[] = JSON.parse(localStorage[Globals.LOCAL_INSTANCES_STORAGE_KEY])
    if (instances && instances.length) {
      for (const instance of instances) {
        if (instance.active) {
          console.debug('API Config from Local Storage', instance)
          return instance
        }
      }
    }
  }

  // If local storage not set, then ping some defaults if configured,
  // including the browser url.
  let endpoints: string[] = []
  let blacklist: string[] = []
  let config: AxiosResponse | undefined
  try {
    config = await Vue.$http.get('/config.json?date=' + new Date().getTime())
  } catch (e) {
    console.debug('Failed loading web host configuration')
  }

  if (config && config.data) {
    if (config.data.endpoints && config.data.endpoints.length) {
      endpoints = [...endpoints, ...config.data.endpoints]
    }
    if (config.data.blacklist && config.data.blacklist.length) {
      blacklist = [...blacklist, ...config.data.blacklist]
    }
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
        return await Vue.$http.get(endpoint + '/printer/info', { timeout: 500 })
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

export const appInit = async (config?: ApiConfig): Promise<Config> => {
  // Reset the store to its default state.
  store.dispatch('reset', {}, { root: true })

  // Load the API Config
  const apiConfig = config || await getApiConfig()
  store.dispatch('config/onInitApiConfig', apiConfig) // Just sets the api urls.

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
  // - null - meaning we made a connection, but the no user configuration is saved yet, which is ok.
  // - undefined - meaning the API is likely down..
  // apiConfig could have empty strings, meaning we have no valid connection.
  await store.dispatch('init', { apiConfig, fileConfig })

  // Set vuetify to the correct initial theme.
  if (store.state.config && store.state.config.fileConfig.general) {
    vuetify.framework.theme.dark = store.state.config.fileConfig.general.darkMode
  }

  return { apiConfig, fileConfig }
}
