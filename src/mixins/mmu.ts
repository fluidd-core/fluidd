import Vue from 'vue'
import Component from 'vue-class-component'
import type { Spool } from '@/store/spoolman/types'
import type { AppFileWithMeta } from '@/store/files/types'
import type { MmuGateDetails, SlicerToolDetails, MmuUnitDetails } from '@/types'

export const W3C_COLORS: { name: string; hex: string }[] = [
  { name: 'aliceblue', hex: '#F0F8FF' },
  { name: 'antiquewhite', hex: '#FAEBD7' },
  { name: 'aqua', hex: '#00FFFF' },
  { name: 'aquamarine', hex: '#7FFFD4' },
  { name: 'azure', hex: '#F0FFFF' },
  { name: 'beige', hex: '#F5F5DC' },
  { name: 'bisque', hex: '#FFE4C4' },
  { name: 'black', hex: '#000000' },
  { name: 'blanchedalmond', hex: '#FFEBCD' },
  { name: 'blue', hex: '#0000FF' },
  { name: 'blueviolet', hex: '#8A2BE2' },
  { name: 'brown', hex: '#A52A2A' },
  { name: 'burlywood', hex: '#DEB887' },
  { name: 'cadetblue', hex: '#5F9EA0' },
  { name: 'chartreuse', hex: '#7FFF00' },
  { name: 'chocolate', hex: '#D2691E' },
  { name: 'coral', hex: '#FF7F50' },
  { name: 'cornflowerblue', hex: '#6495ED' },
  { name: 'cornsilk', hex: '#FFF8DC' },
  { name: 'crimson', hex: '#DC143C' },
  { name: 'cyan', hex: '#00FFFF' },
  { name: 'darkblue', hex: '#00008B' },
  { name: 'darkcyan', hex: '#008B8B' },
  { name: 'darkgoldenrod', hex: '#B8860B' },
  { name: 'darkgray', hex: '#A9A9A9' },
  { name: 'darkgreen', hex: '#006400' },
  { name: 'darkgrey', hex: '#A9A9A9' },
  { name: 'darkkhaki', hex: '#BDB76B' },
  { name: 'darkmagenta', hex: '#8B008B' },
  { name: 'darkolivegreen', hex: '#556B2F' },
  { name: 'darkorange', hex: '#FF8C00' },
  { name: 'darkorchid', hex: '#9932CC' },
  { name: 'darkred', hex: '#8B0000' },
  { name: 'darksalmon', hex: '#E9967A' },
  { name: 'darkseagreen', hex: '#8FBC8F' },
  { name: 'darkslateblue', hex: '#483D8B' },
  { name: 'darkslategray', hex: '#2F4F4F' },
  { name: 'darkslategrey', hex: '#2F4F4F' },
  { name: 'darkturquoise', hex: '#00CED1' },
  { name: 'darkviolet', hex: '#9400D3' },
  { name: 'deeppink', hex: '#FF1493' },
  { name: 'deepskyblue', hex: '#00BFFF' },
  { name: 'dimgray', hex: '#696969' },
  { name: 'dimgrey', hex: '#696969' },
  { name: 'dodgerblue', hex: '#1E90FF' },
  { name: 'firebrick', hex: '#B22222' },
  { name: 'floralwhite', hex: '#FFFAF0' },
  { name: 'forestgreen', hex: '#228B22' },
  { name: 'fuchsia', hex: '#FF00FF' },
  { name: 'gainsboro', hex: '#DCDCDC' },
  { name: 'ghostwhite', hex: '#F8F8FF' },
  { name: 'gold', hex: '#FFD700' },
  { name: 'goldenrod', hex: '#DAA520' },
  { name: 'gray', hex: '#808080' },
  { name: 'green', hex: '#008000' },
  { name: 'greenyellow', hex: '#ADFF2F' },
  { name: 'grey', hex: '#808080' },
  { name: 'honeydew', hex: '#F0FFF0' },
  { name: 'hotpink', hex: '#FF69B4' },
  { name: 'indianred', hex: '#CD5C5C' },
  { name: 'indigo', hex: '#4B0082' },
  { name: 'ivory', hex: '#FFFFF0' },
  { name: 'khaki', hex: '#F0E68C' },
  { name: 'lavender', hex: '#E6E6FA' },
  { name: 'lavenderblush', hex: '#FFF0F5' },
  { name: 'lawngreen', hex: '#7CFC00' },
  { name: 'lemonchiffon', hex: '#FFFACD' },
  { name: 'lightblue', hex: '#ADD8E6' },
  { name: 'lightcoral', hex: '#F08080' },
  { name: 'lightcyan', hex: '#E0FFFF' },
  { name: 'lightgoldenrodyellow', hex: '#FAFAD2' },
  { name: 'lightgray', hex: '#D3D3D3' },
  { name: 'lightgreen', hex: '#90EE90' },
  { name: 'lightgrey', hex: '#D3D3D3' },
  { name: 'lightpink', hex: '#FFB6C1' },
  { name: 'lightsalmon', hex: '#FFA07A' },
  { name: 'lightseagreen', hex: '#20B2AA' },
  { name: 'lightskyblue', hex: '#87CEFA' },
  { name: 'lightslategray', hex: '#778899' },
  { name: 'lightslategrey', hex: '#778899' },
  { name: 'lightsteelblue', hex: '#B0C4DE' },
  { name: 'lightyellow', hex: '#FFFFE0' },
  { name: 'lime', hex: '#00FF00' },
  { name: 'limegreen', hex: '#32CD32' },
  { name: 'linen', hex: '#FAF0E6' },
  { name: 'magenta', hex: '#FF00FF' },
  { name: 'maroon', hex: '#800000' },
  { name: 'mediumaquamarine', hex: '#66CDAA' },
  { name: 'mediumblue', hex: '#0000CD' },
  { name: 'mediumorchid', hex: '#BA55D3' },
  { name: 'mediumpurple', hex: '#9370DB' },
  { name: 'mediumseagreen', hex: '#3CB371' },
  { name: 'mediumslateblue', hex: '#7B68EE' },
  { name: 'mediumspringgreen', hex: '#00FA9A' },
  { name: 'mediumturquoise', hex: '#48D1CC' },
  { name: 'mediumvioletred', hex: '#C71585' },
  { name: 'midnightblue', hex: '#191970' },
  { name: 'mintcream', hex: '#F5FFFA' },
  { name: 'mistyrose', hex: '#FFE4E1' },
  { name: 'moccasin', hex: '#FFE4B5' },
  { name: 'navajowhite', hex: '#FFDEAD' },
  { name: 'navy', hex: '#000080' },
  { name: 'oldlace', hex: '#FDF5E6' },
  { name: 'olive', hex: '#808000' },
  { name: 'olivedrab', hex: '#6B8E23' },
  { name: 'orange', hex: '#FFA500' },
  { name: 'orangered', hex: '#FF4500' },
  { name: 'orchid', hex: '#DA70D6' },
  { name: 'palegoldenrod', hex: '#EEE8AA' },
  { name: 'palegreen', hex: '#98FB98' },
  { name: 'paleturquoise', hex: '#AFEEEE' },
  { name: 'palevioletred', hex: '#DB7093' },
  { name: 'papayawhip', hex: '#FFEFD5' },
  { name: 'peachpuff', hex: '#FFDAB9' },
  { name: 'peru', hex: '#CD853F' },
  { name: 'pink', hex: '#FFC0CB' },
  { name: 'plum', hex: '#DDA0DD' },
  { name: 'powderblue', hex: '#B0E0E6' },
  { name: 'purple', hex: '#800080' },
  { name: 'red', hex: '#FF0000' },
  { name: 'rosybrown', hex: '#BC8F8F' },
  { name: 'royalblue', hex: '#4169E1' },
  { name: 'saddlebrown', hex: '#8B4513' },
  { name: 'salmon', hex: '#FA8072' },
  { name: 'sandybrown', hex: '#F4A460' },
  { name: 'seagreen', hex: '#2E8B57' },
  { name: 'seashell', hex: '#FFF5EE' },
  { name: 'sienna', hex: '#A0522D' },
  { name: 'silver', hex: '#C0C0C0' },
  { name: 'skyblue', hex: '#87CEEB' },
  { name: 'slateblue', hex: '#6A5ACD' },
  { name: 'slategray', hex: '#708090' },
  { name: 'slategrey', hex: '#708090' },
  { name: 'snow', hex: '#FFFAFA' },
  { name: 'springgreen', hex: '#00FF7F' },
  { name: 'steelblue', hex: '#4682B4' },
  { name: 'tan', hex: '#D2B48C' },
  { name: 'teal', hex: '#008080' },
  { name: 'thistle', hex: '#D8BFD8' },
  { name: 'tomato', hex: '#FF6347' },
  { name: 'turquoise', hex: '#40E0D0' },
  { name: 'violet', hex: '#EE82EE' },
  { name: 'wheat', hex: '#F5DEB3' },
  { name: 'white', hex: '#FFFFFF' },
  { name: 'whitesmoke', hex: '#F5F5F5' },
  { name: 'yellow', hex: '#FFFF00' },
  { name: 'yellowgreen', hex: '#9ACD32' },
]

