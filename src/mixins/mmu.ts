import Vue from 'vue'
import Component from 'vue-class-component'
import type { Spool } from '@/store/spoolman/types'
import type { AppFileWithMeta } from '@/store/files/types'
import type { MmuGateDetails, SlicerToolDetails, MmuUnitDetails } from '@/types'
import { TinyColor } from '@ctrl/tinycolor'

@Component({})
export default class MmuMixin extends Vue {
  get mmuState (): Klipper.MmuState | undefined {
    return this.$typedState.printer.printer.mmu
  }

  get hasMmu (): boolean {
    return this.mmuState != null
  }

  get hasEncoder (): boolean {
    return this.mmuState?.encoder != null
  }

  /*
     * Select encoder properties
     */
  get encoderPos (): number {
    return Math.round(this.mmuState?.encoder?.encoder_pos ?? 0)
  }

  get encoderEnabled (): boolean {
    return this.mmuState?.encoder?.enabled ?? false
  }

  get encoderDesiredHeadroom (): number {
    return this.mmuState?.encoder?.desired_headroom ?? 0
  }

  get encoderDetectionLength (): number {
    return this.mmuState?.encoder?.detection_length ?? 0
  }

  get encoderDetectionMode (): number {
    return this.mmuState?.encoder?.detection_mode ?? 0
  }

  get encoderFlowRate (): number {
    return this.mmuState?.encoder?.flow_rate ?? 0
  }

  /*
     * All Happy Hare mmu_machine printer variables
     */
  get numUnits (): number {
    return this.$typedState.printer.printer.mmu_machine?.num_units ?? 1
  }

  unitDetails (unitIndex: number): MmuUnitDetails {
    const unitRef = `unit_${unitIndex}` as Klipper.MmuUnitKey

    const mmuMachine = this.$typedState.printer.printer.mmu_machine

    return {
      name: mmuMachine?.[unitRef]?.name ?? 'Unit',
      vendor: mmuMachine?.[unitRef]?.vendor ?? 'Other',
      version: mmuMachine?.[unitRef]?.version ?? '1.0',
      numGates: mmuMachine?.[unitRef]?.num_gates ?? 1,
      firstGate: mmuMachine?.[unitRef]?.first_gate ?? 0,
      selectorType: mmuMachine?.[unitRef]?.selector_type ?? 'VirtualSelector',
      variableRotationDistances: mmuMachine?.[unitRef]?.variable_rotation_distances ?? true,
      variableBowdenLengths: mmuMachine?.[unitRef]?.variable_bowden_lengths ?? true,
      requireBowdenMove: mmuMachine?.[unitRef]?.require_bowden_move ?? true,
      filamentAlwaysGripped: mmuMachine?.[unitRef]?.filament_always_gripped ?? false,
      hasBypass: mmuMachine?.[unitRef]?.has_bypass ?? false,
      multiGear: mmuMachine?.[unitRef]?.multi_gear ?? false,
      environmentSensor: mmuMachine?.[unitRef]?.environment_sensor ?? ''
    }
  }

  /*
     * All Happy Hare mmu printer variables
     */
  get enabled (): boolean {
    return this.mmuState?.enabled ?? false
  }

  get numGates (): number {
    return this.mmuState?.num_gates ?? 0
  }

  get printState (): string {
    return this.mmuState?.print_state ?? 'ready'
  }

  get isPrinting (): boolean {
    return ['started', 'printing'].includes(this.printState)
  }

  get isInPrint (): boolean {
    return ['printing', 'pause_locked', 'paused'].includes(this.printState)
  }

  get isMmuPaused (): boolean {
    return this.mmuState?.is_paused ?? false
    return ['pause_locked', 'paused'].includes(this.printState)
  }

  get isMmuPausedAndLocked (): boolean {
    return ['pause_locked'].includes(this.printState)
  }

  get isHomed (): boolean {
    return this.mmuState?.is_homed ?? false
  }

  get unit (): number {
    return this.mmuState?.unit ?? this.UNIT_UNKNOWN
  }

  readonly UNIT_UNKNOWN: number = -1

