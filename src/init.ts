import Vue from 'vue'
import vuetify from './plugins/vuetify'
import store from './store'
import consola from 'consola'
import { Globals } from './globals'
import { ApiConfig, InitConfig, HostConfig, InstanceConfig } from './store/config/types'
import { AxiosError } from 'axios'

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
        return await Vue.$http.get(endpoint + '/server/info?date=' + new Date().getTime(), { timeout: Globals.NETWORK_REQUEST_TIMEOUT })
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
  await store.dispatch('reset', undefined, { root: true })

  // Load the Host Config
  if (!hostConfig) {
    hostConfig = await getHostConfig()
  }

  // Load the API Config
  if (!apiConfig) {
    apiConfig = await getApiConfig(hostConfig)
  }

  // Just sets the api urls.
  // consola.log('we already have api config', apiConfig)
  await store.dispatch('config/onInitApiConfig', apiConfig)
  consola.log('inited apis', store.state.config, apiConfig)

  // TODO: REMOVE THIS FOR NEXT RELEASE.
  // Load any file configuration we may have - save it to db, then delete known config files.
  const files: string[] = [
    '.fluidd.json',
    '.fluidd_console_history.json'
  ]
  if (
    apiConfig.apiUrl !== '' && apiConfig.socketUrl !== ''
  ) {
    for (const file of files) {
      await Vue.$http.get(apiConfig.apiUrl + '/server/files/config/' + file + '?date=' + new Date().getTime(), { timeout: Globals.NETWORK_REQUEST_TIMEOUT })
        .then((d) => {
          if (file === '.fluidd.json') {
            const macros = (d.data.dashboard.hiddenMacros)
              ? [...d.data.dashboard.hiddenMacros]
              : undefined
            const theme = (d.data.theme)
              ? { ...d.data.theme }
              : undefined
            delete d.data.dashboard.hiddenMacros
            delete d.data.theme
            delete d.data.dashboard.tempPresets // remove old presets since we've adjusted their format.
            consola.debug('got ui data, writing', d.data)
            Vue.$http.post(apiConfig?.apiUrl + '/server/database/item?namespace=' + Globals.MOONRAKER_DB.NAMESPACE, {
              key: 'uiSettings',
              value: d.data
            })
            if (theme) {
              Vue.$http.post(apiConfig?.apiUrl + '/server/database/item?namespace=' + Globals.MOONRAKER_DB.NAMESPACE, {
                key: 'uiSettings.theme',
                value: {
                  isDark: theme.darkMode,
                  currentTheme: {
                    primary: theme.colors.primary
                  }
                }
              })
            }
            if (macros && macros.length > 0) {
              const convertedMacros: { name: string; visible: boolean }[] = macros.map(m => { return { name: m, visible: false } })
              consola.debug('got macros, writing', convertedMacros)
              Vue.$http.post(apiConfig?.apiUrl + '/server/database/item?namespace=' + Globals.MOONRAKER_DB.NAMESPACE, {
                key: 'macros.stored',
                value: convertedMacros
              })
            }
          }
          if (file === '.fluidd_console_history.json') {
            consola.log('got history data, writing', d.data)
            Vue.$http.post(apiConfig?.apiUrl + '/server/database/item?namespace=' + Globals.MOONRAKER_DB.NAMESPACE, {
              key: 'console.commandHistory',
              value: d.data
            })
          }

          // Delete the file
          Vue.$http.delete(apiConfig?.apiUrl + '/server/files/config/' + file)
        })
        .catch((e: AxiosError) => {
          // If its not there, fine.
          consola.debug('File not found, leaving.', e.response)
        })
    }
  }

  // Load any configuration we may have in moonrakers db
  let apiConnected = true
  if (
    apiConfig.apiUrl !== '' && apiConfig.socketUrl !== ''
  ) {
    const roots: { [index: string]: any } = Globals.MOONRAKER_DB.ROOTS
    for (const key in roots) {
      const root = roots[key]
      const d = await Vue.$http.get(apiConfig.apiUrl + `/server/database/item?namespace=${Globals.MOONRAKER_DB.NAMESPACE}&key=${root.name}`)
        .then(r => {
          consola.debug('loaded db root', root.name, r.data.result.value)
          return r.data.result.value
        })
        .catch((r: AxiosError) => {
          if (r.response && r.response.status === 404) {
            // Init the db store with an empty object.
            Vue.$http.post(apiConfig?.apiUrl + '/server/database/item?namespace=' + Globals.MOONRAKER_DB.NAMESPACE, {
              key,
              value: {}
            })
            return null
          }
          consola.debug('API Down / Not Available:', r)
          apiConnected = false
        })

      if (d) store.dispatch(root.dispatch, d)
    }
  }

  // apiConfig could have empty strings, meaning we have no valid connection.
  await store.dispatch('init', { apiConfig, hostConfig })

  // Set vuetify to the correct initial theme.
  if (store.state.config && store.state.config.uiSettings.theme) {
    vuetify.framework.theme.dark = store.state.config.uiSettings.theme.isDark
    vuetify.framework.theme.currentTheme.primary = store.state.config.uiSettings.theme.currentTheme.primary
  }

  return { apiConfig, hostConfig, apiConnected }
}
