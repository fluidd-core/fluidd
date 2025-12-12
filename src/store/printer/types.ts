import type { Globals } from '@/globals'

export interface PrinterState {
  info: PrinterInfo | null;
  manualProbeDialogOpen: boolean;
  bedScrewsAdjustDialogOpen: boolean;
  screwsTiltAdjustDialogOpen: boolean;
  forceMoveEnabled: boolean;
  printer: KlipperPrinterState;
}

export interface PrinterInfo {
  state: PrinterInfoState;
  state_message: string;
  hostname?: string;
  klipper_path?: string;
  python_path?: string;
  process_id?: number;
  user_id?: number;
  group_id?: number;
  log_file?: string;
  config_file?: string;
  software_version?: string;
  cpu_info?: string
  app?: string;
}

export type PrinterInfoState = 'ready' | 'startup' | 'shutdown' | 'error'

type NonZeroDigit = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9'
type Digit = '0' | NonZeroDigit

export type ExtruderKey = 'extruder' | `extruder${NonZeroDigit}` | `extruder${NonZeroDigit}${Digit}`

export type TmcKey = `tmc${'2130' | '2208' | '2209' | '2660' | '2240' | '5160'} ${string}`

export type MmuUnitKey = `unit_${Digit}` | `unit_${NonZeroDigit}${Digit}`

export type AfcUnitKey = `${'AFC_BoxTurtle' | 'AFC_NightOwl' | 'AFC_QuattroBox' | 'AFC_HTLF'} ${string}`

type KlipperPrinterStateBaseType =
  {
    // These keys are always available

    objects: string[];

    configfile: KlipperPrinterConfigFileState;

    gcode_move: KlipperPrinterGcodeMoveState;

    idle_timeout: KlipperPrinterIdleTimeoutState;

    system_stats: KlipperPrinterSystemStatsState;

    toolhead: KlipperPrinterToolheadState;

    webhooks: KlipperPrinterWebhookState;

  } & Partial<{
    [key in ExtruderKey]: KlipperPrinterExtruderState
  } & {
    // These keys might not be available

    [key: `angle ${string}`]: KlipperPrinterAngleState;

    bed_mesh: KlipperPrinterBedMeshState;

    bed_screws: KlipperPrinterBedScrewsState;

    display_status: KlipperPrinterDisplayStatusState;

    endstop_phase: KlipperPrinterEndstopPhaseState;

    exclude_object: KlipperPrinterExcludeObjectState;

    [key: `extruder_stepper ${string}`]: KlipperPrinterExtruderStepperState;

    fan: KlipperPrinterFanState;

    [key: `${'heater_fan' | 'controller_fan'} ${string}`]: KlipperPrinterFanState;

    [key: `filament_switch_sensor ${string}`]: KlipperPrinterFilamentSwitchSensorState;

    [key: `filament_motion_sensor ${string}`]: KlipperPrinterFilamentMotionSensorState;

    firmware_retraction: KlipperPrinterFirmwareRetractionState;

    gcode: KlipperPrinterGcodeState;

    [key: `gcode_button ${string}`]: KlipperPrinterGcodeButtonState;

    [key: `gcode_macro ${string}`]: KlipperPrinterGcodeMacroState;

    hall_filament_width_sensor: KlipperPrinterHallFilamentWidthSensorState;

    heater_bed: KlipperPrinterHeaterBedState;

    [key: `heater_generic ${string}`]: KlipperPrinterHeaterGenericState;

    heaters: KlipperPrinterHeatersState;

    [key: `${'led' | 'neopixel' | 'dotstar' | 'pca9533' | 'pca9632'} ${string}`]: KlipperPrinterLedState;

    manual_probe: KlipperPrinterManualProbeState;

    menu: KlipperPrinterMenuState;

    mcu: KlipperPrinterMcuState;

    [key: `mcu ${string}`]: KlipperPrinterMcuState;

    motion_report: KlipperPrinterMotionReportState;

    [key: `${'output_pin' | 'pwm_tool'} ${string}`]: KlipperPrinterOutputPinState;

    pause_resume: KlipperPrinterPauseResumeState;

    print_stats: KlipperPrinterPrintStatsState;

    probe: KlipperPrinterProbeState;

    bltouch: KlipperPrinterProbeState;

    smart_effector: KlipperPrinterProbeState;

    [key: `probe_eddy_current ${string}`]: KlipperPrinterProbeState;

    [key: `pwm_cycle_time ${string}`]: KlipperPrinterPwmCycleTimeState;

    quad_gantry_level: KlipperPrinterQuadGantryLevelState;

    query_endstops: KlipperPrinterQueryEndstopsState;

    screws_tilt_adjust: KlipperPrinterScrewsTiltAdjustState;

    [key: `servo ${string}`]: KlipperPrinterServoState;

    skew_correction: KlipperPrinterSkewCorrectionState;

    stepper_enable: KlipperPrinterStepperEnableState;

    [key: `${'aht10' | 'aht1x' | 'aht2x' | 'aht3x' | 'bme280' | 'htu21d' | 'sht3x' | 'lm75' | 'temperature_host' | 'temperature_combined'} ${string}`]: KlipperPrinterTemperatureSensor2State;

    [key: `temperature_fan ${string}`]: KlipperPrinterTemperatureFanState;

    [key: `temperature_sensor ${string}`]: KlipperPrinterTemperatureSensorState;

    [key: `temperature_probe ${string}`]: KlipperPrinterTemperatureProbeState;

    [key: TmcKey]: KlipperPrinterTmcState;

    dual_carriage: KlipperDualCarriageState;

    virtual_sdcard: KlipperPrinterVirtualSdcardState;

    z_thermal_adjust: KlipperPrinterZThermalAdjustState;

    z_tilt: KlipperPrinterZTiltState;

    load_cell: KlipperPrinterLoadCellState;

    [key: `load_cell ${string}`]: KlipperPrinterLoadCellState;

    // These keys are for kalico modules

    [key: `belay ${string}`]: KalicoPrinterBelayState;

    dockable_probe: KalicoPrinterDockableProbeState;

    mixing_extruder: KalicoPrinterMixingExtruderState;

    tools_calibrate: KalicoPrinterToolsCalibrateState;

    trad_rack: KalicoPrinterTradRackState;

    z_calibration: KalicoPrinterZCalibrationState;

    // These keys are for external modules

    beacon: KlipperPrinterBeaconState;

    mmu: KlipperPrinterMmuState;

    mmu_leds: KlipperPrinterMmuLedsState;

    mmu_machine: KlipperPrinterMmuMachineState;

    AFC: KlipperPrinterAfcState;

    [key: `AFC_extruder ${string}`]: KlipperPrinterAfcExtruderState;

    [key: `AFC_buffer ${string}`]: KlipperPrinterAfcBufferState;

    [key: `AFC_lane ${string}`]: KlipperPrinterAfcLaneState;

    [key: `AFC_stepper ${string}`]: KlipperPrinterAfcLaneState;

    [key: `AFC_hub ${string}`]: KlipperPrinterAfcHubState;

    [key: `AFC_led ${string}`]: KlipperPrinterLedState;

    [key: AfcUnitKey]: KlipperPrinterAfcUnitState;
  }>

export interface KlipperPrinterState extends KlipperPrinterStateBaseType {
  [key: string]: Record<string, any> | undefined;
}

