import Vue from 'vue'
import { MutationTree } from 'vuex'
import getAllLayouts from '@/util/get-all-layouts'
import { defaultState } from './'
import { LayoutConfig, LayoutState, Layouts } from './types'

export const mutations: MutationTree<LayoutState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  /**
   * Inits the layout from moonraker.
   * This merge strategy should account for supported components
   * being the default state, and newly added components users may not
   * have in their moonraker db.
   */
  setInitLayout (state, payload) {
    if (payload && Object.keys(payload).length > 0) {
      const defaultComponents = Object.assign({}, defaultState())
      const supportedComponents = getAllLayouts(defaultComponents.layouts)

      for (const _layout in payload.layouts) {
        const layout = payload.layouts[_layout]
        for (const _container in layout) {
          const container = layout[_container]
          // Remove components that may no longer exist.
          payload.layouts[_layout][_container] = container
            .filter((config: LayoutConfig) => {
              const i = supportedComponents.findIndex(o => o.id === config.id)
              if (i >= 0) {
                // Remove this layout from the supported list.
                supportedComponents.splice(i, 1)
              }
              return i >= 0
            })
        }
      }

      // Missing compontents? Add'em.
      supportedComponents.forEach(o => {
        if (o.layout && o.container) {
          payload.layouts[o.layout][o.container].push(o)
        }
      })
      Object.assign(state, payload)
    }
  },

  setLayoutChange (state, payload: { name: string; value: Layouts }) {
    Vue.set(state.layouts, payload.name, payload.value)
  },

  /**
   * Updates a layout config item.
   */
  setUpdateConfig (state, payload: { name: string; container: string; i: number; value: LayoutConfig }) {
    Vue.set(state.layouts[payload.name][payload.container], payload.i, payload.value)
  }
}
