import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from './state'
import ToolheadMixin from './toolhead'
import { proMode } from '@/services/pro-mode'
import type { TemperaturePreset } from '@/store/config/types'
import type { Fan, Heater, Led, OutputPin, Sensor } from '@/store/printer/types'
import {
  choiceNamed,
  clampTo,
  fanCommand,
  fanPercent,
  lightsOutput,
  materialChoices,
  materialInUse,
  materialsFrom,
  pinCommand,
  pinPercent,
  normaliseColour,
  saveMaterialColourCommand,
  saveMaterialCommand,
  savedMaterialColour,
  savedMaterialName,
  type Material,
  type MaterialChoice
} from '@/services/control/model'
import { presetCommands } from '@/util/temperature-preset'
import { fastPercent, materialMaxFlow, peakFlow, speedChoices, type SpeedChoice } from '@/services/control/speed'
import type { Move } from '@/store/gcodePreview/types'

/** A print's peak flow, worked out once per parsed file, however many panels ask. */
const peakFlows = new WeakMap<readonly Move[], number | null>()

type Axis = 'X' | 'Y' | 'Z'

/** The heat below which a nozzle's − goes to Off and its + starts. */
export const NOZZLE_FLOOR = 170
export const BED_FLOOR = 40

/**
 * What Control's panels share: the printer's position, heaters, fans and
 * lights, as values, and the commands that change them. Each command is
 * the G-code Fluidd's own cards send, so Control and the cards agree.
 */
@Component
export default class ControlMixin extends Mixins(StateMixin, ToolheadMixin) {
  get pro (): boolean {
    return proMode.on
  }

  /** Printing or paused: moves, extrusion and motors are left alone. */
  /** Why the controls are locked when Klipper isn't ready: the connection, when that is what's gone. */
  get notReadyReason (): string {
    return this.socketConnected ? 'Klipper is not ready' : 'Not connected to the printer'
  }

  get busy (): boolean {
    return this.printerPrinting || this.printerPaused
  }

  get toolhead () {
    return this.$store.state.printer.printer.toolhead ?? {}
  }

  get position (): number[] {
    return (this.toolhead.position as number[] | undefined) ?? [0, 0, 0, 0]
  }

  get axisMin (): number[] {
    return (this.toolhead.axis_minimum as number[] | undefined) ?? [0, 0, 0]
  }

  get axisMax (): number[] {
    return (this.toolhead.axis_maximum as number[] | undefined) ?? [200, 200, 200]
  }

  get homedAxes (): string {
    return ((this.toolhead.homed_axes as string | undefined) ?? '').toUpperCase()
  }

  get xySpeed (): number {
    return this.$store.state.config.uiSettings.general.defaultToolheadXYSpeed as number
  }

  get zSpeed (): number {
    return this.$store.state.config.uiSettings.general.defaultToolheadZSpeed as number
  }

  // -- heat ------------------------------------------------------------------

  get heaters (): Heater[] {
    return (this.$store.getters['printer/getHeaters'] as Heater[]) ?? []
  }

  get nozzle (): Heater | null {
    return this.heaters.find(h => h.name === 'extruder') ?? null
  }

  get bed (): Heater | null {
    return this.heaters.find(h => h.name === 'heater_bed') ?? null
  }

  get chamber (): Sensor | null {
    const sensors = (this.$store.getters['printer/getSensors'] as Sensor[]) ?? []
    return sensors.find(s => /chamber/i.test(s.name)) ?? null
  }

  get presets (): TemperaturePreset[] {
    return (this.$store.getters['config/getTempPresets'] as TemperaturePreset[]) ?? []
  }

  get materials (): Material[] {
    return materialsFrom(this.presets)
  }

  get material (): Material | null {
    return materialInUse(this.materials, this.nozzle?.target ?? 0, this.bed?.target ?? 0)
  }

  get materialChoices (): MaterialChoice[] {
    return materialChoices(this.materials)
  }

  /** Whether the printer can remember the material itself (Klipper's [save_variables]; the M1 has it). */
  get savesMaterial (): boolean {
    return 'save_variables' in this.$store.state.printer.printer
  }

  /**
   * The material loaded: the one the printer remembers (the panel and this
   * page set the same save_variables muon_material), else, on a printer
   * that can't remember one, the one set here.
   */
  get loadedMaterial (): MaterialChoice | null {
    const name = this.savesMaterial
      ? savedMaterialName(this.$store.state.printer.printer.save_variables?.variables)
      : (this.$store.state.config.uiSettings.general.loadedMaterial as string | null)
    const choice = choiceNamed(this.materialChoices, name)
    const colour = this.loadedColour
    return choice && colour ? { ...choice, colour } : choice
  }