@Component({})
export default class MmuMixin extends Vue {
  get hasMmu (): boolean {
    return !!this.$typedState.printer.printer.mmu
  }

  get hasEncoder (): boolean {
    return !!this.$typedState.printer.printer.mmu?.encoder
  }

  /*
     * Select encoder properties
     */
  get encoderPos (): number {
    return Math.round(this.$typedState.printer.printer.mmu?.encoder?.encoder_pos ?? 0)
  }

  get encoderEnabled (): boolean {
    return this.$typedState.printer.printer.mmu?.encoder?.enabled
  }

  get encoderDesiredHeadroom (): number {
    return this.$typedState.printer.printer.mmu?.encoder.desired_headroom
  }

  get encoderDetectionLength (): number {
    return this.$typedState.printer.printer.mmu.encoder.detection_length
  }

  get encoderDetectionMode (): number {
    return this.$typedState.printer.printer.mmu?.encoder.detection_mode
  }

  get encoderFlowRate (): number {
    return this.$typedState.printer.printer.mmu?.encoder.flow_rate
  }

  /*
     * All Happy Hare mmu_machine printer variables
     */
  get numUnits (): number {
    return this.$typedState.printer.printer.mmu_machine?.num_units ?? 1
  }

  unitDetails (unitIndex: number): MmuUnitDetails {
    const unitRef = `unit_${unitIndex}`
    const ud: MmuUnitDetails = {
      name: this.$typedState.printer.printer.mmu_machine?.[unitRef]?.name ?? 'Unit',
      vendor: this.$typedState.printer.printer.mmu_machine?.[unitRef]?.vendor ?? 'Other',
      version: this.$typedState.printer.printer.mmu_machine?.[unitRef]?.version ?? '1.0',
      numGates: this.$typedState.printer.printer.mmu_machine?.[unitRef]?.num_gates ?? 1,
      firstGate: this.$typedState.printer.printer.mmu_machine?.[unitRef]?.first_gate ?? 0,
      selectorType: this.$typedState.printer.printer.mmu_machine?.[unitRef]?.selector_type ?? 'VirtualSelector',
      variableRotationDistances: this.$typedState.printer.printer.mmu_machine?.[unitRef]?.variable_rotation_distances ?? true,
      variableBowdenLengths: this.$typedState.printer.printer.mmu_machine?.[unitRef]?.variable_bowden_lengths ?? true,
      requireBowdenMove: this.$typedState.printer.printer.mmu_machine?.[unitRef]?.require_bowden_move ?? true,
      filamentAlwaysGripped: this.$typedState.printer.printer.mmu_machine?.[unitRef]?.filament_always_gripped ?? false,
      hasBypass: this.$typedState.printer.printer.mmu_machine?.[unitRef]?.has_bypass ?? false,
      multiGear: this.$typedState.printer.printer.mmu_machine?.[unitRef]?.multi_gear ?? false
    }
    return ud
  }

