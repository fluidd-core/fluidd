import type { LayoutState } from './types'
import { v4 as uuidv4 } from 'uuid'
import type { DiagnosticsCardContainer } from '@/store/diagnostics/types'

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
          { id: 'spoolman-card', enabled: true, collapsed: false },
          { id: 'mmu-card', enabled: true, collapsed: false },
          { id: 'camera-card', enabled: true, collapsed: false },
          { id: 'toolhead-card', enabled: true, collapsed: false },
          { id: 'macros-card', enabled: true, collapsed: false },
          { id: 'outputs-card', enabled: true, collapsed: false },
          { id: 'runout-sensors-card', enabled: false, collapsed: false },
          { id: 'printer-limits-card', enabled: true, collapsed: false },
          { id: 'retract-card', enabled: true, collapsed: false }
        ],
        container2: [
          { id: 'temperature-card', enabled: true, collapsed: false },
          { id: 'sensors-card', enabled: true, collapsed: false },
          { id: 'console-card', enabled: true, collapsed: false },
          { id: 'jobs-card', enabled: true, collapsed: false },
          { id: 'job-queue-card', enabled: false, collapsed: false },
          { id: 'gcode-preview-card', enabled: true, collapsed: false },
          { id: 'bed-mesh-card', enabled: false, collapsed: false },
          { id: 'beacon-card', enabled: false, collapsed: false },
          { id: 'afc-card', enabled: true, collapsed: false }
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
          axes: [{
            enabled: true,
            unit: 'mm/s',
            showLegend: true,
            metrics: [{
              collector: 'printer.motion_report.live_velocity',
              name: 'Velocity',
              style: { lineStyle: 'solid', lineColor: '#2196f3', fillColor: null, fillOpacity: 0, displayLegend: true }
            }, {
              collector: 'printer.toolhead.max_velocity',
              name: 'Max Velocity',
              style: { lineStyle: 'dotted', lineColor: '#0075d2', fillColor: null, fillOpacity: 0, displayLegend: false }
            }]
          }, {
            enabled: true,
            unit: 'mm³/s',
            showLegend: true,
            max: 20,
            metrics: [{
              collector: 'printer.motion_report.live_extruder_velocity * Math.PI * ' +
                '(printer.configfile.settings.extruder.filament_diameter / 2) ** 2',
              name: 'Flow',
              style: { lineStyle: 'solid', lineColor: '#b12f36', fillColor: null, fillOpacity: 5, displayLegend: true }
            }, {
              collector: '12',
              name: 'Max Flow',
              style: { lineStyle: 'dashed', lineColor: '#820007', fillColor: null, fillOpacity: 0, displayLegend: false }
            }]
          }]
        }]
      } as DiagnosticsCardContainer
    }
  }
}

export const state = defaultState()