  /**
   * The loaded filament's colour, when someone has said it: the printer's
   * save_variables muon_material_color (set here, on Control and from the
   * slicer), else, on a printer that can't remember one, the one set here.
   * Null when nobody has: a material's swatch is not its colour.
   */
  get loadedColour (): string | null {
    return this.savesMaterial
      ? savedMaterialColour(this.$store.state.printer.printer.save_variables?.variables)
      : normaliseColour(this.$store.state.config.uiSettings.general.loadedMaterialColour)
  }

  setLoadedMaterial (choice: MaterialChoice) {
    if (this.savesMaterial) {
      this.sendGcode(saveMaterialCommand(choice.name))
    } else {
      this.$store.dispatch('config/saveByPath', { path: 'uiSettings.general.loadedMaterial', value: choice.name, server: true })
    }
  }

  setLoadedColour (colour: string) {
    const hex = normaliseColour(colour)
    if (!hex) return
    if (this.savesMaterial) {
      this.sendGcode(saveMaterialColourCommand(hex))
    } else {
      this.$store.dispatch('config/saveByPath', { path: 'uiSettings.general.loadedMaterialColour', value: hex, server: true })
    }
  }

  /** Heats for a material: as its preset says when it has one, else to its temperatures. */
  heatFor (choice: MaterialChoice) {
    const preset = choice.presetId === null ? undefined : this.presets.find(p => p.id === choice.presetId)
    if (preset) {
      presetCommands(preset).forEach(g => this.sendGcode(g))
      return
    }
    if (choice.nozzle !== null) this.setHeater(this.nozzle, choice.nozzle)
    if (choice.bed !== null) this.setHeater(this.bed, choice.bed)
  }

  setHeater (heater: Heater | null, target: number) {
    if (!heater) return
    const max = heater.maxTemp ?? Infinity
    this.sendGcode(`SET_HEATER_TEMPERATURE HEATER=${heater.name} TARGET=${clampTo(Math.round(target), 0, max)}`)
  }

  applyMaterial (material: Material) {
    const preset = this.presets.find(p => p.id === material.id)
    if (preset) presetCommands(preset).forEach(g => this.sendGcode(g))
  }

  async coolDown () {
    if (this.busy) {
      const ok = await this.$confirm(this.$tc('app.general.label.heaters_busy'), {
        title: this.$tc('app.general.simple_form.msg.confirm'),
        color: 'card-heading',
        icon: '$error'
      })
      if (!ok) return
    }
    this.sendGcode('TURN_OFF_HEATERS')
  }

  // -- move ------------------------------------------------------------------

  isHomed (axes: string): boolean {
    return axes.toUpperCase().split('').every(a => this.homedAxes.includes(a))
  }

  inverted (axis: Axis): boolean {
    return !!this.$store.state.config.uiSettings.general.axis?.[axis.toLowerCase()]?.inverted
  }

  /** A step along one axis, cut short at the machine's limits. */
  moveBy (axis: Axis, distance: number) {
    const i = 'XYZ'.indexOf(axis)
    const signed = this.inverted(axis) ? -distance : distance
    const target = clampTo(this.position[i] + signed, this.axisMin[i], this.axisMax[i])
    const by = Math.round((target - this.position[i]) * 1000) / 1000
    if (!by) return
    this.sendMoveGcode(`${axis}${by}`, axis === 'Z' ? this.zSpeed : this.xySpeed)
  }

  /** To a place, inside the machine. */
  moveTo (place: { X?: number, Y?: number, Z?: number }) {
    const parts: string[] = []
    let rate = this.xySpeed
    for (const axis of ['X', 'Y', 'Z'] as Axis[]) {
      const value = place[axis]
      if (value === undefined || Number.isNaN(value)) continue
      const i = 'XYZ'.indexOf(axis)
      parts.push(`${axis}${clampTo(value, this.axisMin[i], this.axisMax[i])}`)
      if (axis === 'Z') rate = Math.min(rate, this.zSpeed)
    }
    if (parts.length) this.sendMoveGcode(parts.join(' '), rate, true)
  }

  homeWait (axes = ''): string {
    if (axes === 'XY') return this.$waits.onHomeXY
    if (axes === 'Z') return this.$waits.onHomeZ
    return this.$waits.onHomeAll
  }

  home (axes = '') {
    this.sendGcode(axes ? `G28 ${axes.split('').join(' ')}` : 'G28', this.homeWait(axes))
  }

  homing (axes = ''): boolean {
    return this.hasWait(this.homeWait(axes))
  }

  motorsOff () {
    this.sendGcode('M84')
  }

  // -- speed and tuning ------------------------------------------------------

  get gcodeMove () {
    return this.$store.state.printer.printer.gcode_move ?? {}
  }