  /*
     * All Happy Hare mmu printer variables
     */
  get enabled (): boolean {
    return this.$typedState.printer.printer.mmu?.enabled ?? false
  }

  get numGates (): number {
    return this.$typedState.printer.printer.mmu?.num_gates ?? 0
  }

  get printState (): string {
    return this.$typedState.printer.printer.mmu?.print_state
  }

  get isPrinting (): boolean {
    return ['started', 'printing'].includes(this.$typedState.printer.printer.mmu?.print_state)
  }

  get isInPrint (): boolean {
    return ['printing', 'pause_locked', 'paused'].includes(this.$typedState.printer.printer.mmu?.print_state)
  }

  get isMmuPaused (): boolean {
    return this.$typedState.printer.printer.mmu?.is_paused ?? false
    return ['pause_locked', 'paused'].includes(this.$typedState.printer.printer.mmu?.print_state)
  }

  get isMmuPausedAndLocked (): boolean {
    return ['pause_locked'].includes(this.$typedState.printer.printer.mmu?.print_state)
  }

  get isHomed (): boolean {
    return this.$typedState.printer.printer.mmu?.is_homed ?? false
  }

  get gate (): number {
    return this.$typedState.printer.printer.mmu?.gate
  }

  get tool (): number {
    return this.$typedState.printer.printer.mmu?.tool
  }

  readonly TOOL_GATE_UNKNOWN: number = -1
  readonly TOOL_GATE_BYPASS: number = -2