export interface KlipperPrinterConfigFileState {
  config: KlipperPrinterConfig;
  settings: KlipperPrinterSettings;
  warnings: KlipperPrinterConfigFileWarningState[];
  save_config_pending?: boolean;
  save_config_pending_items?: KlipperPrinterConfig | null;
}

export interface KlipperPrinterConfigFileWarningState {
  type: string;
  message: string;
}

export interface KlipperPrinterGcodeMoveState {
  speed_factor: number;
  speed: number;
  extrude_factor: number;
  absolute_coordinates: boolean;
  absolute_extrude: boolean;
  homing_origin: [number, number, number, number];
  position: [number, number, number, number];
  gcode_position: [number, number, number, number];
}

export interface KlipperPrinterIdleTimeoutState {
  state: 'Idle' | 'Printing' | 'Ready';
  printing_time: number;
}

export interface KlipperPrinterSystemStatsState {
  sysload: number;
  cputime: number;
  memavail: number;
}

export interface KlipperPrinterToolheadState {
  homed_axes: string;
  axis_minimum: [number, number, number, number];
  axis_maximum: [number, number, number, number];
  print_time: number;
  stalls: number;
  estimated_print_time: number;
  extruder: '' | ExtruderKey;
  position: [number, number, number, number];
  max_velocity: number;
  max_accel: number;
  max_accel_to_decel?: number | null;
  minimum_cruise_ratio?: number | null;
  square_corner_velocity: number;
  cone_start_z?: number;
}

export interface KlipperPrinterWebhookState {
  state: PrinterInfoState;
  state_message: string;
}

export interface KlipperPrinterAngleState {
  temperature: number;
}

export interface KlipperPrinterBedMeshState {
  profile_name: string;
  mesh_min: [number, number];
  mesh_max: [number, number];
  probed_matrix: number[][];
  mesh_matrix: number[][];
  profiles?: Record<string, KlipperPrinterBedMeshProfileState | undefined>;
}

export interface KlipperPrinterBedMeshProfileState {
  points: number[][];
  mesh_params: {
    min_x: number;
    max_x: number;
    min_y: number;
    max_y: number;
    x_count: number;
    y_count: number;
    mesh_x_pps: number;
    mesh_y_pps: number;
    algo: string;
    tension: number;
  };
}

export interface KlipperPrinterBedScrewsState {
  is_active: boolean;
  state: string | null;
  current_screw: number;
  accepted_screws: number;
}

export interface KlipperPrinterDisplayStatusState {
  progress: number;
  message: string | null;
}

export interface KlipperPrinterEndstopPhaseState {
  last_home: Record<string, {
    phase: number;
    phases: number;
    mcu_position: number;
  }>;
}

export interface KlipperPrinterExcludeObjectState {
  objects: KlipperPrinterExcludeObjectObjectState[];
  current_object: string | null;
  excluded_objects: string[];
}

export interface KlipperPrinterExcludeObjectObjectState {
  name: string;
  polygon?: [number, number][];
  center?: [number, number] | [number, number, number];
}

export interface KlipperPrinterExtruderStepperState {
  pressure_advance: number;
  smooth_time: number;
  motion_queue?: ExtruderKey | null;
}

export interface KlipperPrinterFanState {
  speed: number;
  rpm: number | null;
  power?: number;
  value?: number;
}

export interface KlipperPrinterFilamentSwitchSensorState {
  enabled: boolean;
  filament_detected: boolean;
}

export interface KlipperPrinterFilamentMotionSensorState {
  enabled: boolean;
  filament_detected: boolean;
}

export interface KlipperPrinterFirmwareRetractionState {
  retract_length: number;
  retract_speed: number;
  unretract_extra_length: number;
  unretract_speed: number;
  unretract_length?: number;
  retract_state?: boolean;
  z_hop_height?: number;
  zhop_state?: boolean;
}

export interface KlipperPrinterGcodeState {
  commands: GcodeCommands;
}

export interface KlipperPrinterGcodeButtonState {
  state: 'PRESSED' | 'RELEASED';
}

export interface KlipperPrinterGcodeMacroState extends Record<string, any> {
}

export interface KlipperPrinterHallFilamentWidthSensorState {
  is_active: boolean;
  Diameter: number;
  Raw: number;
}

export interface KlipperPrinterExtruderState {
  temperature: number;
  target: number;
  power: number;
  can_extrude: boolean;
  pressure_advance: number;
  smooth_time: number;
  motion_queue?: string | null;
  pid_profile?: string;
}

export interface KlipperPrinterHeaterBedState {
  temperature: number;
  target: number;
  power: number;
  pid_profile?: string;
}

export interface KlipperPrinterHeaterGenericState {
  temperature: number;
  target: number;
  power: number;
}

export interface KlipperPrinterHeatersState {
  available_heaters: ('heater_bed' | `heater_generic ${string}` | ExtruderKey)[];
  available_sensors: string[];
  available_monitors?: string[];
}

export interface KlipperPrinterLedState {
  color_data: number[][];
}

export interface KlipperPrinterManualProbeState {
  is_active: boolean;
  z_position: number | null;
  z_position_lower: number | null;
  z_position_upper: number | null;
}

export interface KlipperPrinterMenuState {
  timeout: number;
  running: boolean;
  rows: number;
  cols: number;
}

export interface KlipperPrinterMcuState {
  mcu_version?: string;
  mcu_build_versions?: string;
  mcu_constants?: Record<string, string | number>;
  last_stats?: Record<string, number>;
  app?: string;
  non_critical_disconnected?: boolean;
}

export interface KlipperPrinterMotionReportState {
  live_position: [number, number, number, number];
  live_velocity: number;
  live_extruder_velocity: number;
  steppers?: (`extruder_stepper ${string}` | `stepper_${string}` | ExtruderKey)[];
  trapq?: string[];
}

export interface KlipperPrinterOutputPinState {
  value: number;
}

export interface KlipperPrinterPauseResumeState {
  is_paused: boolean;
}

export interface KlipperPrinterPrintStatsState {
  filename: string;
  total_duration: number;
  print_duration: number;
  filament_used: number;
  state: 'printing' | 'paused' | 'standby' | 'complete' | 'cancelled' | 'error';
  message: string;
  info?: {
    total_layer: number | null;
    current_layer: number | null;
  }
}

export interface KlipperPrinterProbeState {
  name?: string;
  last_query: number;
  last_z_result: number;
}

export interface KlipperPrinterPwmCycleTimeState {
  value: number;
}

export interface KlipperPrinterQuadGantryLevelState {
  applied: boolean;
}

export interface KlipperPrinterQueryEndstopsState {
  last_query: Record<string, number>;
}

export interface KlipperPrinterScrewsTiltAdjustState {
  error: boolean;
  max_deviation: number | null;
  results: Record<string, {
    z: number;
    sign: 'CW' | 'CCW';
    adjust: string;
    is_base: boolean;
  }>
}

export interface KlipperPrinterServoState {
  value: number;
}

export interface KlipperPrinterSkewCorrectionState {
  current_profile_name: string;
}

export interface KlipperPrinterStepperEnableState {
  steppers: Record<string, boolean>;
}

export interface KlipperPrinterTemperatureSensor2State {
  temperature: number;
  humidity?: number;
  pressure?: number;
  gas?: number;
}

