<template>
  <div>
    <h3 class="text-h5 mb-3 mt-5">
      {{ title }}
    </h3>
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
    <v-divider class="my-3" />
    <app-setting
      :title="$t('app.afc.SettingsDialog.ToolStn')"
      :sub-title="toolStnSubTitle"
    >
      <app-number-input
        label="tool_stn"
        param="TOOL_STN"
        :target="currentToolStn"
        :default-value="settingsToolStn"
        :output-error-msg="true"
        :has-spinner="true"
        :spinner-factor="1"
        :step="1"
        :min="0"
        :max="null"
        :dec="0"
        unit="mm"
        class="w-100"
        @submit="updateToolheadSensors"
      />
    </app-setting>
    <v-divider class="my-3" />
    <app-setting
      :title="$t('app.afc.SettingsDialog.ToolStnUnload')"
      :sub-title="$t('app.afc.SettingsDialog.ToolStnUnloadDescription')"
    >
      <app-number-input
        label="tool_stn_unload"
        param="TOOL_STN_UNLOAD"
        :target="currentToolStnUnload"
        :default-value="settingsToolStnUnload"
        :output-error-msg="true"
        :has-spinner="true"
        :spinner-factor="1"
        :step="1"
        :min="0"
        :max="null"
        :dec="0"
        unit="mm"
        class="w-100"
        @submit="updateToolheadSensors"
      />
    </app-setting>
    <template v-if="existsToolEndSensor">
      <v-divider class="my-3" />
      <app-setting
        :title="$t('app.afc.SettingsDialog.ToolSensorAfterExtruder')"
        :sub-title="$t('app.afc.SettingsDialog.ToolSensorAfterExtruderDescription')"
      >
        <app-number-input
          label="tool_sensor_after_extruder"
          param="TOOL_AFTER_EXTRUDER"
          :target="currentToolSensorAfterExtruder"
          :default-value="settingsToolSensorAfterExtruder"
          :output-error-msg="true"
          :has-spinner="true"
          :spinner-factor="1"
          :step="1"
          :min="0"
          :max="null"
          :dec="0"
          unit="mm"
          class="w-100"
          @submit="updateToolheadSensors"
        />
      </app-setting>
    </template>
    <v-divider class="my-3" />
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
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'

@Component({})
export default class AfcSettingsDialogExtruder extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true }) readonly name!: string

  changedValue = false

  get title () {
    const name = Vue.$filters.prettyCase(this.name)

    return this.$t('app.afc.SettingsDialog.SettingsForTitle', { name })
  }

  get afcSettingsExtruder () {
    return this.getAfcExtruderSettings(this.name)
  }

  get settingsToolStn () {
    return this.afcSettingsExtruder.tool_stn || 0
  }

  get settingsToolStnUnload () {
    return this.afcSettingsExtruder.tool_stn_unload || 0
  }

  get settingsToolSensorAfterExtruder () {
    return this.afcSettingsExtruder.tool_sensor_after_extruder || 0
  }

  get printerObject () {
    return this.getAfcExtruderObject(this.name)
  }

  get currentToolStn () {
    return this.printerObject.tool_stn || 0
  }

  get currentToolStnUnload () {
    return this.printerObject.tool_stn_unload || 0
  }

  get currentToolSensorAfterExtruder () {
    return this.printerObject.tool_sensor_after_extruder || 0
  }

  get lanes () {
    return this.printerObject.lanes ?? []
  }

  get lane_loaded () {
    return this.printerObject.lane_loaded ?? ''
  }

  get filledLanes () {
    const filledLanes = []

    for (const lane of this.lanes) {
      const laneObject = this.getAfcLaneObject(lane)

      if (laneObject?.load && laneObject?.prep) {
        filledLanes.push(lane)
      }
    }

    return filledLanes
  }

  get existsToolEndSensor () {
    return 'pin_tool_end' in this.afcSettingsExtruder
  }

  get toolStnSubTitle () {
    if (this.existsToolEndSensor) {
      return this.$t('app.afc.SettingsDialog.ToolStnDescriptionWithEndSensor')
    }

    if (this.afcSettingsExtruder.pin_tool_start === 'buffer') {
      return this.$t('app.afc.SettingsDialog.ToolStnDescriptionWithRamming')
    }

    return this.$t('app.afc.SettingsDialog.ToolStnDescriptionWithoutEndSensor')
  }

  get enableSaveButton () {
    if (!this.changedValue) return false

    return (
      this.currentToolStn !== this.settingsToolStn ||
      this.currentToolStnUnload !== this.settingsToolStnUnload ||
      this.currentToolSensorAfterExtruder !== this.settingsToolSensorAfterExtruder
    )
  }

  toggleLane (lane: string) {
    if (this.lane_loaded === lane) {
      this.sendGcode(`TOOL_UNLOAD LANE=${lane}`)

      return
    }

    this.sendGcode(`CHANGE_TOOL LANE=${lane}`)
  }

  updateToolheadSensors (args: { name: string; value: number }) {
    this.changedValue = true
    this.sendGcode(`UPDATE_TOOLHEAD_SENSORS EXTRUDER=${this.name} ${args.name}=${args.value}`)
  }

  saveExtruderValues () {
    this.changedValue = false
    const gcode = `SAVE_EXTRUDER_VALUES EXTRUDER=${this.name}`
    this.sendGcode(gcode)
  }

  doSend (gcode: string) {
    this.sendGcode(gcode)
  }
}
</script>
