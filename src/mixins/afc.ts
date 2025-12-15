import Vue from 'vue'
import Component from 'vue-class-component'

@Component
export default class AfcMixin extends Vue {
  get afc (): Klipper.AfcState | undefined {
    return this.$typedState.printer.printer.AFC
  }

  get afcExtruders (): string[] {
    return this.afc?.extruders ?? []
  }

  get afcHubs (): string[] {
    return this.afc?.hubs ?? []
  }

  get afcUnits (): string[] {
    return this.afc?.units ?? []
  }

  get afcLanes (): string[] {
    return this.afc?.lanes ?? []
  }

  get afcLoadedSpools (): Record<number, string> {
    const loadedSpools = this.afcLanes
      .reduce<Record<number, string>>((loadedSpools, laneName) => {
        const lane = this.getAfcLaneObject(laneName)

        if (lane?.spool_id) {
          loadedSpools[lane.spool_id] = lane.name
        }

        return loadedSpools
      }, {})

    return loadedSpools
  }

  get afcErrorState (): boolean {
    return this.afc?.error_state === true
  }

  get afcCurrentLane (): Klipper.AfcLaneState | undefined {
    const laneName = this.afc?.current_load ?? this.afc?.current_lane

    if (laneName != null) {
      return this.getAfcLaneObject(laneName)
    }
  }

  get afcCurrentBuffer (): Klipper.AfcBufferState | undefined {
    const bufferName = this.afcCurrentLane?.buffer

    if (bufferName != null) {
      return this.getAfcBufferObject(bufferName)
    }
  }

  get afcCurrentState (): Klipper.AfcStateState {
    return this.afc?.current_state ?? 'Idle'
  }

  get afcExistsSpoolman (): boolean {
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

  getAfcLaneObject (lane: string): Klipper.AfcLaneState | undefined {
    const printerState = this.$typedState.printer.printer

    return (
      printerState[(`AFC_stepper ${lane}`)] ??
      printerState[(`AFC_lane ${lane}`)]
    )
  }

  getAfcLaneSettings (lane: string): Klipper.AfcLaneSettings | Klipper.AfcStepperSettings | undefined {
    const printerSettings: Klipper.SettingsState = this.$typedGetters['printer/getPrinterSettings']

    return (
      printerSettings[`afc_stepper ${lane.toLowerCase()}`] ??
      printerSettings[`afc_lane ${lane.toLowerCase()}`]
    )
  }

  getAfcExtruderObject (extruder: string): Klipper.AfcExtruderState | undefined {
    return this.$typedState.printer.printer[(`AFC_extruder ${extruder}`)]
  }

  getAfcExtruderSettings (extruder: string): Klipper.AfcExtruderSettings | undefined {
    const printerSettings: Klipper.SettingsState = this.$typedGetters['printer/getPrinterSettings']

    return printerSettings[`afc_extruder ${extruder.toLowerCase()}`]
  }

  getAfcBufferObject (buffer: string): Klipper.AfcBufferState | undefined {
    return this.$typedState.printer.printer[`AFC_buffer ${buffer}`]
  }

  getAfcBufferSettings (buffer: string): Klipper.AfcBufferSettings | undefined {
    const printerSettings: Klipper.SettingsState = this.$typedGetters['printer/getPrinterSettings']

    return printerSettings[`afc_buffer ${buffer.toLowerCase()}`]
  }

  getAfcHubObject (hub: string): Klipper.AfcHubState | undefined {
    return this.$typedState.printer.printer[`AFC_hub ${hub}`]
  }

  getAfcHubSettings (hub: string): Klipper.AfcHubSettings | undefined {
    const printerSettings: Klipper.SettingsState = this.$typedGetters['printer/getPrinterSettings']

    return printerSettings[`afc_hub ${hub.toLowerCase()}`]
  }
}