export interface KlipperPrinterTemperatureFanState extends KlipperPrinterFanState {
  temperature: number;
  target: number;
}

export interface KlipperPrinterTemperatureSensorState {
  temperature: number;
  measured_min_temp: number;
  measured_max_temp: number;
}

export interface KlipperPrinterTemperatureProbeState {
  temperature: number;
  measured_min_temp: number;
  measured_max_temp: number;
  in_calibration: boolean;
  estimated_expansion: number;
  compensation_enabled: boolean;
}

export interface KlipperPrinterTmcState {
  mcu_phase_offset: number;
  phase_offset_position: number;
  run_current: number;
  hold_current: number;
  drv_status: Record<string, number | null>;
  temperature: number | null;
}

export interface KlipperDualCarriageState {
  carriage_0: 'INACTIVE' | 'ACTIVE';
  carriage_1: 'INACTIVE' | 'ACTIVE' | 'COPY' | 'MIRROR';
}

export interface KlipperPrinterVirtualSdcardState {
  file_path: string | null;
  progress: number;
  is_active: boolean;
  file_position: number;
  file_size: number;
}

export interface KlipperPrinterZThermalAdjustState {
  enabled: boolean;
  temperature: number;
  measured_min_temp: number;
  measured_max_temp: number;
  current_z_adjust: number;
  z_adjust_ref_temperature: number;
}

export interface KlipperPrinterZTiltState {
  applied: boolean;
}

export interface KlipperPrinterLoadCellState {
  is_calibrated: boolean;
  counts_per_gram: null | number;
  reference_tare_counts: null | number;
  tare_counts: null | number;
  force_g?: number;
  min_force_g?: number;
  max_force_g?: number;
}

export interface KalicoPrinterBelayState {
  last_state: boolean;
  enabled: boolean;
}

export interface KalicoPrinterDockableProbeState {
  last_status: 'UNKNOWN' | 'ATTACHED' | 'DOCKED'
}

export interface KalicoPrinterMixingExtruderState {
  mixing: string;
  ticks: string;
}

export interface KalicoPrinterToolsCalibrateState {
  sensor_location: {
    x: number;
    y: number;
    z: number;
  } | null;
  last_result: {
    x: number;
    y: number;
    z: number;
  } | null;
  calibration_probe_inactive: boolean;
}

export interface KalicoPrinterTradRackState {
  curr_lane: number | null;
  active_lane: number | null;
  next_lane: number | null;
  next_tool: number | null;
  tool_map: any[];
  selector_homed: boolean;
}

export interface KalicoPrinterZCalibrationState {
  last_query: boolean;
  last_z_offset: number;
}

export interface KlipperPrinterBeaconState {
  last_sample?: {
    time: number;
    value: number;
    temp: number;
    dist?: number | null;
  } | null;
  last_received_sample?: {
    temp: number;
    clock: number;
    time: number;
    data: number;
    data_smooth: number;
    freq: number;
  } | null;
  last_z_result?: number | null,
  last_probe_position?: [number, number] | null,
  last_probe_result?: number | null,
  last_offset_result?: number | null,
  last_poke_result?: number | null
  model?: string | null;
}

export interface KlipperPrinterMmuState {
  enabled: boolean;
  num_gates: number;
  is_homed: boolean;
  is_locked: boolean;
  is_paused: boolean;
  is_in_print: boolean;
  print_state: string;
  unit: number;
  tool: number;
  gate: number;
  active_filament: unknown;
  num_toolchanges: number;
  last_tool: number;
  next_tool: number;
  toolchange_purge_volume: number;
  last_toolchange: string;
  runout: boolean;
  operation: string;
  filament: string;
  filament_position: number;
  filament_pos: number;
  filament_direction: number;
  ttg_map: number[];
  endless_spool_groups: number[];
  gate_status: number[];
  gate_filament_name: string[];
  gate_material: string[];
  gate_color: string[];
  gate_temperature: number[];
  gate_spool_id: number[];
  gate_speed_override: number[];
  gate_color_rgb: number[][];
  slicer_color_rgb: number[][];
  tool_extrusion_multipliers: number[];
  tool_speed_multipliers: number[];
  slicer_tool_map: {
    tools: {
      color: string;
      material: string;
      temp: number;
      name: string;
      in_use: boolean;
    }[];
    referenced_tools: number[];
    initial_tool: null;
    purge_volumes: unknown[];
    total_toolchanges: null;
    skip_automap: boolean;
  };
  action: string;
  has_bypass: boolean;
  sync_drive: boolean;
  sync_feedback_state: string;
  sync_feedback_enabled: boolean;
  sync_feedback_flow_rate: number;
  clog_detection: number;
  clog_detection_enabled: number;
  endless_spool: number;
  endless_spool_enabled: number;
  print_start_detection: number;
  reason_for_pause: string;
  extruder_filament_remaining: number;
  spoolman_support: string;
  enable_spoolman: number;
  bowden_progress: number;
  espooler_active: string;
  servo: string;
  grip?: string;
  sensors: Record<string, boolean | null>;
  flowguard?: {
    trigger: string;
    reason: string;
    level: number;
    max_clog: number;
    max_tangle: number;
    active: boolean;
    enabled: boolean;
  };
  encoder?: {
    encoder_pos: number;
    detection_length: number;
    min_headroom: number;
    headroom: number;
    desired_headroom: number;
    detection_mode: number;
    enabled: boolean;
    flow_rate: number;
  };
}

export interface KlipperPrinterMmuLedsState {
  exit: number;
  entry: number;
  status: number;
  logo: number;
  led_effect_module: boolean;
  num_gates: number;
  default_frame_rate: number;
}

type KlipperPrinterMmuMachineStateBaseType = {
  [key in MmuUnitKey]?: {
    name: string;
    vendor: string;
    version: string;
    num_gates: number;
    first_gate: number;
    selector_type: string;
    variable_rotation_distances: boolean;
    variable_bowden_lengths: boolean;
    require_bowden_move: boolean;
    filament_always_gripped: boolean;
    has_bypass: boolean;
    multi_gear: boolean;
    environment_sensor?: string;
  };
}

export interface KlipperPrinterMmuMachineState extends KlipperPrinterMmuMachineStateBaseType {
  num_units: number;
}

export type KlipperPrinterAfcStateState = 'Initialized' | 'Idle' | 'Error' | 'Loading' | 'Unloading' | 'Ejecting' | 'Moving' | 'Restoring'

export interface KlipperPrinterAfcState {
  current_load: string | null;
  current_lane: string | null;
  next_lane: string | null;
  current_state: KlipperPrinterAfcStateState;
  current_toolchange: number;
  number_of_toolchanges: number;
  spoolman: string | null;
  td1_present: boolean;
  lane_data_enabled: boolean;
  error_state: boolean;
  bypass_state: boolean;
  quiet_mode: boolean;
  position_saved: boolean;

  extruders: string[];
  hubs: string[];
  units: string[];
  lanes: string[];
  buffers: string[];
  message: {
    message: string | null;
    type: string | null;
  }
  led_state: boolean;
}

export interface KlipperPrinterAfcExtruderState {
  tool_stn: number;
  tool_stn_unload: number;
  tool_sensor_after_extruder: number;
  tool_unload_speed: number;
  tool_load_speed: number;
  buffer: string | null;
  lane_loaded: string | null;
  tool_start: string | null;
  tool_start_status: boolean;
  tool_end: string | null;
  tool_end_status: boolean;
  lanes: string[];
}

