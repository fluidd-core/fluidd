<template>
  <div
    class="rounded-lg grey border-1"
    :class="containerClasses"
  >
    <v-row>
      <v-col
        class="pl-6 py-4 text-no-wrap"
      >
        <v-tooltip top>
          <template #activator="{ on, attr }">
            <span
              v-bind="attr"
              class="sensor-status rounded-circle d-inline-block mr-2"
              :class="preSensorClasses"
              v-on="on"
            />
          </template>
          <span>
            {{ preSensorOutput }}
          </span>
        </v-tooltip>
        <span>
          {{ $filters.prettyCase(name) }}
        </span>
        <v-tooltip
          v-if="hasPostSensor"
          top
        >
          <template #activator="{ on, attr }">
            <span
              v-bind="attr"
              class="sensor-status rounded-circle d-inline-block ml-2"
              :class="postSensorClasses"
              v-on="on"
            />
          </template>
          <span>
            {{ postSensorOutput }}
          </span>
        </v-tooltip>
      </v-col>
      <v-col class="py-4 text-center">
        {{ bufferOutput }}
      </v-col>
      <v-col class="py-4 text-right">
        {{ state }}:
        <span :class="stateLaneClasses">
          {{ stateLane }}
        </span>
      </v-col>
      <v-col
        v-if="afcHasToolchanger"
        class="py-4 pr-6 text-right flex-grow-0"
      >
        <v-tooltip
          v-if="onShuttle"
          top
        >
          <template #activator="{ on, attrs }">
            <v-btn
              :disabled="!klippyReady || printerPrinting"
              x-small
              icon
              class="tool-select-btn"
              v-bind="attrs"
              v-on="on"
              @click="unselectTool"
            >
              <v-icon x-small>
                $afcUnselectTool
              </v-icon>
            </v-btn>
          </template>
          <span>
            {{ $t('app.afc.UnselectTool') }}
          </span>
        </v-tooltip>
        <v-tooltip
          v-else
          top
        >
          <template #activator="{ on, attrs }">
            <v-btn
              :disabled="!klippyReady || printerPrinting"
              x-small
              icon
              class="tool-select-btn"
              v-bind="attrs"
              v-on="on"
              @click="selectTool"
            >
              <v-icon x-small>
                $afcSelectTool
              </v-icon>
            </v-btn>
          </template>
          <span>
            {{ $t('app.afc.SelectTool') }}
          </span>
        </v-tooltip>
      </v-col>
    </v-row>
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import { encodeGcodeParamValue } from '@/util/gcode-helpers'

@Component({})
export default class AfcCardExtruder extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true })
  readonly name!: string

  get afcExtruder () {
    return this.getAfcExtruderObject(this.name)
  }

  get settings () {
    return this.getAfcExtruderSettings(this.name)
  }

  get useRamming (): boolean {
    return this.afcExtruder?.tool_start === 'buffer'
  }

  get hasActiveLane (): boolean {
    const currentLane = this.afcCurrentLane

    if (currentLane == null) {
      return false
    }

    const lanes = this.afcExtruder?.lanes ?? []

    return lanes.includes(currentLane.name)
  }

  get onShuttle (): boolean {
    return this.afcExtruder?.on_shuttle === true
  }

  get containerClasses () {
    return {
      'border-primary': this.hasActiveLane || this.afcExtruder?.on_shuttle,
      'border-yellow': this.afcExtruder?.next_pickup,
      'border-error': this.hasActiveLane && this.afcErrorState,
      'darken-3': this.$vuetify.theme.dark,
      'lighten-2': !this.$vuetify.theme.dark,
    }
  }

  get rammingState (): boolean {
    if (!this.useRamming) return false

    const extruder = this.afcCurrentLane?.extruder ?? ''
    const bufferState = (this.afcCurrentBuffer?.state ?? '').toLowerCase()

    return (
      extruder === this.name &&
      bufferState === 'trailing'
    )
  }

  get laneLoaded (): string {
    return this.afcExtruder?.lane_loaded ?? ''
  }

  get preSensorStatus (): boolean {
    return this.afcExtruder?.tool_start_status === true
  }

  get preSensorClasses () {
    if (this.useRamming) {
      return {
        success: !this.laneLoaded && this.rammingState,
        error: !this.laneLoaded && !this.rammingState,
        'grey lighten4': this.laneLoaded,
      }
    }

    return {
      success: this.preSensorStatus,
      error: !this.preSensorStatus,
    }
  }

  get preSensorOutput (): string {
    if (this.useRamming) {
      if (this.laneLoaded) return `${this.$t('app.afc.RammingSensor')}`

      const status = this.rammingState ? this.$t('app.afc.Detected') : this.$t('app.afc.Empty')
      return `${this.$t('app.afc.RammingSensor')} - ${status}`
    }

    const status = this.preSensorStatus ? this.$t('app.afc.Detected') : this.$t('app.afc.Empty')

    return `${this.$t('app.afc.PreExtruderSensor')} - ${status}`
  }

  get hasPostSensor (): boolean {
    return (
      this.settings != null &&
      'pin_tool_end' in this.settings
    )
  }

  get postSensorStatus (): boolean {
    return this.afcExtruder?.tool_end_status === true
  }

  get postSensorClasses () {
    return {
      success: this.postSensorStatus,
      error: !this.postSensorStatus,
    }
  }

  get postSensorOutput (): string {
    const status = this.postSensorStatus ? this.$t('app.afc.Detected') : this.$t('app.afc.Empty')

    return `${this.$t('app.afc.PostExtruderSensor')} - ${status}`
  }

  get bufferOutput (): string {
    const extruder = this.afcCurrentLane?.extruder

    if (this.afcExtruder?.is_standalone) {
      return ' '
    }

    if (extruder !== this.name) {
      return this.$t('app.afc.BufferDisabled').toString()
    }

    return `${this.afcCurrentLane?.buffer ?? '--'}: ${this.afcCurrentBuffer?.state ?? '--'}`
  }

  get state (): string {
    const extruder = this.afcCurrentLane?.extruder

    if (this.afcExtruder?.status) {
      if (this.afcExtruder?.status !== 'Idle') {
        return this.$t(`app.afc.${this.afcExtruder.status}`).toString()
      }
    }

    if (extruder === this.name) {
      if (this.printerPrinting) {
        return this.$t('app.afc.Printing').toString()
      }

      return this.$t(`app.afc.${this.afcCurrentState}`).toString()
    }

    return this.$t('app.afc.Idle').toString()
  }

  get stateLane (): string {
    if (this.afcExtruder?.lane_loaded) {
      return this.afcExtruder.lane_loaded
    }

    return this.$t('app.afc.LaneLoadedNone').toString()
  }

  get stateLaneClasses () {
    return {
      'primary--text': this.hasActiveLane,
      'error--text': this.hasActiveLane && this.afcErrorState,
    }
  }

  selectTool () {
    this.sendGcode(`AFC_SELECT_TOOL TOOL=${encodeGcodeParamValue(this.name)}`)
  }

  unselectTool () {
    this.sendGcode('AFC_UNSELECT_TOOL')
  }
}
</script>

<style scoped>
.sensor-status {
  width: 10px;
  height: 10px;
}

.border-1 {
  border-width: 1px;
  border-style: solid;
}

.v-application .border-primary {
  border-color: var(--v-primary-base) !important;
}

.v-application .border-error {
  border-color: var(--v-error-base) !important;
}

.v-application .border-yellow {
  border-color: #FFFF00 !important;
}

.tool-select-btn.v-size--x-small {
  height: 24px;
  width: 24px;
}
</style>