  get gate (): number {
    return this.mmuState?.gate ?? this.TOOL_GATE_UNKNOWN
  }

  get tool (): number {
    return this.mmuState?.tool ?? this.TOOL_GATE_UNKNOWN
  }

  readonly TOOL_GATE_UNKNOWN: number = -1
  readonly TOOL_GATE_BYPASS: number = -2

  get numToolchanges (): number {
    return this.mmuState?.num_toolchanges ?? 0
  }

  get lastTool (): number {
    return this.mmuState?.last_tool ?? this.TOOL_GATE_UNKNOWN
  }

  get nextTool (): number {
    return this.mmuState?.next_tool ?? this.TOOL_GATE_UNKNOWN
  }

  get toolchangePurgeVolue (): number {
    return this.mmuState?.toolchange_purge_volume ?? 0
  }

  get lastToolchange (): string {
    return this.mmuState?.last_toolchange ?? ''
  }

  get operation (): string {
    return this.mmuState?.operation ?? ''
  }

  get filament (): string {
    return this.mmuState?.filament ?? ''
  }

  get filamentPosition (): string {
    return (this.mmuState?.filament_position ?? 0).toFixed(1)
  }

  get filamentPos (): number {
    return this.mmuState?.filament_pos ?? this.FILAMENT_POS_UNKNOWN
  }

  readonly FILAMENT_POS_UNKNOWN: number = -1
  readonly FILAMENT_POS_UNLOADED: number = 0 // Parked in gate
  readonly FILAMENT_POS_HOMED_GATE: number = 1 // Homed at either gate or gear sensor (currently assumed mutually exclusive sensors)
  readonly FILAMENT_POS_START_BOWDEN: number = 2 // Point of fast load portion
  readonly FILAMENT_POS_IN_BOWDEN: number = 3 // Some unknown position in the bowden
  readonly FILAMENT_POS_END_BOWDEN: number = 4 // End of fast load portion
  readonly FILAMENT_POS_HOMED_ENTRY: number = 5 // Homed at entry sensor
  readonly FILAMENT_POS_HOMED_EXTRUDER: number = 6 // Collision homing case at extruder gear entry
  readonly FILAMENT_POS_EXTRUDER_ENTRY: number = 7 // Past extruder gear entry
  readonly FILAMENT_POS_HOMED_TS: number = 8 // Homed at toolhead sensor
  readonly FILAMENT_POS_IN_EXTRUDER: number = 9 // In extruder past toolhead sensor
  readonly FILAMENT_POS_LOADED: number = 10 // Homed to nozzle

  get filamentDirection (): number {
    return this.mmuState?.filament_direction ?? this.DIRECTION_UNKNOWN
  }

  readonly DIRECTION_LOAD: number = 1
  readonly DIRECTION_UNKNOWN: number = 0
  readonly DIRECTION_UNLOAD: number = -1

  get bowdenProgress (): number {
    return this.mmuState?.bowden_progress ?? -1
  }

  get ttgMap (): number[] {
    return this.mmuState?.ttg_map ?? []
  }

  get endlessSpoolGroups (): number[] {
    return this.mmuState?.endless_spool_groups ?? []
  }

  get gateStatus (): number[] {
    return this.mmuState?.gate_status ?? []
  }

  readonly GATE_UNKNOWN: number = -1
  readonly GATE_EMPTY: number = 0
  readonly GATE_AVAILABLE: number = 1 // Available to load from either buffer or spool
  readonly GATE_AVAILABLE_FROM_BUFFER: number = 2

  get gateFilamentName (): string[] {
    return this.mmuState?.gate_filament_name ?? []
  }

  get gateMaterial (): string[] {
    return this.mmuState?.gate_material ?? []
  }

  get gateColor (): string[] {
    return this.mmuState?.gate_color ?? []
  }

  get gateTemperature (): number[] {
    return this.mmuState?.gate_temperature ?? []
  }

  get gateSpoolId (): number[] {
    return this.mmuState?.gate_spool_id ?? []
  }

  get gateSpeedOverride (): number[] {
    return this.mmuState?.gate_speed_override ?? []
  }