export type KlipperPrinterAfcBufferStatus = 'Unknown' | 'Advancing' | 'Trailing'

export interface KlipperPrinterAfcBufferState {
  state: KlipperPrinterAfcBufferStatus;
  lanes: string[];
  enabled: boolean;
}

export type KlipperPrinterAfcLaneStatus = 'None' | 'Error' | 'Loaded' | 'Tooled' | 'Tool Loaded' | 'Tool Loading' | 'Tool Unloading' | 'HUB Loading' | 'Ejecting' | 'Calibrating'

export interface KlipperPrinterAfcLaneState {
  name: string;
  unit: string;
  hub: string | null;
  extruder: string | null;
  buffer: string | null;
  buffer_status: KlipperPrinterAfcBufferStatus | null;
  lane: number;
  map: string | null;
  load: boolean;
  prep: boolean;
  tool_loaded: boolean;
  loaded_to_hub: boolean;
  material: string | null;
  density?: number;
  diameter?: number;
  empty_spool_weight?: number;
  spool_id: number | null;
  color: string | null;
  weight: number;
  extruder_temp: number | null;
  runout_lane: string | null;
  filament_status: 'In Tool' | 'Ready' | 'Prep' | 'Not Ready';
  filament_status_led: string;
  status: KlipperPrinterAfcLaneStatus;
  dist_hub: number;
  td1_data?: Record<string, unknown>;
  td1_td?: string;
  td1_color?: string;
  td1_scan_time?: string;
}

export interface KlipperPrinterAfcHubState {
  state: boolean;
  cut: boolean;
  cut_cmd: string | null;
  cut_dist: number;
  cut_clear: number;
  cut_min_length: number;
  cut_servo_pass_angle: number;
  cut_servo_clip_angle: number;
  cut_servo_prep_angle: number;
  lanes: string[];
  afc_bowden_length: number;
}

export interface KlipperPrinterAfcUnitState {
  lanes: string[];
  extruders: string[];
  hubs: string[];
  buffers: string[];
}

export interface KlipperPrinterConfig extends Record<string, Record<string, string | undefined> | undefined> {
}

type KlipperPrinterSettingsBaseType =
  Partial<{
    [key in ExtruderKey]: KlipperPrinterExtruderSettings;
  } & {
    mcu: KlipperPrinterMcuSettings;

    [key: `mcu ${Lowercase<string>}`]: KlipperPrinterMcuSettings;

    [key: Lowercase<TmcKey>]: KlipperPrinterTmcSettings;

    fan: KlipperPrinterFanSettings;

    [key: `heater_fan ${Lowercase<string>}`]: KlipperPrinterHeaterFanSettings;

    [key: `controller_fan ${Lowercase<string>}`]: KlipperPrinterControllerFanSettings;

    [key: `gcode_button ${Lowercase<string>}`]: KlipperPrinterGcodeButtonSettings;

    [key: `output_pin ${Lowercase<string>}`]: KlipperPrinterOutputPinSettings;

    [key: `${'led' | 'neopixel' | 'dotstar' | 'pca9533' | 'pca9632'} ${Lowercase<string>}`]: KlipperPrinterLedSettings;

    [key: `temperature_sensor ${Lowercase<string>}`]: KlipperPrinterTemperatureSensorSettings;

    [key: `temperature_probe ${Lowercase<string>}`]: KlipperPrinterTemperatureProbeSettings;

    safe_z_home: KlipperPrinterSafeZHomeSettings;

    z_tilt: KlipperPrinterZTiltSettings;

    bed_mesh: KlipperPrinterBedMeshSettings;

    board_pins: KlipperPrinterBoardPinsSettings;

    [key: `bed_mesh ${Lowercase<string>}`]: KlipperPrinterBedMeshModelSettings;

    bed_screws: KlipperPrinterBedScrewsSettings;

    screws_tilt_adjust: KlipperPrinterScrewsTiltAdjustSettings;

    firmware_retraction: KlipperPrinterFirmwareRetractionSettings;

    force_move: KlipperPrinterForceMoveSettings;

    gcode_arcs: KlipperPrinterGcodeArcsSettings;

    respond: KlipperPrinterRespondSettings;

    virtual_sdcard: KlipperPrinterVirtualSdcardSettings;

    z_thermal_adjust: KlipperPrinterZThermalAdjustSettings;

    pause_resume: KlipperPrinterPauseResumeSettings;

    delta_calibrate: KlipperPrinterDeltaCalibrateSettings;

    [key: `gcode_macro ${Lowercase<string>}`]: KlipperPrinterGcodeMacroSettings;

    heater_bed: KlipperPrinterHeaterBedSettings;

    [key: `heater_generic ${Lowercase<string>}`]: KlipperPrinterHeaterGenericSettings;

    [key: `verify_heater ${Lowercase<string>}`]: KlipperPrinterVerifyHeaterSettings;

    probe: KlipperPrinterProbeSettings;

    bltouch: KlipperPrinterBltouchSettings;

    smart_effector: KlipperPrinterSmartEffectorSettings;

    [key: `probe_eddy_current ${Lowercase<string>}`]: KlipperPrinterProbeEddyCurrentSettings;

    input_shaper: KlipperPrinterInputShaperSettings;

    printer: KlipperPrinterPrinterSettings;

    [key: `stepper_${Lowercase<string>}`]: KlipperPrinterStepperSettings;

    [key: `extruder_stepper ${Lowercase<string>}`]: KlipperPrinterExtruderStepperSettings;

    idle_timeout: KlipperPrinterIdleTimeoutSettings;

    exclude_object: KlipperPrinterExcludeObjectSettings;

    [key: `endstop_phase ${Lowercase<string>}`]: KlipperPrinterEndstopPhaseSettings;

    [key: `display_template ${Lowercase<string>}`]: KlipperPrinterDisplayTemplateSettings;

    load_cell: KlipperPrinterLoadCellSettings;

    [key: `load_cell ${Lowercase<string>}`]: KlipperPrinterLoadCellSettings;

    // These keys are for kalico modules

    danger_options: KalicoPrinterDangerOptionsSettings;

    constants: KalicoPrinterConstantsSettings;

    z_calibration: KalicoPrinterZCalibrationSettings;

    z_tilt_ng: KalicoPrinterZTiltNgSettings;

    // These keys are for external modules

    beacon: KlipperPrinterBeaconSettings;

    cartographer: KlipperPrinterCartographerScannerSettings;

    scanner: KlipperPrinterCartographerScannerSettings;

    [key: `beacon model ${Lowercase<string>}`]: KlipperPrinterBeaconModelSettings;

    afc: KlipperPrinterAfcSettings;

    afc_prep: KlipperPrinterAfcPrepSettings;

    afc_form_tip: KlipperPrinterAfcFormTipSettings;

    [key: `afc_extruder ${Lowercase<string>}`]: KlipperPrinterAfcExtruderSettings;

    [key: `afc_buffer ${Lowercase<string>}`]: KlipperPrinterAfcBufferSettings;

    [key: `afc_led ${Lowercase<string>}`]: KlipperPrinterAfcLedSettings;

    [key: `afc_lane ${Lowercase<string>}`]: KlipperPrinterAfcLaneSettings;

    [key: `afc_stepper ${Lowercase<string>}`]: KlipperPrinterAfcStepperSettings;

    [key: `afc_hub ${Lowercase<string>}`]: KlipperPrinterAfcHubSettings;

    [key: `afc_button ${Lowercase<string>}`]: KlipperPrinterAfcButtonSettings;
  }>

