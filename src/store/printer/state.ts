import type { PrinterState } from './types'

/**
 * Maintains the state of the printer, by way of moonraker notifications.
 * We should never directly modify data here.
 */
export const defaultState = (): PrinterState => {
  return {
    info: {
      state: '',
      state_message: ''
    },
    manualProbeDialogOpen: false,
    bedScrewsAdjustDialogOpen: false,
    screwsTiltAdjustDialogOpen: false,
    forceMoveEnabled: false,
    printer: {
      endstops: {},
      bed_mesh: {
        profile_name: ''
      },
      heaters: {
        available_heaters: [],
        available_sensors: []
      },
      configfile: {
        warnings: [],
        save_config_pending: false,
        save_config_pending_items: {},
        config: {
          virtual_sdcard: {},
          pause_resume: {},
          display_status: {},
          'gcode_macro CANCEL_PRINT': {}
        },
        settings: {
          bed_mesh: {},
          fan: {},
          printer: {
            max_accel_to_decel: 500,
            minimum_cruise_ratio: 0.5,
            max_accel: 1000,
            max_velocity: 100,
            square_corner_velocity: 3,
            kinematics: 'none'
          },
          virtual_sdcard: {},
          pause_resume: {},
          display_status: {},
          'gcode_macro cancel_print': {},
          extruder: {
            max_extrude_only_velocity: 100,
            max_extrude_only_distance: 100
          }
        }
      },
      objects: [],
      idle_timeout: {
        state: ''
      },
      print_stats: {
        state: '',
        print_duration: 0,
        total_duration: 0,
        filament_used: 0,
        filename: ''
      },
      display_status: {
        progress: 0,
        message: ''
      },
      virtual_sdcard: {
        file_position: 0,
        is_active: false,
        progress: 0
      },
      toolhead: {
        estimated_print_time: 0,
        homed_axes: '',
        max_accel: 0,
        max_accel_to_decel: null,
        minimum_cruise_ratio: null,
        max_velocity: 0,
        position: [0, 0, 0, 0],
        axis_minimum: [],
        axis_maximum: [],
        print_time: 0,
        square_corner_velocity: 0,
        extruder: ''
      },
      motion_report: {
        live_position: [0, 0, 0, 0],
        live_velocity: 0,
        live_extruder_velocity: 0
      },
      firmware_retraction: {
        retract_length: 0,
        unretract_extra_length: 0,
        unretract_speed: 0,
        retract_speed: 0
      },
      current_file: {
        estimated_time: 0,
        filament_total: 0,
        thumbnails: []
      },
      gcode: {
        commands: null
      },
      gcode_move: {
        gcode_position: [0, 0, 0, 0],
        homing_origin: [],
        speed: 0
      },
      manual_probe: {
        is_active: false,
        z_position: null,
        z_position_lower: null,
        z_position_upper: null
      },
      bed_screws: {
        is_active: false,
        state: null,
        current_screw: 0,
        accepted_screws: 0
      },
      screws_tilt_adjust: {},
      webhooks: {
        state: '',
        state_message: ''
      },
      exclude_object: {
        objects: [],
        excluded_objects: [],
        current_object: null
      }
    }
  }
}

export const state = defaultState()
