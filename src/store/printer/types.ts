import type { Globals } from '@/globals'

export interface PrinterState {
  info: PrinterInfo;
  endstops: Record<string, 'TRIGGERED' | 'open'>
  manualProbeDialogOpen: boolean;
  bedScrewsAdjustDialogOpen: boolean;
  screwsTiltAdjustDialogOpen: boolean;
  forceMoveEnabled: boolean;
  printer: KlipperPrinterState;
}

export interface PrinterInfo {
  state: string;
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

export interface KlipperPrinterState {
  [key: string]: any;

  // These keys are always available

  objects: string[];

  configfile: KlipperPrinterConfigFileState;

  gcode_move: KlipperPrinterGcodeMoveState;

  idle_timeout: KlipperPrinterIdleTimeoutState;

  system_stats: KlipperPrinterSystemStatsState;

  toolhead: KlipperPrinterToolheadState;

  webhooks: KlipperPrinterWebhookState;

  // These keys might not be available (hence the ?)

  [key: `angle ${string}`]: KlipperPrinterAngleState;

  bed_mesh?: KlipperPrinterBedMeshState;

  bed_screws?: KlipperPrinterBedScrewsState;

  display_status?: KlipperPrinterDisplayStatusState;

  endstop_phase?: KlipperPrinterEndstopPhaseState;

  exclude_object?: KlipperPrinterExcludeObjectState;

  [key: `extruder_stepper ${string}`]: KlipperPrinterExtruderStepperState;

  fan?: KlipperPrinterFanState;

  [key: `${'heater_fan' | 'controller_fan'} ${string}`]: KlipperPrinterFanState;

  [key: `filament_switch_sensor ${string}`]: KlipperPrinterFilamentSwitchSensorState;

  [key: `filament_motion_sensor ${string}`]: KlipperPrinterFilamentMotionSensorState;

  firmware_retraction?: KlipperPrinterFirmwareRetractionState;

  gcode?: KlipperPrinterGcodeState;

  [key: `gcode_button ${string}`]: KlipperPrinterGcodeButtonState;

  [key: `gcode_macro ${string}`]: KlipperPrinterGcodeMacroState;

  hall_filament_width_sensor?: KlipperPrinterHallFilamentWidthSensorState;

  extruder?: KlipperPrinterExtruderState;

  [key: `extruder${number}`]: KlipperPrinterExtruderState;

  heater_bed?: KlipperPrinterHeaterBedState;

  [key: `heater_generic ${string}`]: KlipperPrinterHeaterGenericState;

  heaters?: KlipperPrinterHeatersState;

  [key: `${'led' | 'neopixel' | 'dotstar' | 'pca9533' | 'pca9632'} ${string}`]: KlipperPrinterLedState;

  manual_probe?: KlipperPrinterManualProbeState;

  menu?: KlipperPrinterMenuState;

  mcu?: KlipperPrinterMcuState;

  [key: `mcu ${string}`]: KlipperPrinterMcuState;

  motion_report?: KlipperPrinterMotionReportState;

  [key: `${'output_pin' | 'pwm_tool'} ${string}`]: KlipperPrinterOutputPinState;

  pause_resume?: KlipperPrinterPauseResumeState;

  print_stats?: KlipperPrinterPrintStatsState;

  probe?: KlipperPrinterProbeState;

  bltouch?: KlipperPrinterProbeState;

  [key: `pwm_cycle_time ${string}`]: KlipperPrinterPwmCycleTimeState;

  quad_gantry_level?: KlipperPrinterQuadGantryLevelState;

  query_endstops?: KlipperPrinterQueryEndstopsState;

  screws_tilt_adjust?: KlipperPrinterScrewsTiltAdjustState;

  [key: `servo ${string}`]: KlipperPrinterServoState;

  stepper_enable?: KlipperPrinterStepperEnableState;

