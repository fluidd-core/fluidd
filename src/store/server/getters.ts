import { GetterTree } from 'vuex'
import { ServerInfo, ServerConfig, ServerState, SystemInfo, ServerSystemStat, ServiceInfo, ServiceState } from './types'
import { RootState } from '../types'
import { Globals } from '@/globals'

export const getters: GetterTree<ServerState, RootState> = {
  /**
   * Get's the current server info
   */
  getInfo: (state): ServerInfo => {
    return state.info
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
        ? { name: name, ...service_states[name] }
        : { name: name }
    })

    return services
  },

  /**
   * Maps configuration files to an object representing a config doc link,
   * along with a service name.
   */
  getConfigMapByFilename: (state, getters) => (filename: string) => {
    const configMap = Globals.CONFIG_SERVICE_MAP

    // First, see if can find an exact match.
    let item = configMap.find(o => o.filename?.toLowerCase() === filename.toLowerCase())

    // ...now, try prefixes.
    if (!item) {
      item = configMap.find(o => {
        if (o.prefix) {
          return filename.toLowerCase().startsWith(o.prefix.toLowerCase())
        }
      })
    }

    // Finally, try suffixes.
    if (!item) {
      item = configMap.find(o => {
        if (o.suffix) {
          return filename.endsWith(o.suffix.toLowerCase())
        }
      })
    }

    if (item) {
      return {
        serviceSupported: getters.getServices.some((i: ServiceInfo) => i.name === item?.service),
        ...item
      }
    }

    return {}
  }
}
