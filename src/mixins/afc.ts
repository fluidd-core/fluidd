import Vue from 'vue'
import Component from 'vue-class-component'
import type { KlipperPrinterAfcState } from '@/store/printer/types'

@Component
export default class AfcMixin extends Vue {
  get afc (): KlipperPrinterAfcState {
    return this.$typedState.printer.printer.AFC ?? {}
  }

  get afcEnabled () {
    return this.$typedGetters['server/componentSupport']('afc')
  }

  get afcExtruders (): string[] {
    return this.afc.extruders ?? []
  }

  get afcHubs (): string[] {
    return this.afc.hubs ?? []
  }

  get afcUnits (): string[] {
    return this.afc.units ?? []
  }

  get afcLanes (): string[] {
    return this.afc.lanes ?? []
  }

  get afcLoadedSpools () {
    if (this.afcLanes.length === 0) return []

    const spoolIds: { lane: string; spoolId: number }[] = []
    this.afcLanes.forEach((name) => {
      const lane = this.getAfcLaneObject(name)
      if (!lane || !lane.spool_id) return

      spoolIds.push({
        lane: name,
        spoolId: lane.spool_id,
      })
    })

    return spoolIds
  }

  get afcErrorState () {
    return this.afc.error_state ?? false
  }

  get afcCurrentLane () {
    const current = this.afc.current_load ?? this.afc.current_lane ?? null
    if (current === null) return null

    return this.getAfcLaneObject(current)
  }

  get afcCurrentBuffer () {
    const name = this.afcCurrentLane?.buffer ?? null
    if (name === null) return null

    return this.getAfcBufferObject(name)
  }

  get afcCurrentState () {
    return this.afc.current_state ?? ''
  }

  get afcMapList (): string[] {
    const lanes = this.afc.lanes ?? []

    const mapList = []
    for (const laneName of lanes) {
      const lane = this.getAfcLaneObject(laneName)
      if (lane === null) continue

      mapList.push(lane.map)
    }

    return mapList.sort()
  }

  get afcExistsSpoolman () {
    return this.$typedGetters['server/componentSupport']('spoolman')
  }

  get afcShowFilamentName (): boolean {
    return this.$typedState.config.uiSettings.afc.showFilamentName
  }

  get afcShowLaneInfinite (): boolean {
    return this.$typedState.config.uiSettings.afc.showLaneInfinite
  }

  get afcShowUnitIcons (): boolean {
    return this.$typedState.config.uiSettings.afc.showUnitIcons
  }

  get afcShowTd1Color (): boolean {
    return this.$typedState.config.uiSettings.afc.showTd1Color
  }

  get afcHiddenExtruders (): string[] {
    return this.$typedState.config.uiSettings.afc.hiddenExtruders
  }

  get afcHiddenUnits (): string[] {
    return this.$typedState.config.uiSettings.afc.hiddenUnits
  }

  getPrinterObject (key: string) {
    const printer = this.$typedState.printer.printer ?? {}
    return printer[key] ?? null
  }

  getPrinterSettings (key: string) {
    const settings = this.$typedState.printer.printer.configfile?.settings ?? {}

    return settings[key.toLowerCase()] ?? null
  }

  getAfcLaneObject (lane: string) {
    const key_stepper = `AFC_stepper ${lane}` as const
    const key_lane = `AFC_lane ${lane}` as const
    return this.getPrinterObject(key_stepper) ?? this.getPrinterObject(key_lane) ?? {}
  }

  getAfcLaneSettings (lane: string) {
    const key_stepper = `AFC_stepper ${lane}` as const
    const key_lane = `AFC_lane ${lane}` as const
    return this.getPrinterSettings(key_stepper) ?? this.getPrinterSettings(key_lane) ?? {}
  }

  getAfcExtruderObject (extruder: string) {
    const key_extruder = `AFC_extruder ${extruder}` as const
    return this.getPrinterObject(key_extruder) ?? {}
  }

  getAfcExtruderSettings (extruder: string) {
    const key = `AFC_extruder ${extruder}` as const
    return this.getPrinterSettings(key) ?? {}
  }

  getAfcBufferObject (buffer: string) {
    const key_buffer = `AFC_buffer ${buffer}` as const
    return this.getPrinterObject(key_buffer)
  }

  getAfcHubObject (hub: string) {
    const key = `AFC_hub ${hub}` as const
    return this.getPrinterObject(key) ?? {}
  }
}