export interface KlipperPrinterSettings extends KlipperPrinterSettingsBaseType {
  [key: string]: Record<string, any> | undefined;
}

interface KlipperPrinterCommonSpiSettingsBase {
  spi_speed?: number;
  spi_bus?: string;
  spi_software_sclk_pin?: string;
  spi_software_mosi_pin?: string;
  spi_software_miso_pin?: string;
}

interface KlipperPrinterCommonI2cSettingsBase {
  i2c_mcu?: string;
  i2c_speed?: number;
  i2c_address?: number;
  i2c_bus?: string;
  i2c_software_scl_pin?: string;
  i2c_software_sda_pin?: string;
}

type KlipperPrinterSensorTypesType = {
  common_thermistors: 'EPCOS 100K B57560G104F' | 'ATC Semitec 104GT-2' | 'ATC Semitec 104NT-4-R025H42G' | 'Generic 3950' | 'Honeywell 100K 135-104LAG-J01' | 'NTC 100K MGB18-104F39050L32' | 'SliceEngineering 450' | 'TDK NTCG104LH104JT1',
  common_temperature_amplifiers: 'PT100 INA826' | 'AD595' | 'AD597' | 'AD8494' | 'AD8495' | 'AD8496' | 'AD8497'
  pt100: 'PT1000',
  maxxxxxx: 'MAX6675' | 'MAX31855' | 'MAX31856' | 'MAX31865',
  bme280: 'BME280',
  aht10: 'AHT10' | 'AHT1X' | 'AHT2X' | 'AHT3X',
  htu21d: 'HTU21D' | 'SI7013' | 'SI7020' | 'SI7021' | 'SHT21',
  sht3x: 'SHT3X',
  lm75: 'LM75',
  temperature_mcu: 'temperature_mcu',
  temperature_host: 'temperature_host',
  ds18b20: 'DS18B20',
  temperature_combined: 'temperature_combined',
}

export type KlipperPrinterSensorType = KlipperPrinterSensorTypesType[keyof KlipperPrinterSensorTypesType]

interface KlipperPrinterTemperatureSensorSettingsBase extends KlipperPrinterCommonSpiSettingsBase, KlipperPrinterCommonI2cSettingsBase {
  sensor_type: KlipperPrinterSensorType;
  sensor_pin?: string;
  sensor_mcu?: string;
  min_temp: number;
  max_temp: number;
  gcode_id?: string;
}

interface KlipperPrinterHeaterSettingsBase extends KlipperPrinterTemperatureSensorSettingsBase {
  min_extrude_temp: number;
  max_power: number;
  smooth_time: number;
  heater_pin: string;
  pwm_cycle_time: number;
  control: 'watermark' | 'pid' | 'pid-v' | 'mpc';
  max_delta?: number;
  pid_kp?: number;
  pid_ki?: number;
  pid_kd?: number;
  pid_version?: number;
}

interface KlipperPrinterStepperSettingsBase {
  step_pin: string;
  dir_pin: string;
  rotation_distance: number;
  microsteps: number;
  full_steps_per_rotation: number;
  gear_ratio: [number, number][];
  enable_pin: string;
}

export interface KlipperPrinterMcuSettings {
  serial: string;
  baud?: number;
  restart_method?: 'arduino' | 'cheetah' | 'rpi_usb' | 'command';
  max_stepper_error: number;
  is_non_critical?: boolean;
  reconnect_interval?: number;
}

export interface KlipperPrinterTmcSettings extends KlipperPrinterCommonSpiSettingsBase {
  cs_pin: string;
  rref: number;
  run_current: number;
  hold_current: number;
  interpolate: boolean;
  [key: `driver_${string}`]: number | boolean | undefined;
  home_current?: number;
  current_change_dwell_time?: number;
}

export interface KlipperPrinterFanSettings {
  max_power: number;
  kick_start_time: number;
  off_below: number;
  cycle_time: number;
  hardware_pwm: boolean;
  shutdown_speed: number;
  pin: string;
}

export interface KlipperPrinterHeaterFanSettings {
  heater: string[];
  heater_temp: number;
  max_power: number;
  kick_start_time: number;
  off_below: number;
  cycle_time: number;
  hardware_pwm: boolean;
  shutdown_speed: number;
  pin: string;
  fan_speed: number;
}

export interface KlipperPrinterControllerFanSettings {
  max_power: number;
  kick_start_time: number;
  off_below: number;
  cycle_time: number;
  hardware_pwm: boolean;
  shutdown_speed: number;
  pin: string;
  fan_speed: number;
  idle_speed: number;
  idle_timeout: number;
  stepper?: string;
}

export interface KlipperPrinterGcodeButtonSettings {
  pin: string;
  press_gcode: string;
  release_gcode: string;
  analog_range?: [number, number];
  analog_pullup_resistor?: number;
  debounce_delay?: number;
}

export interface KlipperPrinterOutputPinSettings {
  pwm: boolean;
  pin: string;
  cycle_time?: number;
  hardware_pwm?: boolean;
  scale?: number;
  static_value?: number;
  value: number;
  shutdown_value: number;
  maximum_mcu_duration?: number;
}

export interface KlipperPrinterLedSettings {
  pin: string;
  chain_count: number;
  color_order: string[];
  initial_red: number;
  initial_green: number;
  initial_blue: number;
  initial_white: number;
}

export interface KlipperPrinterTemperatureSensorSettings extends KlipperPrinterTemperatureSensorSettingsBase {
}

export interface KlipperPrinterTemperatureProbeSettings extends KlipperPrinterTemperatureSensorSettingsBase {
  speed?: number;
  horizontal_move_z: number;
  resting_z: number;
  calibration_position?: [number, number, number];
  calibration_bed_temp?: number;
  calibration_extruder_temp?: number;
  extruder_heating_z: number;
  smooth_time: number;
}

export interface KlipperPrinterSafeZHomeSettings {
  home_xy_position: [number, number]
  z_hop: number;
  z_hop_speed: number;
  speed: number;
  move_to_previous: boolean;
  home_y_before_x?: boolean;
}

export interface KlipperPrinterZTiltSettings {
  z_positions: [number, number][];
  retries: number;
  retry_tolerance: number;
  points: [number, number][];
  horizontal_move_z: number;
  speed: number;
  increasing_threshold?: number;
  adaptive_horizontal_move_z?: boolean;
  min_horizontal_move_z?: number;
  use_probe_xy_offsets?: boolean;
  enforce_lift_speed?: boolean;
}

export interface KlipperPrinterBedMeshSettings {
  adaptive_margin?: number;
  probe_count: [number, number];
  mesh_min: [number, number];
  mesh_max: [number, number];
  mesh_pps: [number, number];
  algorithm: 'lagrange' | 'bicubic';
  bicubic_tension?: number;
  scan_overshoot?: 0;
  zero_reference_position: [number, number];
  horizontal_move_z: number;
  speed: number;
  fade_start: number;
  fade_end: number;
  fade_target: number;
  split_delta_z: number;
  move_check_distance: number;
}

export interface KlipperPrinterBoardPinsSettings {
  mcu: string[];
  aliases: [string, string][];
}

