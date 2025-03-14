<template>
  <div>
    <v-divider />
    <app-setting
      :title="$t('app.timelapse.setting.park_retract_distance')"
      :sub-title="subtitleIfBlocked(parkRetractDistanceBlocked)"
    >
      <v-text-field
        ref="parkRetractDistanceElement"
        :value="parkRetractDistance"
        :rules="[
          $rules.required,
          $rules.numberValid,
          $rules.numberGreaterThanOrEqual(0)
        ]"
        :disabled="parkRetractDistanceBlocked"
        hide-details="auto"
        filled
        dense
        single-line
        suffix="mm"
        @change="setParkRetractDistance"
      />
    </app-setting>

    <v-divider />
    <app-setting
      :title="$t('app.timelapse.setting.park_retract_speed')"
      :sub-title="subtitleIfBlocked(parkRetractSpeedBlocked)"
    >
      <v-text-field
        ref="parkRetractSpeedElement"
        :value="parkRetractSpeed"
        :rules="[
          $rules.required,
          $rules.numberValid,
          $rules.numberGreaterThan(0)
        ]"
        :disabled="parkRetractSpeedBlocked"
        hide-details="auto"
        filled
        dense
        single-line
        suffix="mm/s"
        @change="setParkRetractSpeed"
      />
    </app-setting>

    <v-divider />
    <app-setting
      :title="$t('app.timelapse.setting.park_extrude_distance')"
      :sub-title="subtitleIfBlocked(parkExtrudeDistanceBlocked)"
    >
      <v-text-field
        ref="parkExtrudeDistanceElement"
        :value="parkExtrudeDistance"
        :rules="[
          $rules.required,
          $rules.numberValid,
          $rules.numberGreaterThanOrEqual(0)
        ]"
        :disabled="parkExtrudeDistanceBlocked"
        hide-details="auto"
        filled
        dense
        single-line
        suffix="mm"
        @change="setParkExtrudeDistance"
      />
    </app-setting>

    <v-divider />
    <app-setting
      :title="$t('app.timelapse.setting.park_extrude_speed')"
      :sub-title="subtitleIfBlocked(parkExtrudeSpeedBlocked)"
    >
      <v-text-field
        ref="parkExtrudeSpeedElement"
        :value="parkExtrudeSpeed"
        :rules="[
          $rules.required,
          $rules.numberValid,
          $rules.numberGreaterThan(0)
        ]"
        :disabled="parkExtrudeSpeedBlocked"
        hide-details="auto"
        filled
        dense
        single-line
        suffix="mm/s"
        @change="setParkExtrudeSpeed"
      />
    </app-setting>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { TimelapseSettings } from '@/store/timelapse/types'
import { SocketActions } from '@/api/socketActions'
import type { VInput } from '@/types'

@Component({})
export default class ParkExtrudeRetractSettings extends Mixins(StateMixin) {
  @Ref('parkRetractDistanceElement')
  readonly parkRetractDistanceElement!: VInput

  @Ref('parkRetractSpeedElement')
  readonly parkRetractSpeedElement!: VInput

  @Ref('parkExtrudeDistanceElement')
  readonly parkExtrudeDistanceElement!: VInput

  @Ref('parkExtrudeSpeedElement')
  readonly parkExtrudeSpeedElement!: VInput

  get parkRetractDistanceBlocked (): boolean {
    return this.$typedGetters['timelapse/isBlockedSetting']('park_retract_distance')
  }

  get parkRetractDistance (): number {
    return this.settings?.park_retract_distance
  }

  setParkRetractDistance (value: number) {
    if (this.parkRetractDistanceElement?.validate()) {
      SocketActions.machineTimelapseSetSettings({ park_retract_distance: value })
    }
  }

  get parkRetractSpeedBlocked (): boolean {
    return this.$typedGetters['timelapse/isBlockedSetting']('park_retract_speed')
  }

  get parkRetractSpeed (): number {
    return this.settings?.park_retract_speed
  }

  setParkRetractSpeed (value: number) {
    if (this.parkRetractDistanceElement?.validate()) {
      SocketActions.machineTimelapseSetSettings({ park_retract_speed: value })
    }
  }

  get parkExtrudeDistanceBlocked (): boolean {
    return this.$typedGetters['timelapse/isBlockedSetting']('park_extrude_distance')
  }

  get parkExtrudeDistance (): number {
    return this.settings?.park_extrude_distance
  }

  setParkExtrudeDistance (value: number) {
    if (this.parkExtrudeDistanceElement?.validate()) {
      SocketActions.machineTimelapseSetSettings({ park_extrude_distance: value })
    }
  }

  get parkExtrudeSpeedBlocked (): boolean {
    return this.$typedGetters['timelapse/isBlockedSetting']('park_extrude_speed')
  }

  get parkExtrudeSpeed (): number {
    return this.settings?.park_extrude_speed
  }

  setParkExtrudeSpeed (value: number) {
    if (this.parkRetractDistanceElement?.validate()) {
      SocketActions.machineTimelapseSetSettings({ park_extrude_speed: value })
    }
  }

  get settings (): TimelapseSettings {
    return this.$typedState.timelapse.settings ?? {} as TimelapseSettings
  }

  subtitleIfBlocked (blocked: boolean): string {
    return blocked ? this.$tc('app.general.tooltip.managed_by_moonraker') : ''
  }
}
</script>
