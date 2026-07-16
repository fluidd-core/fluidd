import Vue from 'vue'
import Component from 'vue-class-component'
import type { Spool } from '@/store/spoolman/types'
import type { AppFile, AppFileWithMeta } from '@/store/files/types'

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

  get afcHasSpoolTracking (): boolean {
    return (
      this.$typedGetters['server/componentSupport']('spoolman') ||
      this.$typedGetters['server/componentSupport']('filaman')
    )
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

  // ─── Lane spool helpers ───────────────────────────────────────────────────
  // Single method returning all resolved lane + spool data so each component
  // does not need to call individual accessors or implement its own look-ups.

  getAfcLaneInfo (lane: string): Klipper.AfcSpoolLaneInfo {
    const laneObj = this.getAfcLaneObject(lane)

    const spoolId = laneObj?.spool_id ?? undefined
    const spool: Spool | null = spoolId
      ? (this.$typedGetters['spoolman/getSpoolById'](spoolId) ?? null)
      : null

    // Color: td1_color (when enabled) → spoolman color_hex → lane color
    let color: string
    if (this.afc?.td1_present && laneObj?.td1_color && this.afcShowTd1Color) {
      color = `#${laneObj.td1_color}`
    } else if (spool?.filament?.color_hex) {
      color = `#${spool.filament.color_hex.replace(/^#/, '')}`
    } else {
      color = laneObj?.color || '#000000'
    }

    const material = spool?.filament?.material || laneObj?.material || ''
    const remainingWeight = spool?.remaining_weight ?? laneObj?.weight
    const fullWeight = spool?.initial_weight ?? laneObj?.initial_weight

    let spoolPercent = 100
    if (remainingWeight != null && fullWeight != null && fullWeight > 0) {
      spoolPercent = Math.round((remainingWeight / fullWeight) * 100)
    }

    const spoolmanBase: string | undefined = this.$typedGetters['spoolman/getSpoolmanUrl']
    const spoolUrl = spoolmanBase && spoolId
      ? `${spoolmanBase.replace(/\/$/, '')}/spool/show/${spoolId}`
      : undefined

    return {
      spoolId,
      spool,
      color,
      material,
      filamentVendor: spool?.filament?.vendor?.name ?? undefined,
      filamentName: spool?.filament?.name || laneObj?.filament_name || undefined,
      remainingWeight,
      fullWeight,
      spoolPercent,
      usedWeight: spool?.used_weight ?? undefined,
      extruderTemp: spool?.filament?.settings_extruder_temp ?? laneObj?.extruder_temp ?? undefined,
      bedTemp: spool?.filament?.settings_bed_temp ?? undefined,
      spoolUrl,
      filamentLoaded: laneObj ? (laneObj?.prep && laneObj?.load) : undefined
    }
  }

  shouldShowAfcDialog (fileWithMeta: AppFileWithMeta | AppFile | undefined): boolean {
    if (this.afc == null) return false
    const hasMetadata = fileWithMeta != null && 'filament_weights' in fileWithMeta
    const usedTools = hasMetadata ? (fileWithMeta!.filament_weights ?? []).filter(w => w > 0) : []
    return usedTools.length > 0
  }
}