  get gateMap (): MmuGateDetails[] {
    return this.gateStatus.map((_, index) => this.gateDetails(index))
  }

  gateDetails (gateIndex: number): MmuGateDetails {
    const gd: MmuGateDetails = {
      index: -1,
      status: -1,
      filamentName: 'No active spool',
      material: 'Unknown',
      color: '',
      temperature: -1,
      spoolId: -1,
      speedOverride: 100,
      endlessSpoolGroup: null
    }

    if (gateIndex === this.TOOL_GATE_BYPASS) {
      gd.index = -2
      gd.status = -1

      if (this.gate === gateIndex) {
        const activeSpool = this.$typedGetters['spoolman/getActiveSpool']
        gd.filamentName = activeSpool?.filament?.name ?? 'No active spool'
        gd.material = activeSpool?.filament?.material ?? 'Unknown'
        gd.color = this.fromColorString(activeSpool?.filament?.color_hex ?? null)
        gd.temperature = activeSpool?.filament?.settings_extruder_temp ?? -1
        gd.spoolId = activeSpool?.id ?? -1
      } else {
        gd.filamentName = 'Unknown'
        gd.material = 'Unknown'
        gd.color = this.fromColorString(null)
        gd.temperature = -1
        gd.spoolId = -1
      }
      gd.speedOverride = 100
      gd.endlessSpoolGroup = null
    } else {
      gd.index = gateIndex
      gd.status = this.mmuState?.gate_status?.[gateIndex] ?? -1
      gd.filamentName = this.mmuState?.gate_filament_name?.[gateIndex] || 'Unknown'
      gd.material = this.mmuState?.gate_material?.[gateIndex] || 'Unknown'
      gd.color = this.fromColorString(this.mmuState?.gate_color[gateIndex] ?? '')
      gd.temperature = this.mmuState?.gate_temperature?.[gateIndex] ?? -1
      gd.spoolId = this.mmuState?.gate_spool_id?.[gateIndex] ?? -1
      gd.speedOverride = this.mmuState?.gate_speed_override?.[gateIndex] ?? 100
      gd.endlessSpoolGroup = this.mmuState?.endless_spool_groups?.[gateIndex] ?? gateIndex
    }
    return gd
  }

  spoolmanSpool (spoolId: number | null): Spool | undefined {
    if (spoolId != null) {
      return this.$typedGetters['spoolman/getSpoolById'](spoolId)
    }
  }

  // return this.mmuState.gate_color_rgb
  // return this.mmuState.slicer_color_rgb
  // return this.mmuState.tool_extrusion_multipliers
  // return this.mmuState.tool_speed_multipliers

  get slicerToolMap () {
    return this.mmuState?.slicer_tool_map
  }

  toolDetails (toolIndex: number, file?: AppFileWithMeta | null): SlicerToolDetails {
    const td: SlicerToolDetails = {
      color: '',
      material: 'Unknown',
      temp: -1,
      name: 'Unknown',
      inUse: false
    }

    // Have file so use metadata
    if (file) {
      // Different slicers use extruder/filament colors differently
      let c1, c2
      switch (file.slicer) {
        case 'OrcaSlicer':
        case 'BambuStudio':
          c1 = file.filament_colors ?? []
          c2 = file.extruder_colors ?? []
          break
        case 'SuperSlicer':
        default: // Assume PrusaSlicer
          c1 = file.extruder_colors ?? []
          c2 = file.filament_colors ?? []
          break
      }
      const colors = c1.length === 0 || c1.every((c: string) => c === '') ? c2 : c1
      td.color = colors.length > toolIndex ? this.fromColorString(colors[toolIndex]) : this.fromColorString('')
      const materials = file.filament_type ?? []
      td.material = materials.length > toolIndex ? materials[toolIndex] : 'Unknown'
      const temps = file.filament_temps ?? []
      td.temp = temps.length > toolIndex ? temps[toolIndex] : -1
      const names = file.filament_name ?? []
      td.name = names.length > toolIndex ? names[toolIndex] : 'Unknown'
      const referencedTools = file.referenced_tools ?? []
      td.inUse = referencedTools?.includes(toolIndex) ?? false
    } else {
      // Use Happy Hare's slicer_tool_map
      td.color = this.fromColorString(
        this.mmuState?.slicer_tool_map?.tools?.[toolIndex]?.color ?? ''
      )
      td.material = this.mmuState?.slicer_tool_map?.tools?.[toolIndex]?.material || 'Unknown'
      td.temp = this.mmuState?.slicer_tool_map?.tools?.[toolIndex]?.temp ?? -1
      td.name = this.mmuState?.slicer_tool_map?.tools?.[toolIndex]?.name || 'Unknown'
      td.inUse = this.mmuState?.slicer_tool_map?.tools?.[toolIndex]?.in_use || false
    }
    return td
  }