  get activeFilament (): object[] {
    return this.$typedState.printer.printer.mmu?.active_filament
  }

  get numToolchanges (): number {
    return this.$typedState.printer.printer.mmu?.num_toolchanges
  }

  get lastTool (): number {
    return this.$typedState.printer.printer.mmu?.last_tool
  }

  get nextTool (): number {
    return this.$typedState.printer.printer.mmu?.next_tool
  }

  get toolchangePurgeVolue (): number {
    return this.$typedState.printer.printer.mmu?.toolchange_purge_volume
  }

  get lastToolchange (): string {
    return this.$typedState.printer.printer.mmu?.last_toolchange ?? ''
  }

  get operation (): string {
    return this.$typedState.printer.printer.mmu?.operation
  }

  get filament (): string {
    return this.$typedState.printer.printer.mmu?.filament
  }

  get filamentPosition (): number {
    return (this.$typedState.printer.printer.mmu?.filament_position ?? 0).toFixed(1)
  }

  get filamentPos (): number {
    return this.$typedState.printer.printer.mmu?.filament_pos ?? this.FILAMENT_POS_UNKNOWN
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
    return this.$typedState.printer.printer.mmu?.filament_direction
  }

  readonly DIRECTION_LOAD: number = 1
  readonly DIRECTION_UNKNOWN: number = 0
  readonly DIRECTION_UNLOAD: number = -1

  get bowdenProgress (): number {
    return this.$typedState.printer.printer.mmu?.bowden_progress ?? -1
  }

  get ttgMap (): number[] {
    return this.$typedState.printer.printer.mmu?.ttg_map
  }

  get endlessSpoolGroups (): number[] {
    return this.$typedState.printer.printer.mmu?.endless_spool_groups
  }

  get gateStatus (): number[] {
    return this.$typedState.printer.printer.mmu?.gate_status ?? []
  }

  readonly GATE_UNKNOWN: number = -1
  readonly GATE_EMPTY: number = 0
  readonly GATE_AVAILABLE: number = 1 // Available to load from either buffer or spool
  readonly GATE_AVAILABLE_FROM_BUFFER: number = 2

  get gateFilamentName (): string[] {
    return this.$typedState.printer.printer.mmu?.gate_filament_name ?? []
  }

  get gateMaterial (): string[] {
    return this.$typedState.printer.printer.mmu?.gate_material ?? []
  }

  get gateColor (): string[] {
    return this.$typedState.printer.printer.mmu?.gate_color ?? []
  }

  get gateTemperature (): number[] {
    return this.$typedState.printer.printer.mmu?.gate_temperature ?? []
  }

  get gateSpoolId (): number[] {
    return this.$typedState.printer.printer.mmu?.gate_spool_id ?? []
  }