export interface KlipperPrinterBedMeshModelSettings {
  version: number;
  points: number[][];
  min_x: number;
  max_x: number;
  min_y: number;
  max_y: number;
  x_count: number;
  y_count: number;
  mesh_x_pps: number;
  mesh_y_pps: number;
  algo: string;
  tension: number;
}

export interface KlipperPrinterBedScrewsSettings {
  [key: `screw${number}`]: [number, number] | undefined;
  [key: `screw${number}_name`]: string | undefined;
  [key: `screw${number}_fine_adjust`]: [number, number] | undefined;
  speed: number;
  probe_speed: number;
  horizontal_move_z: number;
  probe_height: number;
}

export interface KlipperPrinterScrewsTiltAdjustSettings {
  [key: `screw${number}`]: [number, number] | undefined;
  [key: `screw${number}_name`]: string | undefined;
  screw_thread: 'CW-M3' | 'CCW-M3' | 'CW-M4' | 'CCW-M4' | 'CW-M5' | 'CCW-M5' | 'CW-M8' | 'CCW-M8';
  horizontal_move_z: number;
  speed: number;
  adaptive_horizontal_move_z?: boolean;
  min_horizontal_move_z?: number;
  use_probe_xy_offsets?: boolean;
}

export interface KlipperPrinterFirmwareRetractionSettings {
  retract_length: number;
  retract_speed: number;
  unretract_extra_length: number;
  unretract_speed: number;
  z_hop_height?: number;
  clear_zhop_on_z_moves?: boolean;
}

export interface KlipperPrinterForceMoveSettings {
  enable_force_move: boolean;
}

export interface KlipperPrinterGcodeArcsSettings {
  resolution: number;
}

export interface KlipperPrinterRespondSettings {
  default_type: string;
  default_prefix: string;
  enable_respond?: boolean;
}

export interface KlipperPrinterVirtualSdcardSettings {
  path: string;
  on_error_gcode: string;
  with_subdirs?: boolean;
}

export interface KlipperPrinterZThermalAdjustSettings extends KlipperPrinterTemperatureSensorSettingsBase {
  temp_coeff: number;
  z_adjust_off_above: number;
  max_z_adjustment: number;
  smooth_time: number;
}

export interface KlipperPrinterPauseResumeSettings {
  recover_velocity: number;
}

export interface KlipperPrinterDeltaCalibrateSettings {
  radius: number;
  horizontal_move_z: number;
  speed: number;
}

export interface KlipperPrinterGcodeMacroSettings {
  gcode: string;
  rename_existing?: string;
  description: string;
  [key: `variable_${string}`]: string | undefined;
}

export interface KlipperPrinterHeaterBedSettings extends KlipperPrinterHeaterSettingsBase {
}

export interface KlipperPrinterHeaterGenericSettings extends KlipperPrinterHeaterSettingsBase {
}

export interface KlipperPrinterVerifyHeaterSettings {
  hysteresis: number;
  max_error: number;
  heating_gain: number;
  check_gain_time: number;
}

export interface KlipperPrinterProbeSettings {
  deactivate_on_each_sample: boolean;
  activate_gcode: string;
  deactivate_gcode: string;
  pin: string;
  x_offset: number;
  y_offset: number;
  z_offset: number;
  speed: number;
  lift_speed: number;
  samples: number;
  sample_retract_dist: number;
  samples_result: string;
  samples_tolerance: number;
  samples_tolerance_retries: number;
  drop_first_result?: boolean;
}

export interface KlipperPrinterBltouchSettings {
  stow_on_each_sample: boolean;
  probe_with_touch_mode: boolean;
  control_pin: string;
  sensor_pin: string;
  pin_up_reports_not_triggered: boolean;
  pin_up_touch_mode_reports_triggered: boolean;
  pin_move_time: number;
  x_offset: number;
  y_offset: number;
  z_offset: number;
  speed: number;
  lift_speed: number;
  samples: number;
  sample_retract_dist: number;
  samples_result: string;
  samples_tolerance: number;
  samples_tolerance_retries: number;
}

export interface KlipperPrinterSmartEffectorSettings {
  probe_accel: number;
  recovery_time: number;
  deactivate_on_each_sample: boolean;
  activate_gcode: string;
  deactivate_gcode: string;
  pin: string;
  x_offset: number;
  y_offset: number;
  z_offset: number;
  speed: number;
  lift_speed: number;
  samples: number;
  sample_retract_dist: number;
  samples_result: string;
  samples_tolerance: number;
  samples_tolerance_retries: number;
}

export interface KlipperPrinterProbeEddyCurrentSettings extends KlipperPrinterCommonI2cSettingsBase {
  sensor_type: 'ldc1612';
  reg_drive_current: number;
  x_offset: number;
  y_offset: number;
  z_offset: number;
  speed: number;
  lift_speed: number;
  samples: number;
  sample_retract_dist: number;
  samples_result: string;
  samples_tolerance: number;
  samples_tolerance_retries: number;
}

export type KlipperPrinterInputShaperType = 'zv' | 'mzv' | 'zvd' | 'ei' | '2hump_ei' | '3hump_ei'

export interface KlipperPrinterInputShaperSettings {
  shaper_type: KlipperPrinterInputShaperType;
  shaper_type_x: KlipperPrinterInputShaperType;
  damping_ratio_x: number;
  shaper_freq_x: number;
  shaper_type_y: KlipperPrinterInputShaperType;
  damping_ratio_y: number;
  shaper_freq_y: number;
}

export type KlipperPrinterPrinterKinematicsType = 'cartesian' | 'delta' | 'deltesian' | 'corexy' | 'corexz' | 'hybrid_corexy' | 'hybrid_corexz' | 'polar' | 'rotary_delta' | 'winch' | 'none' | 'limited_cartesian' | 'limited_corexy' | 'limited_corexz'

export interface KlipperPrinterPrinterSettings {
  kinematics: KlipperPrinterPrinterKinematicsType;
  max_velocity: number;
  max_accel: number;
  minimum_cruise_ratio?: number;
  square_corner_velocity?: number;
  max_z_velocity?: number;
  max_z_accel?: number;
  delta_radius?: number;
  max_accel_to_decel?: number;
}

export interface KlipperPrinterStepperSettings extends KlipperPrinterStepperSettingsBase {
  endstop_pin: string;
  position_endstop: number;
  position_min?: number;
  position_max?: number;
  homing_speed: number;
  second_homing_speed: number;
  homing_retract_speed: number;
  homing_retract_dist: number;
  homing_positive_dir: boolean;
  arm_length?: number;
  angle?: number;
  use_sensorless_homing?: boolean;
  min_home_dist?: number;
}

export interface KlipperPrinterExtruderStepperSettings extends KlipperPrinterStepperSettingsBase {
  pressure_advance: number;
  pressure_advance_smooth_time: number;
  extruder?: ExtruderKey | null;
}

export interface KlipperPrinterIdleTimeoutSettings {
  timeout: number;
  gcode: string;
}

export interface KlipperPrinterExtruderSettings extends KlipperPrinterHeaterSettingsBase, KlipperPrinterStepperSettingsBase {
  nozzle_diameter: number;
  filament_diameter: number;
  max_extrude_cross_section: number;
  max_extrude_only_velocity: number;
  max_extrude_only_accel: number;
  max_extrude_only_distance: number;
  instantaneous_corner_velocity: number;
  pressure_advance: number;
  pressure_advance_smooth_time: number;
  per_move_pressure_advance?: boolean;
}