  [key: `${'aht10' | 'bme280' | 'htu21d' | 'sht3x' | 'lm75' | 'temperature_host' | 'temperature_combined'} ${string}`]: KlipperPrinterTemperatureSensor2State;

  [key: `temperature_fan ${string}`]: KlipperPrinterTemperatureFanState;

  [key: `temperature_sensor ${string}`]: KlipperPrinterTemperatureSensorState;

  [key: `tmc${'2130' | '2208' | '2209' | '2660' | '2240' | '5160'} ${string}`]: KlipperPrinterTmcState;

  dual_carriage?: KlipperDualCarriageState;

  virtual_sdcard?: KlipperPrinterVirtualSdcardState;

  z_thermal_adjust?: KlipperPrinterZThermalAdjustState;

  z_tilt?: KlipperPrinterZTiltState;

  // These keys are for external modules

  [key: `belay ${string}`]: KlipperPrinterBelayState;

  dockable_probe?: KlipperPrinterDockableProbeState;

  mixing_extruder?: KlipperPrinterMixingExtruderState;

  tools_calibrate?: KlipperPrinterToolsCalibrateState;

  trad_rack?: KlipperPrinterTradRackState;

  beacon?: KlipperPrinterBeaconState;
}

export interface KlipperPrinterConfigFileState {
  config: KlipperPrinterConfig;
  settings: KlipperPrinterSettings;
  warnings: {
    type: string;
    message: string;
  }[];
  save_config_pending?: boolean;
  save_config_pending_items?: KlipperPrinterConfig | null;
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
  state: string;
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
  extruder: string;
  position: [number, number, number, number];
  max_velocity: number;
  max_accel: number;
  max_accel_to_decel?: number | null;
  minimum_cruise_ratio?: number | null;
  square_corner_velocity: number;
  cone_start_z?: number;
}

export interface KlipperPrinterWebhookState {
  state: string;
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
  profiles?: Record<string, KlipperPrinterBedMeshProfileState>;
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
  motion_queue?: string | null;
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
  available_heaters: string[];
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
  last_stats?: Record<string, string | number>;
  app?: string;
  non_critical_disconnected?: boolean;
}

export interface KlipperPrinterMotionReportState {
  live_position: [number, number, number, number];
  live_velocity: number;
  live_extruder_velocity: number;
  steppers?: string[];
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
  state: string;
  message: string;
  info?: {
    total_layer: number | null;
    current_layer: number | null;
  }
}

export interface KlipperPrinterProbeState {
  name?: string;
  last_query: boolean;
  last_z_result: number;
}

export interface KlipperPrinterPwmCycleTimeState {
  value: number;
}

export interface KlipperPrinterQuadGantryLevelState {
  applied: boolean;
}

export interface KlipperPrinterQueryEndstopsState {
  last_query: Record<string, boolean>;
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

export interface KlipperPrinterStepperEnableState {
  steppers: Record<string, boolean>;
}

export interface KlipperPrinterTemperatureSensor2State {
  temperature: number;
  humidity?: number;
  pressure?: number;
  gas?: number;
}

export interface KlipperPrinterTemperatureFanState {
  temperature: number;
  target: number;
}

export interface KlipperPrinterTemperatureSensorState {
  temperature: number;
  measured_min_temp: number;
  measured_max_temp: number;
}

export interface KlipperPrinterTmcState {
  mcu_phase_offset: number;
  phase_offset_position: number;
  run_current: number;
  hold_current: number;
  drv_status: number | null;
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

export interface KlipperPrinterBelayState {
  last_state: boolean;
  enabled: boolean;
}

export interface KlipperPrinterDockableProbeState {
  last_status: 'UNKNOWN' | 'ATTACHED' | 'DOCKED'
}

export interface KlipperPrinterMixingExtruderState {
  mixing: string;
  ticks: string;
}

export interface KlipperPrinterToolsCalibrateState {
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

export interface KlipperPrinterTradRackState {
  curr_lane: number | null;
  active_lane: number | null;
  next_lane: number | null;
  next_tool: number | null;
  tool_map: any[];
  selector_homed: boolean;
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

export interface KlipperPrinterConfig extends Record<string, Record<string, string>> {
}

export interface KlipperPrinterSettings {
  [key: string]: any;