  get speedFactor (): number {
    return Math.round(((this.gcodeMove.speed_factor as number | undefined) ?? 1) * 100)
  }

  get flowFactor (): number {
    return Math.round(((this.gcodeMove.extrude_factor as number | undefined) ?? 1) * 100)
  }

  setSpeed (percent: number) {
    this.sendGcode(`M220 S${Math.round(percent)}`)
  }

  /** The moves of the file being printed, when the G-code preview holds it. */
  get printMoves (): readonly Move[] | null {
    const printing = (this.$store.state.printer.printer.print_stats?.filename as string | undefined) ?? ''
    const file = this.$store.getters['gcodePreview/getFile'] as { filename: string, path?: string } | undefined
    if (!printing || !file || this.$store.state.gcodePreview.parserWorker) return null
    const path = file.path ? `${file.path}/${file.filename}` : file.filename
    return path === printing ? this.$store.getters['gcodePreview/getMoves'] as Move[] : null
  }

  /**
   * Slow, Normal and Fast for the print running (services/control/speed.ts):
   * Fast is as much faster as the nozzle can melt this filament for this
   * print, or a quarter when the print's flow isn't known.
   */
  get speedChoices (): SpeedChoice[] {
    const moves = this.printMoves
    let peak: number | null = null
    if (moves) {
      if (!peakFlows.has(moves)) {
        const diameter = Number(this.$store.state.printer.printer.configfile?.settings?.extruder?.filament_diameter) || 1.75
        peakFlows.set(moves, peakFlow(moves, diameter))
      }
      peak = peakFlows.get(moves) ?? null
    }
    const metadata = this.$store.state.printer.printer.current_file as { filament_type?: string } | undefined
    const maxFlow = (this.$store.state.gcodePreview.maxFlow as number | null) ??
      materialMaxFlow(metadata?.filament_type) ??
      materialMaxFlow(this.loadedMaterial?.name)
    return speedChoices(fastPercent(peak, maxFlow), peak !== null && maxFlow !== null)
  }

  /** "Slow", "Normal", "Fast", or "110%" for anything else. */
  get speedLabel (): string {
    return this.speedChoices.find(c => c.percent === this.speedFactor)?.label ?? `${this.speedFactor}%`
  }

  setFlow (percent: number) {
    this.sendGcode(`M221 S${Math.round(percent)}`)
  }

  get pressureAdvance (): number | null {
    return this.activeExtruder?.pressure_advance ?? null
  }

  setPressureAdvance (value: number) {
    this.sendGcode(`SET_PRESSURE_ADVANCE ADVANCE=${value}`)
  }

  /** Velocity, acceleration, square corner velocity and the cruise ratio, until a restart. */
  setLimit (key: 'VELOCITY' | 'ACCEL' | 'SQUARE_CORNER_VELOCITY' | 'MINIMUM_CRUISE_RATIO' | 'ACCEL_TO_DECEL', value: number) {
    this.sendGcode(`SET_VELOCITY_LIMIT ${key}=${value}`)
  }

  // -- fans and lights -------------------------------------------------------

  get fans (): Fan[] {
    return (this.$store.getters['printer/getAllFans'] as Fan[]) ?? []
  }

  get partFan (): Fan | null {
    return this.fans.find(f => f.type === 'fan') ?? null
  }

  fanValue (fan: Fan): number {
    return fanPercent(fan)
  }

  setFan (fan: Fan, percent: number) {
    const gcode = fanCommand(fan, percent)
    if (gcode) this.sendGcode(gcode)
  }

  get lightsPin (): OutputPin | null {
    return lightsOutput((this.$store.getters['printer/getPins'] as OutputPin[]) ?? [])
  }

  get lightsLed (): Led | null {
    return this.lightsPin ? null : lightsOutput((this.$store.getters['printer/getAllLeds'] as Led[]) ?? [])
  }

  get hasLights (): boolean {
    return !!this.lightsPin || !!this.lightsLed
  }

  /** The lights, 0 to 100. */
  get lightsValue (): number {
    if (this.lightsPin) return pinPercent(this.lightsPin.value)
    const data = this.lightsLed?.color_data?.[0] ?? []
    return Math.round(Math.max(0, ...data) * 100)
  }

  setLights (value: number | boolean) {
    const percent = typeof value === 'boolean' ? (value ? 100 : 0) : value
    if (this.lightsPin) {
      this.sendGcode(pinCommand(this.lightsPin, this.lightsPin.pwm ? percent : percent > 0))
    } else if (this.lightsLed) {
      const v = Math.round(percent) / 100
      this.sendGcode(`SET_LED LED=${this.lightsLed.name} RED=${v} GREEN=${v} BLUE=${v} WHITE=${v}`)
    }
  }
}