  get action (): string | undefined {
    return this.mmuState?.action
  }

  readonly ACTION_IDLE: string = 'Idle'
  readonly ACTION_LOADING: string = 'Loading'
  readonly ACTION_LOADING_EXTRUDER: string = 'Loading Ext'
  readonly ACTION_UNLOADING: string = 'Unloading'
  readonly ACTION_UNLOADING_EXTRUDER: string = 'Unloading Ext'
  readonly ACTION_FORMING_TIP: string = 'Forming Tip'
  readonly ACTION_CUTTING_TIP: string = 'Cutting Tip'
  readonly ACTION_HEATING: string = 'Heating'
  readonly ACTION_CHECKING: string = 'Checking'
  readonly ACTION_HOMING: string = 'Homing'
  readonly ACTION_SELECTING: string = 'Selecting'
  readonly ACTION_CUTTING_FILAMENT: string = 'Cutting Filament'
  readonly ACTION_PURGING: string = 'Purging'

  get hasBypass (): boolean {
    return this.mmuState?.has_bypass ?? false
  }

  get syncDrive (): boolean {
    return this.mmuState?.sync_drive ?? false
  }

  // return this.mmuState?.sync_feedback_state

  get syncFeedbackEnabled (): boolean {
    return this.mmuState?.sync_feedback_enabled ?? false
  }

  get clogDetectionEnabled (): boolean {
    return this.mmuState?.clog_detection_enabled !== 0
  }

  get endlessSpoolEnabled (): boolean {
    return this.mmuState?.endless_spool_enabled !== 0
  }

  get reasonForPause (): string {
    return this.mmuState?.reason_for_pause ?? ''
  }

  get extruderFilamentRemaining (): number {
    return this.mmuState?.extruder_filament_remaining ?? 0
  }

  get spoolmanSupport (): string {
    return this.mmuState?.spoolman_support ?? 'off'
  }

  readonly SPOOLMAN_OFF: string = 'off' // Spoolman disabled
  readonly SPOOLMAN_READONLY: string = 'readonly' // Get filament attributes only
  readonly SPOOLMAN_PUSH: string = 'push' // Local gatemap is the source or truth
  readonly SPOOLMAN_PULL: string = 'pull' // Spoolman db is the source of truth

  get sensors (): Record<string, boolean | null> {
    return this.mmuState?.sensors ?? {}
  }

  get espoolerActive (): string {
    return this.mmuState?.espooler_active ?? ''
  }

  readonly ESPOOLER_REWIND: string = 'rewind'
  readonly ESPOOLER_ASSIST: string = 'assist'

  /*
     * Optional printer variables based on selector type
     */
  get servo (): string {
    return this.mmuState?.servo ?? 'Unknown'
  }

  get grip (): string {
    return this.mmuState?.grip ?? 'Unknown'
  }

  /*
     * Selective Happy Hare configuration parameters
     */

  get configGateHomingEndstop (): string {
    // TODO ideally make dynamic because of MMU_TEST_CONFIG
    return this.$typedState.printer.printer.configfile.config.mmu?.gate_homing_endstop ?? 'encoder'
  }

  get configExtruderHomingEndstop (): string {
    // TODO ideally make dynamic because of MMU_TEST_CONFIG
    return this.$typedState.printer.printer.configfile.config.mmu?.extruder_homing_endstop ?? 'none'
  }

