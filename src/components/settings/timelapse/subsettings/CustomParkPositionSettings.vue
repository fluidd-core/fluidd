<template>
  <div>
    <template v-if="['custom', 'x_only'].includes(parkpos)">
      <v-divider />
      <app-setting
        :title="$t('app.timelapse.setting.park_custom_pos_x')"
        :sub-title="subtitleIfBlocked(getCustomParkPosBlocked('x'))"
      >
        <app-text-field
          :value="parkPosX"
          :rules="[
            $rules.required,
            $rules.numberValid,
            $rules.numberGreaterThanOrEqual(bedSize.minX),
            $rules.numberLessThanOrEqual(bedSize.maxX)
          ]"
          :disabled="getCustomParkPosBlocked('x')"
          hide-details="auto"
          filled
          dense
          single-line
          suffix="mm"
          @change="setParkPosX"
        />
      </app-setting>
    </template>

    <template v-if="['custom', 'y_only'].includes(parkpos)">
      <v-divider />
      <app-setting
        :title="$t('app.timelapse.setting.park_custom_pos_y')"
        :sub-title="subtitleIfBlocked(getCustomParkPosBlocked('y'))"
      >
        <app-text-field
          :value="parkPosY"
          :rules="[
            $rules.required,
            $rules.numberValid,
            $rules.numberGreaterThanOrEqual(bedSize.minY),
            $rules.numberLessThanOrEqual(bedSize.maxY)
          ]"
          :disabled="getCustomParkPosBlocked('y')"
          hide-details="auto"
          filled
          dense
          single-line
          suffix="mm"
          @change="setParkPosY"
        />
      </app-setting>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { ParkPosition, TimelapseSettings } from '@/store/timelapse/types'
import { SocketActions } from '@/api/socketActions'
import ParkExtrudeRetractSettings from './ParkExtrudeRetractSettings.vue'
import type { BedSize } from '@/store/printer/types'

@Component({
  components: {
    ParkExtrudeRetractSettings
  }
})
export default class CustomParkPositionSettings extends Mixins(StateMixin) {
  getCustomParkPosBlocked (axis: 'x' | 'y'): boolean {
    return this.$typedGetters['timelapse/isBlockedSetting'](`park_custom_pos_${axis}`)
  }

  get parkpos (): ParkPosition {
    return this.settings?.parkpos
  }

  set parkpos (value: ParkPosition) {
    SocketActions.machineTimelapseSetSettings({ parkpos: value })
  }

  get parkPosX (): number {
    return this.settings?.park_custom_pos_x
  }

  setParkPosX (value: number) {
    SocketActions.machineTimelapseSetSettings({ park_custom_pos_x: value })
  }

  get parkPosY (): number {
    return this.settings?.park_custom_pos_y
  }

  setParkPosY (value: number) {
    SocketActions.machineTimelapseSetSettings({ park_custom_pos_y: value })
  }

  get bedSize (): BedSize {
    return this.$typedGetters['printer/getBedSize']
  }

  get settings (): TimelapseSettings {
    return this.$typedState.timelapse.settings ?? {} as TimelapseSettings
  }

  subtitleIfBlocked (blocked: boolean): string {
    return blocked ? this.$tc('app.general.tooltip.managed_by_moonraker') : ''
  }
}
</script>
