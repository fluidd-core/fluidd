import Vue from 'vue'
import { MutationTree } from 'vuex'
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
  setInitLayout (state, payload: LayoutState) {
    if (payload && Object.keys(payload).length > 0) {
      const migratableLayouts = ['dashboard']

      for (const layout of migratableLayouts) {
        const defaultComponents = defaultState().layouts[layout]
        const existingComponents = Object.values(defaultComponents).flat().map(card => card.id)
        const componentsInDB = Object.values(payload.layouts[layout]).flat().map(card => card.id)

        // add missing components
        for (const [container, components] of Object.entries(defaultComponents)) {
          for (const component of components) {
            if (!componentsInDB.includes(component.id)) {
              payload.layouts[layout][container].push(component)
            }
          }
        }

        // remove outdated components
        for (const [container, components] of Object.entries(payload.layouts[layout])) {
          for (const component of components) {
            if (!existingComponents.includes(component.id)) {
              const payloadContainer = payload.layouts[layout][container]
              payloadContainer.splice(payloadContainer.indexOf(component), 1)
            }
          }
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
