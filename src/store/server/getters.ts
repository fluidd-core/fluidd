import type { GetterTree } from 'vuex'
import type { ServerInfo, ServerConfig, ServerState, SystemInfo, ServerSystemStat, ServiceInfo, ServiceState } from './types'
import type { RootState } from '../types'
import { Globals } from '@/globals'
import { gte, valid } from 'semver'

export const getters: GetterTree<ServerState, RootState> = {
  /**
   * Get's the current server info
   */
  getInfo: (state): ServerInfo => {
    return state.info
  },

  getIsMinApiVersion: (state) => (minVersion: string) => {
    const apiVersion = state.info.api_version_string
    return apiVersion && valid(apiVersion) && valid(minVersion) && gte(apiVersion, minVersion)
  },

  /**
   * Gets the current system info
   */
  getSystemInfo: (state): SystemInfo | null => {
    return state.system_info
  },

  /**
   * Return server config
   */
  getConfig: (state): ServerConfig => {
    return state.config
  },

  /**
   * Return server process stats
   */
  getProcessStats: (state): ServerSystemStat[] => {
    return state.moonraker_stats
  },

  /**
   * Indicates if a component is enabled
   */
  componentSupport: (state) => (component: string) => {
    return (state.info.components.includes(component))
  },

  /**
   * Return a list of services.
   * (will come from state.system_info with a moonraker update..)
   */
  getServices: (state): ServiceInfo[] => {
    const available_services: string[] = state.system_info?.available_services || []
    const service_states: ServiceState = state.system_info?.service_state || {}

    const services: ServiceInfo[] = [...available_services].sort().map((name: string) => {
      return name in service_states
        ? { name, ...service_states[name] }
        : { name }
    })

    return services
  },

  /**
   * Maps configuration files to an object representing a config doc link,
   * along with a service name.
   */
  getConfigMapByFilename: (state, getters, rootState, rootGetters) => (filename: string) => {
    const configMap = Globals.CONFIG_SERVICE_MAP

    // First, see if can find an exact match.
    let item = configMap.find(o => o.filename?.toLowerCase() === filename.toLowerCase())

    // ...now, try prefixes.
    if (!item) {
      item = configMap.find(o => o.prefix && filename.toLowerCase().startsWith(o.prefix.toLowerCase()))
    }

    // Finally, try suffixes.
    if (!item) {
      item = configMap.find(o => o.suffix && filename.endsWith(o.suffix.toLowerCase()))
    }

    if (
      item?.service === 'klipper' &&
      item.link
    ) {
      const klippyApp = rootGetters['printer/getKlippyApp']

      item.link = item.link.replace('{klipperDomain}', klippyApp.domain)
    }

    if (item) {
      const itemService = item?.service
      const instanceIds = rootState.server.system_info?.instance_ids

      return {
        serviceSupported: (instanceIds && itemService in instanceIds) || getters.getServices.some((i: ServiceInfo) => i.name === itemService),
        ...item
      }
    }

    return {}
  }
}
