import { Module } from 'vuex'
import { v4 as uuidv4 } from 'uuid'
import { getters } from './getters'
import { actions } from './actions'
import { mutations } from './mutations'
import { LayoutState } from './types'
import { RootState } from '../types'
import { DiagnosticsCardContainer } from '@/store/diagnostics/types'

/**
 * Maintains the state of our page layouts.
 * Maintains;
 * - Position of card.
 * - If card is collapsed or not.
 * - If card is enabled or not.
 */
export const defaultState = (): LayoutState => {
  return {
    layouts: {
      dashboard: {
        container1: [
          { id: 'printer-status-card', enabled: true, collapsed: false },
          { id: 'camera-card', enabled: true, collapsed: false },
          { id: 'toolhead-card', enabled: true, collapsed: false },
          { id: 'macros-card', enabled: true, collapsed: false },
          { id: 'outputs-card', enabled: true, collapsed: false },
          { id: 'printer-limits-card', enabled: true, collapsed: false },
          { id: 'retract-card', enabled: true, collapsed: false }
        ],
        container2: [
          { id: 'temperature-card', enabled: true, collapsed: false },
          { id: 'console-card', enabled: true, collapsed: false },
          { id: 'jobs-card', enabled: true, collapsed: false },
          { id: 'gcode-preview-card', enabled: true, collapsed: false }
        ]
      },
      diagnostics: {
        container1: [{
          id: uuidv4(),
          enabled: true,
          title: 'Speeds',
          collapsed: false,
          height: 300,
          icon: 'motion',
          metrics: [{
            key: 'printer.printer.motion_report.live_extruder_velocity',
            name: 'Flow Rate',
            suffix: 'mm³/s',
            color: '#ff0000',
            factor: (1.75 / 2) ** 2 * Math.PI
          }, {
            key: 'printer.printer.motion_report.live_velocity',
            name: 'Velocity',
            suffix: 'mm/s',
            color: '#00ff00'
          }]
        }],
        container2: [],
        container3: [],
        container4: []
      } as DiagnosticsCardContainer
    }
  }
}

export const state = defaultState()

const namespaced = true

export const layout: Module<LayoutState, RootState> = {
  namespaced,
  state,
  getters,
  actions,
  mutations
}
