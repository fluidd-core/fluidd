import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from './state'
import ToolheadMixin from './toolhead'
import { proMode } from '@/services/pro-mode'
import type { TemperaturePreset } from '@/store/config/types'
import type { Fan, Heater, Led, OutputPin, Sensor } from '@/store/printer/types'
import {
  clampTo,
  fanCommand,
  fanPercent,
  lightsOutput,
  materialInUse,
  materialsFrom,
  pinCommand,
  pinPercent,
  type Material
} from '@/services/control/model'
import { presetCommands } from '@/util/temperature-preset'

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
