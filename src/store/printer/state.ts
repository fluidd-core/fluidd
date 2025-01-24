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
    endstops: {},
    manualProbeDialogOpen: false,
    bedScrewsAdjustDialogOpen: false,
    screwsTiltAdjustDialogOpen: false,
    forceMoveEnabled: false,
    printer: {
      bed_mesh: {
        profile_name: '',
        mesh_min: [0, 0],
        mesh_max: [0, 0],
        mesh_matrix: [],
        probed_matrix: [],
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
        settings: {}
      },
      objects: [],
      idle_timeout: {
        state: '',
        printing_time: 0
      },
      print_stats: {
        state: '',
        print_duration: 0,
        total_duration: 0,
        filament_used: 0,
        filename: '',
        message: ''
      },
      display_status: {
        progress: 0,
        message: ''
      },
      virtual_sdcard: {
        file_path: null,
        progress: 0,
        is_active: false,
        file_position: 0,
        file_size: 0
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
      webhooks: {
        state: '',
        state_message: ''
      },
      exclude_object: {
        objects: [],
        excluded_objects: [],
        current_object: null
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
