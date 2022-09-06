import Vue from 'vue'
import { MutationTree } from 'vuex'
import { defaultState as getDefaultState } from './'
import { LayoutConfig, LayoutState, Layouts } from './types'

export const mutations: MutationTree<LayoutState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, getDefaultState())
  },

  /**
   * Inits the layout from moonraker.
   * This merge strategy should account for supported components
   * being the default state, and newly added components users may not
   * have in their moonraker db.
   */
  setInitLayout (state, payload: LayoutState) {
    if (payload && Object.keys(payload).length > 0) {
      const defaultState = getDefaultState()
      const migratableLayouts = ['dashboard']

      for (const layout of migratableLayouts) {
        const defaultComponents = defaultState.layouts[layout]
        const defaultComponentIds = Object.values(defaultComponents).flat().map(card => card.id)
        const currentComponentIds = Object.values(payload.layouts[layout]).flat().map(card => card.id)

        for (const [container, defaultContainerComponents] of Object.entries(defaultComponents)) {
          const currentContainerComponents = payload.layouts[layout][container] || []

          payload.layouts[layout][container] = [
            ...currentContainerComponents.filter(component => defaultComponentIds.includes(component.id)),
            ...defaultContainerComponents.filter(component => !currentComponentIds.includes(component.id))
          ]
        }
      }

      // add missing, non-migratable layouts
      for (const layout of Object.keys(defaultState.layouts).filter(layout => !migratableLayouts.includes(layout))) {
        if (!payload.layouts[layout]) {
          payload.layouts[layout] = defaultState.layouts[layout]
        }
      }

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
