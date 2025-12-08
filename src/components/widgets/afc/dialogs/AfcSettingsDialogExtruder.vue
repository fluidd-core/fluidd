<template>
  <v-card outlined>
    <v-card-title>{{ $t('app.afc.SettingsDialog.SettingsForTitle', { name: $filters.prettyCase(name) }) }}</v-card-title>

    <v-card-text>
      <app-setting
        :title="$t('app.afc.SettingsDialog.LoadUnloadLane')"
        :sub-title="$t('app.afc.SettingsDialog.LoadUnloadLaneDescription')"
      >
        <div class="d-flex flex-wrap">
          <v-btn
            v-for="lane in lanes"
            :key="lane"
            :disabled="!filledLanes.includes(lane)"
            small
            class="ma-1"
            :color="lane_loaded === lane ? 'primary' : ''"
            @click="toggleLane(lane)"
          >
            {{ lane }}
          </v-btn>
        </div>
      </app-setting>
      <v-divider />
      <app-setting
        :title="$t('app.afc.SettingsDialog.ToolStn')"
        :sub-title="toolStnSubTitle"
      >
        <app-named-text-field
          label="tool_stn"
          :value="currentToolStn"
          :reset-value="settingsToolStn"
          suffix="mm"
          submit-on-change
          @submit="updateToolheadSensors('TOOL_STN', $event)"
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.afc.SettingsDialog.ToolStnUnload')"
        :sub-title="$t('app.afc.SettingsDialog.ToolStnUnloadDescription')"
      >
        <app-named-text-field
          label="tool_stn_unload"
          :value="currentToolStnUnload"
          :reset-value="settingsToolStnUnload"
          suffix="mm"
          submit-on-change
          @submit="updateToolheadSensors('TOOL_STN_UNLOAD', $event)"
        />
      </app-setting>

      <template v-if="existsToolEndSensor">
        <v-divider />

        <app-setting
          :title="$t('app.afc.SettingsDialog.ToolSensorAfterExtruder')"
          :sub-title="$t('app.afc.SettingsDialog.ToolSensorAfterExtruderDescription')"
        >
          <app-named-text-field
            label="tool_sensor_after_extruder"
            :value="currentToolSensorAfterExtruder"
            :reset-value="settingsToolSensorAfterExtruder"
            suffix="mm"
            submit-on-change
            @submit="updateToolheadSensors('TOOL_AFTER_EXTRUDER', $event)"
          />
        </app-setting>
      </template>

      <v-divider />

      <app-setting
        :title="$t('app.afc.SettingsDialog.SaveExtruderValues')"
        :sub-title="$t('app.afc.SettingsDialog.SaveExtruderValuesDescription')"
      >
        <v-btn
          :disabled="!enableSaveButton"
          color="primary"
          @click="saveExtruderValues"
        >
          {{ $t('app.afc.SettingsDialog.WriteToFile') }}
        </v-btn>
      </app-setting>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import { encodeGcodeParamValue } from '@/util/gcode-helpers'
import type { KlipperPrinterAfcExtruderSettings, KlipperPrinterAfcExtruderState } from '@/store/printer/types'

@Component({})
export default class AfcSettingsDialogExtruder extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true })
  readonly name!: string

  changedValue = false

  get afcSettingsExtruder (): KlipperPrinterAfcExtruderSettings | undefined {
    return this.getAfcExtruderSettings(this.name)
  }

  get settingsToolStn (): number {
    return this.afcSettingsExtruder?.tool_stn || 0
  }

  get settingsToolStnUnload (): number {
    return this.afcSettingsExtruder?.tool_stn_unload || 0
  }

  get settingsToolSensorAfterExtruder (): number {
    return this.afcSettingsExtruder?.tool_sensor_after_extruder || 0
  }

  get printerObject (): KlipperPrinterAfcExtruderState | undefined {
    return this.getAfcExtruderObject(this.name)
  }

  get currentToolStn (): number {
    return this.printerObject?.tool_stn || 0
  }

  get currentToolStnUnload (): number {
    return this.printerObject?.tool_stn_unload || 0
  }

  get currentToolSensorAfterExtruder (): number {
    return this.printerObject?.tool_sensor_after_extruder || 0
  }

  get lanes (): string[] {
    return this.printerObject?.lanes ?? []
  }

  get lane_loaded (): string {
    return this.printerObject?.lane_loaded ?? ''
  }

  get filledLanes (): string[] {
    const filledLanes: string[] = []

    for (const lane of this.lanes) {
      const laneObject = this.getAfcLaneObject(lane)

      if (laneObject?.load && laneObject.prep) {
        filledLanes.push(lane)
      }
    }

    return filledLanes
  }

  get existsToolEndSensor (): boolean {
    return (
      this.afcSettingsExtruder != null &&
      'pin_tool_end' in this.afcSettingsExtruder
    )
  }

  get toolStnSubTitle (): string {
    if (this.existsToolEndSensor) {
      return this.$t('app.afc.SettingsDialog.ToolStnDescriptionWithEndSensor').toString()
    }

    if (this.afcSettingsExtruder?.pin_tool_start === 'buffer') {
      return this.$t('app.afc.SettingsDialog.ToolStnDescriptionWithRamming').toString()
    }

    return this.$t('app.afc.SettingsDialog.ToolStnDescriptionWithoutEndSensor').toString()
  }

  get enableSaveButton (): boolean {
    return (
      this.changedValue && (
        this.currentToolStn !== this.settingsToolStn ||
        this.currentToolStnUnload !== this.settingsToolStnUnload ||
        this.currentToolSensorAfterExtruder !== this.settingsToolSensorAfterExtruder
      )
    )
  }

  toggleLane (lane: string) {
    if (this.lane_loaded === lane) {
      this.sendGcode(`TOOL_UNLOAD LANE=${encodeGcodeParamValue(lane)}`)

      return
    }

    this.sendGcode(`CHANGE_TOOL LANE=${encodeGcodeParamValue(lane)}`)
  }

  updateToolheadSensors (name: string, value: number) {
    this.changedValue = true
    this.sendGcode(`UPDATE_TOOLHEAD_SENSORS EXTRUDER=${encodeGcodeParamValue(this.name)} ${name}=${value}`)
  }

  saveExtruderValues () {
    this.changedValue = false
    this.sendGcode(`SAVE_EXTRUDER_VALUES EXTRUDER=${encodeGcodeParamValue(this.name)}`)
  }
}
</script>