export interface KlipperPrinterExcludeObjectSettings {
  enable_exclude_object?: boolean;
}

export interface KlipperPrinterEndstopPhaseSettings {
  endstop_align_zero: boolean;
  endstop_accuracy: number;
}

export interface KlipperPrinterDisplayTemplateSettings {
  text: string;
}

export interface KlipperPrinterLoadCellSettings extends KlipperPrinterCommonSpiSettingsBase {
  sensor_type: 'hx711' | 'hx717' | 'ads1220';
  counts_per_gram?: number;
  reference_tare_counts?: number;
  sensor_orientation: 'normal' | 'inverted';
  dout_pin?: string;
  sclk_pin?: string;
  cs_pin?: string;
  data_ready_pin?: string;
  sample_rate?: number;
  gain?: string;
  pga_bypass?: boolean;
  input_mux?: string;
  vref?: string;
}

export interface KalicoPrinterDangerOptionsSettings {
  minimal_logging: boolean;
  log_statistics: boolean;
  log_config_file_at_startup: boolean;
  log_bed_mesh_at_startup: boolean;
  log_velocity_limit_changes: boolean;
  log_pressure_advance_changes: boolean;
  log_shutdown_info: boolean;
  log_serial_reader_warnings: boolean;
  log_startup_info: boolean;
  log_webhook_method_register_messages: boolean;
  error_on_unused_config_options: boolean;
  allow_plugin_override: boolean;
  multi_mcu_trsync_timeout: number;
  homing_elapsed_distance_tolerance: number;
  temp_ignore_limits: boolean;
  autosave_includes: boolean;
  bgflush_extra_time: number;
  homing_start_delay: number;
  endstop_sample_time: number;
  endstop_sample_count: number;
}

export interface KalicoPrinterConstantsSettings extends Record<string, string | undefined> {
}

export interface KalicoPrinterZCalibrationSettings {
  nozzle_xy_position: string;
  switch_xy_position: string;
  bed_xy_position?: string;
  switch_offset: number;
  max_deviation?: number;
  samples?: number;
  samples_tolerance?: number;
  samples_tolerance_retries?: number;
  samples_result: string;
  clearance?: number;
  position_min?: number;
  speed: number;
  lift_speed?: number;
  probing_speed?: number;
  probing_second_speed?: number;
  probing_retract_dist?: number;
  probing_first_fast: boolean;
  start_gcode: string;
  before_switch_gcode: string;
  end_gcode: string;
}

export interface KalicoPrinterZTiltNgSettings {
  z_positions: [number, number][];
  retries: number;
  retry_tolerance: number;
  increasing_threshold: number;
  points: [number, number][];
  horizontal_move_z: number;
  adaptive_horizontal_move_z: boolean;
  min_horizontal_move_z: number;
  speed: number;
  use_probe_xy_offsets: boolean;
  enforce_lift_speed: boolean;
  averaging_len: number;
  autodetect_delta: number;
  z_offsets?: string;
  extra_points?: string;
}

export interface KlipperPrinterBeaconSettings extends Record<string, unknown> {
}

export interface KlipperPrinterCartographerScannerSettings extends Record<string, unknown> {
}

export interface KlipperPrinterBeaconModelSettings extends Record<string, unknown> {
}

export interface KlipperPrinterAfcSettings {
  varfile: string;
  long_moves_speed: number;
  rev_long_moves_speed_factor: number;
  long_moves_accel: number;
  short_moves_speed: number;
  quiet_moves_speed: number;
  short_moves_accel: number;
  short_move_dis: number;
  max_move_dis: number;
  show_quiet_mode: boolean;
  global_print_current: number;
  enable_sensors_in_gui: boolean;
  default_material_temps: string[];
  default_material_type: string;
  common_density_values: string[];
  load_to_hub: boolean;
  moonraker_port: number;
  moonraker_host: string;
  moonraker_timeout: number;
  assisted_unload: boolean;
  pause_when_bypass_active: boolean;
  debug: boolean;
  trsync_update: boolean;
  trsync_timeout: number;
  trsync_single_timeout: number;
  z_hop: number;
  resume_speed: number;
  resume_z_speed: number;
  led_name: string;
  led_fault: string;
  led_ready: string;
  led_not_ready: string;
  led_loading: string;
  led_tool_loaded: string;
  led_buffer_advancing: string;
  led_buffer_trailing: string;
  led_buffer_disable: string;
  led_spool_illuminate: string;
  n20_break_delay_time: number;
  tool_max_unload_attempts: number;
  tool_homing_distance: number;
  tool_max_load_checks: number;
  unload_on_runout: boolean;
  print_short_stats: boolean;
  show_macros: boolean;
  error_timeout: number;
  auto_home: boolean;
  auto_level_macro?: string;
  enable_assist: boolean;
  enable_assist_weight: number;
  debounce_delay: number;
  test_extrude_amt: number;
  capture_td1_when_loaded: boolean;
  disable_weight_check: boolean;
  tool_cut: boolean;
  tool_cut_cmd: string;
  tool_cut_threshold: number;
  park: boolean;
  park_cmd: string;
  poop: boolean;
  poop_cmd: string;
  kick: boolean;
  kick_cmd: string;
  wipe: boolean;
  wipe_cmd: string;
  form_tip: boolean;
  form_tip_cmd: string;
}

export interface KlipperPrinterAfcPrepSettings {
  enable: boolean;
  delay_time: number;
  disable_unload_filament_remapping: boolean;
  capture_td1_data: boolean;
}

export interface KlipperPrinterAfcFormTipSettings {
  ramming_volume: number;
  toolchange_temp: number;
  unloading_speed_start: number;
  unloading_speed: number;
  cooling_tube_position: number;
  cooling_tube_length: number;
  initial_cooling_speed: number;
  final_cooling_speed: number;
  cooling_moves: number;
  use_skinnydip: boolean;
  skinnydip_distance: number;
  dip_insertion_speed: number;
  dip_extraction_speed: number;
  melt_zone_pause: number;
  cooling_zone_pause: number;
}

export interface KlipperPrinterAfcExtruderSettings {
  pin_tool_start: string | null;
  pin_tool_end: string | null;
  tool_stn: number;
  tool_stn_unload: number;
  tool_sensor_after_extruder: number;
  tool_unload_speed: number;
  tool_load_speed?: number;
  buffer: string | null;
  enable_sensors_in_gui: boolean;
  debounce_delay: number;
}

export interface KlipperPrinterAfcBufferSettings {
  advance_pin: string;
  trailing_pin: string;
  multiplier_high: number;
  multiplier_low: number;
  led_index: string;
  accel: number;
}

export interface KlipperPrinterAfcLedSettings {
  pin: string;
  chain_count: number;
  color_order: string[];
  initial_red: number;
  initial_green: number;
  initial_blue: number;
  initial_white: number;
}

