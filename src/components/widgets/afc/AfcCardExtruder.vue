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
          {{ name }}
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
      <v-col class="py-4 pr-6 text-right">
        {{ state }}:
        <span :class="stateLaneClasses">
          {{ stateLane }}
        </span>
      </v-col>
    </v-row>
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'

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

  get containerClasses () {
    return {
      'border-primary': this.hasActiveLane,
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

    if (extruder !== this.name) {
      return this.$t('app.afc.BufferDisabled').toString()
    }

    return `${this.afcCurrentLane?.buffer ?? '--'}: ${this.afcCurrentBuffer?.state ?? '--'}`
  }

  get state (): string {
    const extruder = this.afcCurrentLane?.extruder

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

    if (this.afcCurrentLane) {
      return this.afcCurrentLane.name
    }

    return this.$t('app.afc.LaneLoadedNone').toString()
  }

  get stateLaneClasses () {
    return {
      'primary--text': this.hasActiveLane,
      'error--text': this.hasActiveLane && this.afcErrorState,
    }
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
</style>