  mcu?: KlipperPrinterMcuSettings;

  [key: `mcu ${string}`]: KlipperPrinterMcuSettings;

  [key: `tmc${'2130' | '2208' | '2209' | '2660' | '2240' | '5160'} ${string}`]: KlipperPrinterTmcSettings;

  fan?: KlipperPrinterFanSettings;

  [key: `${'heater_fan'} ${string}`]: KlipperPrinterHeaterFanSettings;

  [key: `${'controller_fan'} ${string}`]: KlipperPrinterControllerFanSettings;

  [key: `output_pin ${string}`]: KlipperPrinterOutputPinSettings;

  [key: `${'led' | 'neopixel' | 'dotstar' | 'pca9533' | 'pca9632'} ${string}`]: KlipperPrinterLedSettings;

  [key: `temperature_sensor ${string}`]: KlipperPrinterTemperatureSensorSettings;

  safe_z_home?: KlipperPrinterSafeZHomeSettings;

  z_tilt?: KlipperPrinterZTiltSettings;

  bed_mesh?: KlipperPrinterBedMeshSettings;

  board_pins?: KlipperPrinterBoardPinsSettings;

  [key: `bed_mesh ${string}`]: KlipperPrinterBedMeshModelSettings;

  bed_screws?: KlipperPrinterBedScrewsSettings;

  screws_tilt_adjust?: KlipperPrinterScrewsTiltAdjustSettings;

  firmware_retraction?: KlipperPrinterFirmwareRetractionSettings;

  force_move?: KlipperPrinterForceMoveSettings;

  gcode_arcs?: KlipperPrinterGcodeArcsSettings;

  respond?: KlipperPrinterRespondSettings;

  virtual_sdcard?: KlipperPrinterVirtualSdcardSettings;

  pause_resume?: KlipperPrinterPauseResumeSettings;

  delta_calibrate?: KlipperPrinterDeltaCalibrateSettings;

  [key: `gcode_macro ${string}`]: KlipperPrinterGcodeMacroSettings;

  heater_bed?: KlipperPrinterHeaterBedSettings;

  [key: `verify_heater ${string}`]: KlipperPrinterVerifyHeaterSettings;

  probe?: KlipperPrinterProbeSettings;

  bltouch?: KlipperPrinterProbeSettings;

  input_shaper?: KlipperPrinterInputShaperSettings;

  printer?: KlipperPrinterPrinterSettings;

  [key: `stepper_${string}`]: KlipperPrinterStepperSettings;

  [key: `extruder_stepper ${string}`]: KlipperPrinterExtruderStepperSettings;

  idle_timeout?: KlipperPrinterIdleTimeoutSettings;

  extruder?: KlipperPrinterExtruderSettings;

  [key: `extruder${number}`]: KlipperPrinterExtruderSettings;

  exclude_object?: KlipperPrinterExcludeObjectSettings;

  [key: `endstop_phase ${string}`]: KlipperPrinterEndstopPhaseSettings;

  [key: `display_template ${string}`]: KlipperPrinterDisplayTemplateSettings;

  // These keys are for external modules

  beacon?: KlipperPrinterBeaconSettings;