  get gateSpeedOverride (): number[] {
    return this.$typedState.printer.printer.mmu?.gate_speed_override ?? []
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
        gd.color = this.formColorString(
          activeSpool?.filament?.color_hex ?? null
        )
        gd.temperature = activeSpool?.filament?.settings_extruder_temp ?? -1
        gd.spoolId = activeSpool?.id ?? -1
      } else {
        gd.filamentName = 'Unknown'
        gd.material = 'Unknown'
        gd.color = this.formColorString(null)
        gd.temperature = -1
        gd.spoolId = -1
      }
      gd.speedOverride = 100
      gd.endlessSpoolGroup = null
    } else {
      gd.index = gateIndex
      gd.status = this.$typedState.printer.printer.mmu?.gate_status?.[gateIndex] ?? -1
      gd.filamentName = this.$typedState.printer.printer.mmu?.gate_filament_name?.[gateIndex] || 'Unknown'
      gd.material = this.$typedState.printer.printer.mmu?.gate_material?.[gateIndex] || 'Unknown'
      gd.color = this.formColorString(this.$typedState.printer.printer.mmu?.gate_color[gateIndex] ?? '')
      gd.temperature = this.$typedState.printer.printer.mmu?.gate_temperature?.[gateIndex] ?? -1
      gd.spoolId = this.$typedState.printer.printer.mmu?.gate_spool_id?.[gateIndex] ?? -1
      gd.speedOverride = this.$typedState.printer.printer.mmu?.gate_speed_override?.[gateIndex] ?? 100
      gd.endlessSpoolGroup = this.$typedState.printer.printer.mmu?.endless_spool_groups?.[gateIndex] ?? gateIndex
    }
    return gd
  }

  spoolmanSpool (spoolId: number | null): Spool | undefined {
    if (spoolId != null) {
      return this.$typedGetters['spoolman/getSpoolById'](spoolId)
    }
  }

  // return this.$typedState.printer.printer.mmu?.gate_color_rgb
  // return this.$typedState.printer.printer.mmu?.slicer_color_rgb
  // return this.$typedState.printer.printer.mmu?.tool_extrusion_multipliers
  // return this.$typedState.printer.printer.mmu?.tool_speed_multipliers

  get slicerToolMap () {
    return this.$typedState.printer.printer.mmu?.slicer_tool_map
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
      td.color = colors.length > toolIndex ? this.formColorString(colors[toolIndex]) : this.formColorString('')
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
      td.color = this.formColorString(
        this.$typedState.printer.printer.mmu?.slicer_tool_map?.tools?.[toolIndex]?.color ?? ''
      )
      td.material = this.$typedState.printer.printer.mmu?.slicer_tool_map?.tools?.[toolIndex]?.material || 'Unknown'
      td.temp = this.$typedState.printer.printer.mmu?.slicer_tool_map?.tools?.[toolIndex]?.temp ?? -1
      td.name = this.$typedState.printer.printer.mmu?.slicer_tool_map?.tools?.[toolIndex]?.name || 'Unknown'
      td.inUse = this.$typedState.printer.printer.mmu?.slicer_tool_map?.tools?.[toolIndex]?.in_use || false
    }
    return td
  }

  get action (): string {
    return this.$typedState.printer.printer.mmu?.action
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
    return this.$typedState.printer.printer.mmu?.has_bypass ?? false
  }

  get syncDrive (): boolean {
    return this.$typedState.printer.printer.mmu?.sync_drive
  }

  // return this.$typedState.printer.printer.mmu?.sync_feedback_state

  get syncFeedbackEnabled (): boolean {
    return this.$typedState.printer.printer.mmu?.sync_feedback_enabled
  }

  get clogDetectionEnabled (): boolean {
    return this.$typedState.printer.printer.mmu?.clog_detection_enabled
  }

  get endlessSpoolEnabled (): boolean {
    return this.$typedState.printer.printer.mmu?.endless_spool_enabled
  }

  get reasonForPause (): string {
    return this.$typedState.printer.printer.mmu?.reason_for_pause ?? ''
  }

  get extruderFilamentRemaining (): number {
    return this.$typedState.printer.printer.mmu?.extruder_filament_remaining
  }

  get spoolmanSupport (): string {
    return this.$typedState.printer.printer.mmu?.spoolman_support ?? 'off'
  }

  readonly SPOOLMAN_OFF: string = 'off' // Spoolman disabled
  readonly SPOOLMAN_READONLY: string = 'readonly' // Get filament attributes only
  readonly SPOOLMAN_PUSH: string = 'push' // Local gatemap is the source or truth
  readonly SPOOLMAN_PULL: string = 'pull' // Spoolman db is the source of truth

  get sensors (): { [key: string]: boolean | null } {
    return this.$typedState.printer.printer.mmu?.sensors ?? {}
  }

  get espoolerActive (): string {
    return this.$typedState.printer.printer.mmu?.espooler_active ?? ''
  }

  readonly ESPOOLER_REWIND: string = 'rewind'
  readonly ESPOOLER_ASSIST: string = 'assist'

  /*
     * Optional printer variables based on selector type
     */
  get servo (): string {
    return this.$typedState.printer.printer.mmu?.servo ?? 'Unknown'
  }

  get grip (): string {
    return this.$typedState.printer.printer.mmu?.grip ?? 'Unknown'
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
    if (color) return this.formColorString(color)
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
  formColorString (color: string | null): string {
    let hexaColor = this.NO_FILAMENT_COLOR
    if (!color) return hexaColor

    // Check if the color is a named color
    const namedColor = W3C_COLORS.find((c) => c.name === color.toLowerCase())
    if (namedColor) {
      hexaColor = namedColor.hex
    } else {
      // Validate and format hex color codes
      const hexColorPattern = /^#?[0-9A-F]{6,8}$/i
      if (hexColorPattern.test(color)) {
        hexaColor = color
        if (!hexaColor.startsWith('#')) hexaColor = '#' + hexaColor
      }
    }
    if (hexaColor.length < 8) hexaColor = hexaColor + 'FF'
    return hexaColor.toUpperCase()
  }

  getLuminance ({ r, g, b }: { r: number; g: number; b: number }): number {
    const a = [r, g, b].map(function (v) {
      v /= 255
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    })
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
  }
}
