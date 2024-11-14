import Vue from 'vue'
import type { MutationTree } from 'vuex'
import { defaultState as getDefaultState } from './state'
import type { LayoutConfig, LayoutState, Layouts } from './types'
import type { DiagnosticsCardContainer } from '../diagnostics/types'

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

      // add new layouts
      for (const [layoutKey, defaultLayout] of Object.entries(defaultState.layouts)) {
        if (!payload.layouts[layoutKey]) {
          payload.layouts[layoutKey] = defaultLayout
        }
      }

      // migrate existing layouts
      const migratableLayoutKeys = ['dashboard']

      for (const [layoutKey, currentLayout] of Object.entries(payload.layouts)) {
        for (const [containerKey, components] of Object.entries(currentLayout)) {
          currentLayout[containerKey] = components
            .filter(card => card != null)
        }

        const migratableLayoutKey = migratableLayoutKeys.find(key => layoutKey.startsWith(key))

        if (migratableLayoutKey) {
          const defaultLayout = defaultState.layouts[migratableLayoutKey]
          const defaultComponentIds = Object.values(defaultLayout).flat().map(card => card.id)
          const currentComponentIds = Object.values(currentLayout).flat().map(card => card.id)

          for (const [containerKey, defaultContainerComponents] of Object.entries(defaultLayout)) {
            const currentContainerComponents = currentLayout[containerKey] || []

            currentLayout[containerKey] = [
              ...currentContainerComponents.filter(component => defaultComponentIds.includes(component.id)),
              ...defaultContainerComponents.filter(component => !currentComponentIds.includes(component.id))
            ]
          }
        }

        // diagnostics specific layout updates
        if (layoutKey.startsWith('diagnostics')) {
          const diagnostics = currentLayout as DiagnosticsCardContainer

          for (const diagnosticsCardConfigs of Object.values(diagnostics)) {
            for (const diagnosticsCardConfig of diagnosticsCardConfigs) {
              for (const axis of diagnosticsCardConfig.axes) {
                for (const metric of axis.metrics) {
                  metric.style.fillColor = metric.style.fillColor ?? null
                }
              }
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
