import Vue from 'vue'
import Component from 'vue-class-component'
import type { KlipperPrinterAfcState } from '@/store/printer/types'

@Component
export default class AfcMixin extends Vue {
  get afc (): KlipperPrinterAfcState {
    return this.$typedState.printer.printer.AFC ?? {}
  }

  get afcEnabled (): boolean {
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
      if (lane == null) continue

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

  getAfcLaneObject (lane: string) {
    const printerState = this.$typedState.printer.printer

    return (
      printerState[(`AFC_stepper ${lane}`)] ??
      printerState[(`AFC_lane ${lane}`)]
    )
  }

  getAfcLaneSettings (lane: string) {
    const printerSettings = this.$typedGetters['printer/getPrinterSettings']

    return (
      printerSettings[`afc_stepper ${lane.toLowerCase()}`] ??
      printerSettings[`afc_lane ${lane.toLowerCase()}`]
    )
  }

  getAfcExtruderObject (extruder: string) {
    return this.$typedState.printer.printer[(`AFC_extruder ${extruder}`)]
  }

  getAfcExtruderSettings (extruder: string) {
    const printerSettings = this.$typedGetters['printer/getPrinterSettings']

    return printerSettings[`afc_extruder ${extruder.toLowerCase()}`]
  }

  getAfcBufferObject (buffer: string) {
    return this.$typedState.printer.printer[`AFC_buffer ${buffer}`]
  }

  getAfcBufferSettings (buffer: string) {
    const printerSettings = this.$typedGetters['printer/getPrinterSettings']

    return printerSettings[`afc_buffer ${buffer.toLowerCase()}`]
  }

  getAfcHubObject (hub: string) {
    return this.$typedState.printer.printer[`AFC_hub ${hub}`]
  }

  getAfcHubSettings (hub: string) {
    const printerSettings = this.$typedGetters['printer/getPrinterSettings']

    return printerSettings[`afc_hub ${hub.toLowerCase()}`]
  }
}
