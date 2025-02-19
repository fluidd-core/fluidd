import type { PrinterState } from './types'

/**
 * Maintains the state of the printer, by way of moonraker notifications.
 * We should never directly modify data here.
 */
export const defaultState = (): PrinterState => {
  return {
    info: null,
    manualProbeDialogOpen: false,
    bedScrewsAdjustDialogOpen: false,
    screwsTiltAdjustDialogOpen: false,
    forceMoveEnabled: false,
    printer: {
      configfile: {
        warnings: [],
        save_config_pending: false,
        save_config_pending_items: {},
        config: {},
        settings: {}
      },
      objects: [],
      idle_timeout: {
        state: 'Idle',
        printing_time: 0
      },
      toolhead: {
        estimated_print_time: 0,
        homed_axes: '',
        max_accel: 0,
        max_accel_to_decel: null,
        minimum_cruise_ratio: null,
        max_velocity: 0,
        position: [0, 0, 0, 0],
        axis_minimum: [0, 0, 0, 0],
        axis_maximum: [0, 0, 0, 0],
        print_time: 0,
        square_corner_velocity: 0,
        extruder: '',
        stalls: 0
      },
      gcode_move: {
        gcode_position: [0, 0, 0, 0],
        homing_origin: [0, 0, 0, 0],
        speed: 0,
        absolute_coordinates: false,
        absolute_extrude: false,
        extrude_factor: 1,
        position: [0, 0, 0, 0],
        speed_factor: 1
      },
      webhooks: {
        state: 'shutdown',
        state_message: ''
      },
      system_stats: {
        cputime: 0,
        memavail: 0,
        sysload: 0
      }
    }
  }
}

export const state = defaultState()