export interface KlipperPrinterAfcLaneSettings {
  unit: string;
  step_pin: string;
  dir_pin: string;
  enable_pin: string;
  microsteps: number;
  rotation_distance: number;
  gear_ratio?: [number, number][];
  map?: string | null;
  dist_hub: number;
  park_dist: number;
  led_index: string;
  afc_motor_rwd: string;
  afc_motor_fwd: string;
  afc_motor_enb: string;
  rwd_speed_multiplier: number;
  fwd_speed_multiplier: number;
  pwm: boolean;
  prep: string;
  load: string;
  led_fault: string;
  led_ready: string;
  led_not_ready: string;
  led_loading: string;
  led_unloading: string;
  led_tool_loaded: string;
  led_spool_index: string;
  led_spool_illuminate: string;
  long_moves_speed: number;
  rev_long_moves_speed_factor: number;
  long_moves_accel: number;
  quiet_moves_speed: number;
  short_moves_speed: number;
  short_moves_accel: number;
  short_move_dis: number;
  max_move_dis: number;
  n20_break_delay_time: number;
  enable_assist: boolean;
  enable_assist_weight: number;
  timer_delay: number;
  enable_kick_start: boolean;
  kick_start_time: number;
  delta_movement: number;
  mm_movement: number;
  cycles_per_rotation: number;
  pwm_value: number;
  spoolrate: number;
  load_to_hub: boolean;
  enable_sensors_in_gui: boolean;
  sensor_to_show?: string;
  assisted_unload: boolean;
  filament_diameter: number;
  filament_density: number;
  spool_inner_diameter: number;
  spool_outer_diameter: number;
  empty_spool_weight: number;
  spool_weight: number;
  assist_max_motor_rpm: number;
  hub?: string;
  buffer?: string;
  extruder?: string | null;
  debounce_delay: number;
  capture_td1_when_loaded: boolean;
  td1_device_id?: string;
}

export interface KlipperPrinterAfcStepperSettings extends KlipperPrinterAfcLaneSettings {
  print_current: number;
}

export interface KlipperPrinterAfcHubSettings {
  switch_pin: string;
  hub_clear_move_dis: number;
  afc_bowden_length: number;
  afc_unload_bowden_length: number;
  td1_bowden_length: number;
  assisted_retract: boolean;
  move_dis: number;
  cut: boolean;
  cut_cmd: string;
  cut_servo_name: string;
  cut_dist: number;
  cut_clear: number;
  cut_min_length: number;
  cut_servo_pass_angle: number;
  cut_servo_clip_angle: number;
  cut_servo_prep_angle: number;
  cut_confirm: boolean;
  enable_sensors_in_gui: boolean;
  debounce_delay: number;
}

export interface KlipperPrinterAfcButtonSettings {
  pin: string;
  long_press_duration: number;
}

// Custom classes start here

export interface KnownExtruder {
  name: string;
  key: ExtruderKey;
}

export interface Extruder extends KlipperPrinterExtruderState {
  key: string;
  config: KlipperPrinterExtruderSettings;
  min_extrude_temp: number;
  disconnected: boolean;
}

type StepperType<T> = {
  config?: T;
  name: string;
  prettyName: string;
  key: string;
  enabled?: boolean;
  disconnected: boolean;
}

export interface ExtruderStepper extends StepperType<KlipperPrinterExtruderStepperSettings> {
  motion_queue?: ExtruderKey | null;
  pressure_advance?: number;
  smooth_time?: number;
}

export interface Stepper extends StepperType<KlipperPrinterExtruderSettings | KlipperPrinterExtruderStepperSettings | KlipperPrinterStepperSettings> {
}

export interface MCU extends KlipperPrinterMcuState {
  name: string;
  prettyName: string;
  key: string;
  config?: KlipperPrinterMcuSettings;
}

type OutputType<TConfig extends TSHelpers.ValueTypesOf<KlipperPrinterSettingsBaseType>, TState extends TSHelpers.ValueTypesOf<KlipperPrinterStateBaseType>> = TState & {
  config?: TConfig;
  name: string;
  prettyName: string;
  key: string;
  color?: string;
  type: string;
  disconnected: boolean;
}

export type Heater = (
  OutputType<KlipperPrinterHeaterGenericSettings, KlipperPrinterHeaterGenericState> |
  OutputType<KlipperPrinterHeaterBedSettings, KlipperPrinterHeaterBedState> |
  OutputType<KlipperPrinterExtruderSettings, KlipperPrinterExtruderState>
) & {
  minTemp: number;
  maxTemp: number;
}

export type Fan = (
  OutputType<KlipperPrinterFanSettings, KlipperPrinterFanState> |
  OutputType<KlipperPrinterControllerFanSettings, KlipperPrinterFanState> |
  OutputType<KlipperPrinterHeaterFanSettings, KlipperPrinterFanState> |
  OutputType<KlipperPrinterFanSettings, KlipperPrinterTemperatureFanState>
) & {
  controllable: boolean;
  minTemp?: number;
  maxTemp?: number;
}

export type Led = OutputType<KlipperPrinterLedSettings, KlipperPrinterLedState> & {
  controllable: boolean;
}

export type OutputPin = OutputType<KlipperPrinterOutputPinSettings, KlipperPrinterOutputPinState> & {
  controllable: boolean;
  pwm: boolean;
  scale: number;
  resetValue: number;
}

export interface Sensor extends Partial<KlipperPrinterTemperatureSensorState>, Partial<KlipperPrinterTemperatureSensor2State>, Partial<KlipperPrinterZThermalAdjustState> {
  name: string;
  prettyName: string;
  key: string;
  color?: string;
  type: string;
  maxTemp?: number;
  minTemp?: number;
  disconnected: boolean;
}

export interface RunoutSensor extends Partial<KlipperPrinterFilamentSwitchSensorState>, Partial<KlipperPrinterFilamentMotionSensorState> {
  name: string;
  prettyName: string;
}

export interface Endstop {
  name: string;
  prettyName: string;
  state: number;
}

export interface Probe extends KlipperPrinterProbeState {
  name: string;
  prettyName: string;
}

export interface BedScrews extends Partial<KlipperPrinterBedScrewsState> {
  screws: BedScrewsScrew[];
}

export interface BedScrewsScrew {
  key: string;
  name: string;
  prettyName: string;
  x: number;
  y: number;
}

export interface ScrewsTiltAdjust extends Partial<Omit<KlipperPrinterScrewsTiltAdjustState, 'results'>> {
  screws: ScrewsTiltAdjustScrew[]
}

export interface ScrewsTiltAdjustScrew {
  key: string;
  name: string;
  prettyName: string;
  adjustMinutes: number;
  relativeZ?: number;
  x: number;
  y: number;
  z: number;
  sign: 'CW' | 'CCW';
  adjust: string;
  is_base: boolean;
}

export interface BedSize {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface GcodeCommands extends Record<string, GcodeCommand> {
}

export interface GcodeCommand {
  help?: string
}

export interface TimeEstimates {
  progress: number;
  printDuration: number;
  totalDuration: number;
  fileLeft: number;
  slicerLeft: number;
  actualLeft: number;
  eta: number;
}

export interface BeaconModel {
  name: string;
  active: boolean;
}

export type SupportedKlipperServices = keyof typeof Globals.SUPPORTED_SERVICES.KLIPPER

export interface KlippyApp {
  name: SupportedKlipperServices;
  isKalico: boolean;
  isKalicoOrDangerKlipper: boolean;
  domain: string;
  minVersion: string;
}

export interface ExcludeObjectPart extends KlipperPrinterExcludeObjectObjectState {
  isExcluded: boolean;
  isCurrent: boolean;
}
