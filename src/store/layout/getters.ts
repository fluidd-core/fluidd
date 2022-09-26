import { GetterTree } from 'vuex'
import { LayoutState, LayoutContainer, LayoutConfig } from './types'
import { RootState } from '../types'
import { cloneDeep } from 'lodash-es'
import vuetify from '@/plugins/vuetify'

export const getters: GetterTree<LayoutState, RootState> = {
  /**
   * Return the state / config of a layout item given its page and id.
   */
  getLayoutConfigById: (state) => (name: string, id: string): LayoutConfig | undefined => {
    let config
    for (const key in state.layouts[name]) {
      if (config) break
      const layout = state.layouts[name][key]
      config = layout.find(o => o.id === id)
    }
    return config
  },

  /**
   * Return a layout (all containers) given a layout name.
   */
  getLayout: (state) => (name: string): LayoutContainer | undefined => {
    if (state.layouts[name]) {
      return cloneDeep(state.layouts[name])
      // return { ...state.layouts[name] }
    } else if (name.startsWith('dashboard')) {
      return cloneDeep(state.layouts.dashboard)
    }
  },

  isEnabledInLayout: (state, getters) => (layout: string, id: string) => {
    const configs = Object.values(getters.getLayout(layout) ?? {}).flat() as LayoutConfig[]

    return configs.find(configs => configs.id === id)?.enabled ?? false
  },

  /**
   * Return a layout's container given a layout name and container name.
   */
  getContainer: (state) => (name: string, container: string): LayoutConfig[] | undefined => {
    if (state.layouts[name][container]) {
      return [...state.layouts[name][container]]
    }
  },

  /**
   * Return a specific layout config given the layout and id.
   */
  getConfig: (state, getters) => (name: string, id: string): LayoutConfig | undefined => {
    const containers: LayoutContainer = getters.getLayout(name)
    if (containers) {
      for (const l in containers) {
        const config = containers[l].find(layout => layout.id === id)
        if (config) return { ...config }
      }
    }
  },

  getSpecificLayout: (state, getters, rootState, rootGetters): string => {
    const user = rootGetters['auth/getCurrentUser']
    if (!user) return 'dashboard'

    const size = vuetify.framework.breakpoint.name
    return `dashboard-${size}-${user.username}`
  }
}