  [key: `beacon model ${string}`]: KlipperPrinterBeaconModelSettings;
}

export interface KlipperPrinterMcuSettings {
  serial: string;
  baud?: number;
  restart_method?: string;
  max_stepper_error: number;
  is_non_critical?: boolean;
  reconnect_interval?: number;
}

export interface KlipperPrinterTmcSettings {
  cs_pin: string;
  spi_speed: number;
  spi_bus: string;
  rref: number;
  run_current: number;
  hold_current: number;
  interpolate: boolean;
  [key: `driver_${string}`]: number | boolean;
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

export interface KlipperPrinterTemperatureSensorSettings {
  sensor_type: string;
  pullup_resistor?: number;
  inline_resistor?: number;
  sensor_mcu?: string;
  i2c_mcu?: string;
  i2c_speed?: number;
  i2c_address?: number;
  i2c_bus?: string;
  min_temp: number;
  max_temp: number;
  gcode_id?: string;
}

export interface KlipperPrinterSafeZHomeSettings {
  home_xy_position: [number, number]
  z_hop: number;
  z_hop_speed: number;
  speed: number;
  move_to_previous: boolean;
}

export interface KlipperPrinterZTiltSettings {
  z_positions: [number, number][];
  retries: number;
  retry_tolerance: number;
  points: [number, number][];
  horizontal_move_z: number;
  speed: number;
}

export interface KlipperPrinterBedMeshSettings {
  adaptive_margin?: number;
  probe_count: [number, number];
  mesh_min: [number, number];
  mesh_max: [number, number];
  mesh_pps: [number, number];
  algorithm: string;
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
  [key: `screw${number}`]: [number, number];
  [key: `screw${number}_name`]: string;
  [key: `screw${number}_fine_adjust`]: [number, number];
  speed: number;
  probe_speed: number;
  horizontal_move_z: number;
  probe_height: number;
}

export interface KlipperPrinterScrewsTiltAdjustSettings {
  [key: `screw${number}`]: [number, number];
  [key: `screw${number}_name`]: string;
  screw_thread: string;
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
  [key: `variable_${string}`]: string;
}

export interface KlipperPrinterHeaterBedSettings {
  sensor_type: string;
  pullup_resistor: number;
  inline_resistor: number;
  sensor_pin: string;
  min_temp: number;
  max_temp: number;
  min_extrude_temp: number;
  max_power: number;
  smooth_time: number;
  control: string;
  max_delta?: number;
  pid_kp: number;
  pid_ki: number;
  pid_kd: number;
  heater_pin: string;
  pwm_cycle_time: number;
  pid_version?: number;
}

export interface KlipperPrinterVerifyHeaterSettings {
  hysteresis: number;
  max_error: number;
  heating_gain: number;
  check_gain_time: number;
}

export interface KlipperPrinterProbeSettings {
  z_offset: number;
  deactivate_on_each_sample: boolean;
  activate_gcode: string;
  deactivate_gcode: string;
  pin: string;
  x_offset: number;
  y_offset: number;
  speed: number;
  lift_speed: number;
  samples: number;
  sample_retract_dist: number;
  samples_result: string;
  samples_tolerance: number;
  samples_tolerance_retries: number;
}

export interface KlipperPrinterInputShaperSettings {
  shaper_type: string;
  shaper_type_x: string;
  damping_ratio_x: number;
  shaper_freq_x: number;
  shaper_type_y: string;
  damping_ratio_y: number;
  shaper_freq_y: number;
}

export interface KlipperPrinterPrinterSettings {
  kinematics: string;
  max_velocity: number;
  max_accel: number;
  minimum_cruise_ratio?: number;
  square_corner_velocity?: number;
  max_z_velocity?: number;
  max_z_accel?: number;
  delta_radius?: number;
  max_accel_to_decel?: number;
}

export interface KlipperPrinterStepperSettings {
  step_pin: string;
  dir_pin: string;
  rotation_distance: number;
  microsteps: number;
  full_steps_per_rotation: number;
  gear_ratio: [number, number][];
  enable_pin: string;
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

export interface KlipperPrinterExtruderStepperSettings {
  pressure_advance: number;
  pressure_advance_smooth_time: number;
  step_pin: string;
  dir_pin: string;
  rotation_distance: number;
  microsteps: number;
  full_steps_per_rotation: number;
  gear_ratio: [number, number][];
  enable_pin: string;
  extruder?: string | null;
}

export interface KlipperPrinterIdleTimeoutSettings {
  timeout: number;
  gcode: string;
}

export interface KlipperPrinterExtruderSettings {
  sensor_type: string;
  pullup_resistor: number;
  inline_resistor: number;
  sensor_pin: string;
  min_temp: number;
  max_temp: number;
  min_extrude_temp: number;
  max_power: number;
  smooth_time: number;
  control: string;
  max_delta?: number;
  pid_kp?: number;
  pid_ki?: number;
  pid_kd?: number;
  heater_pin: string;
  pwm_cycle_time: number;
  nozzle_diameter: number;
  filament_diameter: number;
  max_extrude_cross_section: number;
  max_extrude_only_velocity: number;
  max_extrude_only_accel: number;
  max_extrude_only_distance: number;
  instantaneous_corner_velocity: number;
  step_pin: string;
  pressure_advance: number;
  pressure_advance_smooth_time: number;
  dir_pin: string;
  rotation_distance: number;
  microsteps: number;
  full_steps_per_rotation: number;
  gear_ratio: [number, number][];
  enable_pin: string;
  pid_version?: number;
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

export interface KlipperPrinterBeaconSettings extends Record<string, any> {
}

export interface KlipperPrinterBeaconModelSettings extends Record<string, any> {
}

// Custom classes start here

export interface KnownExtruder {
  name: string;
  key: 'extruder' | `extruder${number}`;
}

export interface Extruder extends KlipperPrinterExtruderState {
  config: KlipperPrinterExtruderSettings;
  min_extrude_temp: number;
}

export interface ExtruderStepper extends StepperType<ExtruderStepperConfig> {
  motion_queue?: string | null;
  pressure_advance?: number;
  smooth_time?: number;
}

export interface ExtruderStepperConfig {
  extruder?: string;
  pressure_advance?: number;
  pressure_advance_smooth_time?: number;
}

export interface Stepper extends StepperType {
}

export type StepperType<T = Record<string, any>> = {
  config: T;
  name: string;
  prettyName: string;
  key: string;
  enabled?: boolean;
}

export interface MCU extends KlipperPrinterMcuState {
  name: string;
  prettyName: string;
  config: KlipperPrinterMcuSettings;
}

export type OutputType<T = Record<string, any>> = {
  config: T
  name: string;
  prettyName: string;
  key: string;
  color?: string;
  type: string;
}
export interface Heater extends OutputType {
  temperature: number;
  target: number;
  power: number;
  minTemp: number;
  maxTemp: number;
}

export interface Fan extends OutputType<FanConfig> {
  controllable: boolean;
  speed?: number;
  rpm?: number | null;
  temperature?: number;
  target?: number;
  minTemp?: number;
  maxTemp?: number;
}

export interface FanConfig {
  [key: string]: string | number | undefined;
  pin: string;
  max_power: number;
  off_below: number;
}

export interface Led extends OutputType {
  color?: string;
  color_data: number[][]
}

export interface OutputPin extends OutputType<OutputPinConfig> {
  controllable: boolean;
  pwm: boolean;
  scale: number;
  static: number;
  value: number;
  resetValue: number;
}

export interface OutputPinConfig {
  [index: string]: string | number | boolean | undefined;
  pwm?: boolean;
  static_value?: number;
  value?: number;
  shutdown_value?: number;
  cycle_time?: number;
  hardware_pwm?: boolean;
  scale?: number;
}

export interface Sensor {
  name: string;
  prettyName: string;
  key: string;
  color?: string;
  type: string;
  temperature: number;
  pressure?: number;
  humidity?: number;
  gas?: number;
  target?: number;
  measured_min_temp?: number;
  measured_max_temp?: number;
  maxTemp?: number;
  minTemp?: number;
}

export interface RunoutSensor {
  name: string;
  enabled: boolean;
  filament_detected: boolean;
}

export interface Endstop {
  name: string;
  state: 'TRIGGERED' | 'open';
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