  get configExtruderForceHoming (): boolean {
    // TODO ideally make dynamic because of MMU_TEST_CONFIG
    return (this.$typedState.printer.printer.configfile.config.mmu?.extruder_force_homing ?? '0') === '1'
  }

  get configTMacroColor (): string {
    // TODO ideally make dynamic because of MMU_TEST_CONFIG
    return this.$typedState.printer.printer.configfile.config.mmu?.t_macro_color ?? 'slicer'
  }

  readonly T_MACRO_COLOR_OPTIONS: string[] = ['slicer', 'allgates', 'gatemap', 'off']

  get varsCalibrationBowdenLengths (): number[] {
    return this.$typedState.printer.printer.save_variables?.variables?.mmu_calibration_bowden_lengths
  }

  get varsFilamentRemaining (): string {
    return this.$typedState.printer.printer.save_variables?.variables?.mmu_state_filament_remaining ?? 0
  }

  get varsFilamentRemainingColor (): string {
    const color = this.$typedState.printer.printer.save_variables?.variables?.mmu_state_filament_remaining_color ?? ''
    if (color) return this.fromColorString(color)
    return color
  }

  get macroVarsLedEnable (): boolean {
    return this.$typedState.printer.printer['gcode_macro _MMU_LED_VARS']?.led_enable ?? false
  }

  get macroVarsLedAnimation (): boolean {
    return this.$typedState.printer.printer['gcode_macro _MMU_LED_VARS']?.led_animation ?? true
  }

  get macroVarsDefaultEntryEffect (): string {
    return this.$typedState.printer.printer['gcode_macro _MMU_LED_VARS']?.default_entry_effect ?? 'off'
  }

  get macroVarsDefaultExitEffect (): string {
    return this.$typedState.printer.printer['gcode_macro _MMU_LED_VARS']?.default_exit_effect ?? 'off'
  }

  get macroVarsDefaultStatusEffect (): string {
    return this.$typedState.printer.printer['gcode_macro _MMU_LED_VARS']?.default_status_effect ?? 'off'
  }

  readonly LED_OPTIONS: string[] = ['off', 'gate_status', 'filament_color', 'slicer_color']
  readonly LED_STATUS_OPTIONS: string[] = [...this.LED_OPTIONS, 'on']

  get macroVarsAutomapStrategy (): string {
    return this.$typedState.printer.printer['gcode_macro _MMU_SOFTWARE_VARS']?.automap_strategy ?? 'none'
  }

  readonly AUTOMAP_OPTIONS: string[] = ['none', 'filament_name', 'material', 'color', 'closest_color', 'spool_id']

  /*
     * Miscellaneous
     */

  gateText (gate: number): string {
    return gate === -1 ? '?' : gate === this.TOOL_GATE_BYPASS ? 'Bypass' : '@' + gate
  }

  toolText (tool: number): string {
    return tool === -1 ? 'T?' : tool === this.TOOL_GATE_BYPASS ? 'Bypass' : 'T' + tool
  }

  // Empty string if nothing to report
  get toolchangeText (): string {
    if (this.nextTool === this.TOOL_GATE_UNKNOWN) return ''
    const fromText =
            this.lastTool !== this.TOOL_GATE_UNKNOWN
              ? ` from ${this.lastTool === this.TOOL_GATE_BYPASS ? 'Bypass' : `T${this.lastTool}`}`
              : ''
    const toText = ` to ${this.nextTool === this.TOOL_GATE_BYPASS ? 'Bypass' : `T${this.nextTool}`}`
    return `Changing tool${fromText}${toText}`
  }

  get canSend (): boolean {
    const idleTimeout = this.$typedState.printer.printer.idle_timeout?.state
    return !['Printing'].includes(idleTimeout)
  }

  /*
     * Helper functions
     */

  // Fix Happy Hare color strings (# problematic in klipper CLI)
  readonly NO_FILAMENT_COLOR = '#808182E3'
  fromColorString (color: string | null): string {
    return color
      ? new TinyColor(color).toHex8String().toUpperCase()
      : this.NO_FILAMENT_COLOR
  }
}
