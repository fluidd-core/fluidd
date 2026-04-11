import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'

const klipperConfigMonarchLanguage: Monaco.languages.IMonarchLanguage = {
  defaultToken: '',
  ignoreCase: false,
  tokenPostfix: '',

  knownConfigBlockNames: [
    'ad5206', 'adc_scaled', 'adc_temperature', 'ads1x1x', 'adxl345',
    'aht10', 'aht20', 'aht21', 'aip31068_spi', 'angle',
    'axis_twist_compensation',
    'bed_mesh', 'bed_screws', 'bed_tilt', 'bltouch',
    'bme280', 'bme680', 'bmi160', 'bmp180', 'bmp280', 'bmp388',
    'board_pins',
    'carriage', 'controller_fan',
    'delayed_gcode', 'delta_calibrate', 'display', 'display_data',
    'display_glyph', 'display_status', 'display_template', 'dotstar',
    'dual_carriage',
    'endstop_phase', 'exclude_object', 'extra_carriage', 'extruder_stepper',
    'fan', 'fan_generic', 'filament_motion_sensor',
    'filament_switch_sensor', 'firmware_retraction', 'force_move',
    'gcode_arcs', 'gcode_button', 'gcode_macro',
    'hall_filament_width_sensor', 'heater_bed', 'heater_fan',
    'heater_generic', 'homing_heaters', 'homing_override', 'htu21d',
    'icm20948', 'idle_timeout', 'include', 'input_shaper',
    'led', 'lis2dw', 'lis3dh', 'lm75', 'load_cell', 'load_cell_probe',
    'manual_stepper', 'mcp4018', 'mcp4451', 'mcp4728',
    'mcu', 'menu', 'mpu9250', 'multi_pin',
    'neopixel',
    'output_pin',
    'palette2', 'pause_resume', 'pca9533', 'pca9632', 'printer', 'probe',
    'probe_eddy_current', 'pwm_cycle_time', 'pwm_tool',
    'quad_gantry_level',
    'resonance_tester', 'respond',
    'safe_z_home', 'samd_sercom', 'save_variables',
    'screws_tilt_adjust', 'sdcard_loop', 'servo', 'sht3x',
    'skew_correction', 'smart_effector', 'static_digital_output',
    'sx1509',
    'temperature_fan', 'temperature_probe', 'temperature_sensor',
    'thermistor', 'tsl1401cl_filament_width_sensor',
    'verify_heater', 'virtual_sdcard',
    'z_thermal_adjust', 'z_tilt'
  ],

  knownDriverTypes: [
    'tmc2130', 'tmc2208', 'tmc2209', 'tmc2240', 'tmc2660', 'tmc5160'
  ],

  gcodeExtendedCommands: [
    'ABORT', 'ACCEPT', 'ACCELEROMETER_DEBUG_READ',
    'ACCELEROMETER_DEBUG_WRITE', 'ACCELEROMETER_MEASURE',
    'ACCELEROMETER_QUERY', 'ACTIVATE_EXTRUDER',
    'ANGLE_CALIBRATE', 'ANGLE_CHIP_CALIBRATE',
    'ANGLE_DEBUG_READ', 'ANGLE_DEBUG_WRITE',
    'AXIS_TWIST_COMPENSATION_CALIBRATE',
    'BED_MESH_CALIBRATE', 'BED_MESH_CLEAR', 'BED_MESH_MAP',
    'BED_MESH_OFFSET', 'BED_MESH_OUTPUT', 'BED_MESH_PROFILE',
    'BED_SCREWS_ADJUST', 'BED_TILT_CALIBRATE',
    'BLTOUCH_DEBUG', 'BLTOUCH_STORE',
    'CALC_MEASURED_SKEW', 'CANCEL_PRINT', 'CLEAR_PAUSE',
    'DELTA_ANALYZE', 'DELTA_CALIBRATE',
    'DISABLE_FILAMENT_WIDTH_LOG', 'DISABLE_FILAMENT_WIDTH_SENSOR',
    'DUMP_TMC',
    'ENABLE_FILAMENT_WIDTH_LOG', 'ENABLE_FILAMENT_WIDTH_SENSOR',
    'ENDSTOP_PHASE_CALIBRATE',
    'EXCLUDE_OBJECT', 'EXCLUDE_OBJECT_DEFINE', 'EXCLUDE_OBJECT_END',
    'EXCLUDE_OBJECT_START',
    'FIRMWARE_RESTART', 'FORCE_MOVE',
    'GET_CURRENT_SKEW', 'GET_POSITION', 'GET_RETRACTION',
    'HELP',
    'INIT_TMC',
    'LDC_CALIBRATE_DRIVE_CURRENT',
    'LOAD_CELL_CALIBRATE', 'LOAD_CELL_DIAGNOSTIC', 'LOAD_CELL_READ',
    'LOAD_CELL_TARE', 'LOAD_CELL_TEST_TAP',
    'MANUAL_PROBE', 'MANUAL_STEPPER', 'MEASURE_AXES_NOISE',
    'PALETTE_CLEAR', 'PALETTE_CONNECT', 'PALETTE_CUT',
    'PALETTE_DISCONNECT', 'PALETTE_SMART_LOAD',
    'PAUSE', 'PID_CALIBRATE',
    'PROBE', 'PROBE_ACCURACY', 'PROBE_CALIBRATE',
    'PROBE_EDDY_CURRENT_CALIBRATE',
    'QUAD_GANTRY_LEVEL', 'QUERY_ADC', 'QUERY_ENDSTOPS',
    'QUERY_FILAMENT_SENSOR', 'QUERY_FILAMENT_WIDTH',
    'QUERY_PROBE', 'QUERY_RAW_FILAMENT_WIDTH',
    'RESET_FILAMENT_WIDTH_SENSOR', 'RESET_SMART_EFFECTOR',
    'RESPOND', 'RESTART',
    'RESTORE_DUAL_CARRIAGE_STATE', 'RESTORE_GCODE_STATE',
    'RESUME',
    'SAVE_CONFIG', 'SAVE_DUAL_CARRIAGE_STATE', 'SAVE_GCODE_STATE',
    'SAVE_VARIABLE',
    'SCREWS_TILT_CALCULATE',
    'SDCARD_LOOP_BEGIN', 'SDCARD_LOOP_DESIST', 'SDCARD_LOOP_END',
    'SDCARD_PRINT_FILE', 'SDCARD_RESET_FILE',
    'SET_DIGIPOT', 'SET_DISPLAY_GROUP', 'SET_DISPLAY_TEXT',
    'SET_DUAL_CARRIAGE', 'SET_EXTRUDER_ROTATION_DISTANCE',
    'SET_FAN_SPEED', 'SET_FILAMENT_SENSOR',
    'SET_GCODE_OFFSET', 'SET_GCODE_VARIABLE',
    'SET_HEATER_TEMPERATURE', 'SET_IDLE_TIMEOUT',
    'SET_INPUT_SHAPER', 'SET_KINEMATIC_POSITION',
    'SET_LED', 'SET_LED_TEMPLATE',
    'SET_PIN', 'SET_PRESSURE_ADVANCE', 'SET_PRINT_STATS_INFO',
    'SET_RETRACTION', 'SET_SERVO', 'SET_SKEW', 'SET_SMART_EFFECTOR',
    'SET_STEPPER_CARRIAGES', 'SET_STEPPER_ENABLE',
    'SET_TEMPERATURE_FAN_TARGET',
    'SET_TMC_CURRENT', 'SET_TMC_FIELD', 'SET_VELOCITY_LIMIT',
    'SET_Z_THERMAL_ADJUST',
    'SHAPER_CALIBRATE', 'SKEW_PROFILE', 'STATUS', 'STEPPER_BUZZ',
    'SYNC_EXTRUDER_MOTION',
    'TEMPERATURE_PROBE_CALIBRATE', 'TEMPERATURE_PROBE_COMPLETE',
    'TEMPERATURE_PROBE_ENABLE', 'TEMPERATURE_PROBE_NEXT',
    'TEMPERATURE_WAIT', 'TEST_RESONANCES', 'TESTZ',
    'TUNING_TOWER', 'TURN_OFF_HEATERS',
    'UPDATE_DELAYED_GCODE',
    'Z_ENDSTOP_CALIBRATE', 'Z_OFFSET_APPLY_ENDSTOP',
    'Z_OFFSET_APPLY_PROBE', 'Z_TILT_ADJUST'
  ],

  gcodeExtendedParameters: [
    'AC', 'ACCEL', 'ACCEL_PER_HZ', 'ACCEL_TO_DECEL', 'AD',
    'ADAPTIVE', 'ADAPTIVE_MARGIN', 'ADVANCE', 'ANGLE', 'AXIS',
    'BAND', 'BD', 'BLUE',
    'CARRIAGE', 'CENTER', 'CHIP', 'CHIPS', 'CLEAR', 'COMMAND', 'COUNT',
    'CURRENT', 'CURRENT_LAYER', 'CYCLE_TIME',
    'DAMPING_RATIO_X', 'DAMPING_RATIO_Y', 'DAMPING_RATIO_Z',
    'DIGIPOT', 'DIRECTION', 'DISABLE_CHECKS', 'DISPLAY', 'DISTANCE',
    'DRIFT_FILTER_CUTOFF_FREQUENCY', 'DURATION',
    'E', 'ENABLE', 'ERROR', 'EXTRUDER',
    'F', 'FACTOR', 'FAN', 'FIELD', 'FILENAME',
    'FREQ_END', 'FREQ_START', 'FREQUENCY_HZ',
    'GCODE_AXIS', 'GREEN', 'GROUP',
    'HEATER', 'HOLDCURRENT', 'HORIZONTAL_MOVE_Z', 'HZ_PER_SEC',
    'ID', 'INDEX', 'INPUT_SHAPING',
    'INSTANTANEOUS_CORNER_VELOCITY',
    'JSON',
    'LED', 'LIFT_SPEED', 'LIMIT_ACCEL', 'LIMIT_VELOCITY',
    'LOAD', 'LOAD_CELL',
    'MACRO', 'MAX_DEVIATION', 'MAX_SMOOTHING', 'MAX_SPEED', 'MAXIMUM',
    'METHOD', 'MIN_SPEED', 'MINIMUM', 'MINIMUM_CRUISE_RATIO', 'MODE',
    'MOTION_QUEUE', 'MOVE', 'MOVE_SPEED', 'MSG',
    'NAME',
    'OUTPUT',
    'P', 'PARAMETER', 'PGP', 'PIN', 'POINT', 'POLYGON', 'PREFIX',
    'PROBE_SPEED', 'PROFILE', 'PULLUP',
    'QUALITY',
    'RATE', 'RECOVERY_TIME', 'RED', 'REF_TEMP', 'REG', 'REGISTER',
    'REMOVE', 'RESET', 'RETRACT_LENGTH', 'RETRACT_SPEED',
    'S', 'SAMPLE_COUNT', 'SAMPLE_RETRACT_DIST', 'SAMPLE_TIME',
    'SAMPLES', 'SAMPLES_RESULT', 'SAMPLES_TOLERANCE',
    'SAMPLES_TOLERANCE_RETRIES',
    'SAVE', 'SENSITIVITY', 'SENSOR', 'SERVO', 'SET_HOMED',
    'SET_POSITION',
    'SHAPER_FREQ_X', 'SHAPER_FREQ_Y', 'SHAPER_FREQ_Z',
    'SHAPER_TYPE', 'SHAPER_TYPE_X', 'SHAPER_TYPE_Y', 'SHAPER_TYPE_Z',
    'SKIP', 'SMOOTH_TIME', 'SPEED',
    'SQUARE_CORNER_VELOCITY', 'START', 'STEP_DELTA', 'STEP_HEIGHT',
    'STEPPER', 'STOP_ON_ENDSTOP', 'SYNC',
    'T', 'TAP_THRESHOLD', 'TARGET', 'TEMP_COEFF', 'TEMPERATURE_FAN',
    'TEMPLATE', 'TIMEOUT', 'TOTAL_LAYER', 'TRANSMIT',
    'TRIGGER_FORCE', 'TYPE',
    'UNRETRACT_EXTRA_LENGTH', 'UNRETRACT_SPEED',
    'VAL', 'VALUE', 'VARIABLE', 'VELOCITY',
    'WHITE', 'WIDTH', 'WIPER', 'WRITE_FILE',
    'X', 'X_ADJUST', 'XY', 'XZ',
    'Y', 'Y_ADJUST', 'YZ',
    'Z', 'Z_ADJUST', 'ZFADE'
  ],

  gcodeExtendedParamValues: [
    '5V', 'average', 'ccw', 'command', 'copy', 'cw',
    'echo', 'error',
    'manual', 'median', 'mirror',
    'OD', 'output_mode_store',
    'pin_down', 'pin_up', 'primary',
    'reset',
    'self_test', 'set_5V_output_mode', 'set_OD_output_mode',
    'touch_mode'
  ],

  // Multi-word types must use regex (Monarch cases only match single tokens)
  knownThermistorTypes: /EPCOS 100K B57560G104F|ATC Semitec 104GT-2|ATC Semitec 104NT-4-R025H42G|Generic 3950|NTC 100K beta 3950|Honeywell 100K 135-104LAG-J01|NTC 100K MGB18-104F39050L32|SliceEngineering 450|TDK NTCG104LH104JT1/,

  knownSensorTypes: /PT100 INA826/,

  knownSingleWordSensorTypes: [
    'AD595', 'AD597', 'AD8494', 'AD8495', 'AD8496', 'AD8497',
    'AHT10', 'AHT20', 'AHT21',
    'BME280', 'BME680', 'BMP180', 'BMP280', 'BMP388',
    'DS18B20',
    'HTU21D',
    'LM75',
    'MAX6675', 'MAX31855', 'MAX31856', 'MAX31865',
    'MAX31867', 'MAX31868', 'MAX31875',
    'PT1000',
    'SHT21', 'SHT3X', 'SI7013', 'SI7020', 'SI7021',
    'temperature_host', 'temperature_mcu'
  ],

  knownControlTypes: [
    'pid', 'watermark'
  ],

  knownDisplayTypes: [
    'aip31068_spi', 'emulated_st7920',
    'hd44780', 'hd44780_spi',
    'sh1106', 'ssd1306', 'st7920', 'uc1701'
  ],

  tokenizer: {
    root: [
      // Comments
      [/^#.*$/, 'comment.line.number-sign'],
      [/;.*$/, 'comment.line.gcode'],

      // Config block headers: [section_name ...]
      [/^\[/, 'keyword.control', '@configBlock'],

      // Config line: key = value or key: value
      [/^(\w+)(\s*[:=]\s*)/, ['variable.name', ''], '@configValue'],

      // G-code lines (indented or within gcode sections)
      { include: '@gcodeLine' }
    ],

    configBlock: [
      [/\]/, 'keyword.control', '@pop'],
      [/#.*$/, 'comment.line.number-sign'],
      [/;.*$/, 'comment.line.gcode'],
      [/\bstepper_\w+\b/, 'storage.type'],
      [/\bextruder\d{0,2}\b/, 'storage.type'],
      [/\bstepper_z\d?\b/, 'storage.type'],
      [/\b\w+\b/, {
        cases: {
          '@knownConfigBlockNames': 'storage.type',
          '@knownDriverTypes': 'support.type',
          '@default': 'keyword.control'
        }
      }],
      [/[^\]#;\s]+/, 'keyword.control']
    ],

    configValue: [
      [/$/, '', '@pop'],
      [/#.*$/, 'comment.line.number-sign'],
      [/;.*$/, 'comment.line.gcode'],
      // Multi-word types (must be matched as regex before single-word catch-all)
      [/@knownThermistorTypes/, 'support.type'],
      [/@knownSensorTypes/, 'support.type'],
      // Serial paths
      [/\/dev\/serial\/by-(?:id|path)\/[\w/\-:.]+/, 'support.type'],
      // Pin patterns
      [/[~^!]*(?:z:)?[a-zA-Z]{1,2}\d{1,2}(?:\.\d{1,2})?/, 'support.type'],
      [/[~^!]*(?:ar|analog)\d{1,2}/i, 'support.type'],
      // Booleans
      [/\b(?:true|false)\b/i, 'constant.language'],
      { include: '@numbers' },
      // Single-word types and everything else
      [/[^\s#;]+/, {
        cases: {
          '@knownSingleWordSensorTypes': 'support.type',
          '@knownControlTypes': 'support.type',
          '@knownDisplayTypes': 'support.type',
          '@default': ''
        }
      }]
    ],

    gcodeLine: [
      // Extended commands (matched via keyword array)
      [/^\s+([A-Z_]+)\s/, {
        cases: {
          '$1@gcodeExtendedCommands': 'keyword.operator',
          '@default': ''
        }
      }],
      // Extended parameters: NAME=
      [/([A-Z_]+)(=)/, {
        cases: {
          '$1@gcodeExtendedParameters': { token: 'variable.parameter', next: '@gcodeParamValue' },
          '@default': ''
        }
      }],
      // Standard G/M/T/D commands
      [/^\s+[GMTD](?![a-zA-Z])/, 'keyword.operator'],
      // Macro blocks
      [/\{/, 'string.unquoted', '@macroBlock'],
      { include: '@numbers' }
    ],

    gcodeParamValue: [
      [/\s/, '', '@pop'],
      [/\{/, 'string.unquoted', '@macroBlock'],
      [/\b\w+\b/, {
        cases: {
          '@gcodeExtendedParamValues': 'constant.language',
          '@default': ''
        }
      }],
      { include: '@numbers' },
      [/[^\s{]+/, '']
    ],

    numbers: [
      [/-?\d+[.,]\d+\b/, 'constant.numeric'],
      [/-?[.,]\d+\b/, 'constant.numeric'],
      [/-?\d+\b/, 'constant.numeric']
    ],

    macroBlock: [
      [/\{/, 'string.unquoted', '@push'],
      [/\}/, 'string.unquoted', '@pop'],
      [/[^{}]+/, 'string.unquoted']
    ]
  }
}

export default klipperConfigMonarchLanguage
