<template>
  <div>
    <v-divider />
    <app-setting
      :title="$t('app.timelapse.setting.park_custom_pos_x')"
      :sub-title="subtitleIfBlocked(getCustomParkPosBlocked('x'))"
    >
      <v-text-field
        ref="parkPosXElement"
        v-model="parkPosX"
        :rules="[
          $rules.required,
          $rules.numberValid,
          $rules.numberGreaterThanOrEqual(printerMinX),
          $rules.numberLessThanOrEqual(printerMaxX)
        ]"
        :disabled="getCustomParkPosBlocked('x')"
        :hide-details="parkPosXElement ? parkPosXElement.valid : true"
        filled
        dense
        single-line
        suffix="mm"
      />
    </app-setting>

    <v-divider />
    <app-setting
      :title="$t('app.timelapse.setting.park_custom_pos_y')"
      :sub-title="subtitleIfBlocked(getCustomParkPosBlocked('y'))"
    >
      <v-text-field
        ref="parkPosYElement"
        v-model="parkPosY"
        :rules="[
          $rules.required,
          $rules.numberValid,
          $rules.numberGreaterThanOrEqual(printerMinY),
          $rules.numberLessThanOrEqual(printerMaxY)
        ]"
        :disabled="getCustomParkPosBlocked('y')"
        :hide-details="parkPosYElement ? parkPosYElement.valid : true"
        filled
        dense
        single-line
        suffix="mm"
      />
    </app-setting>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import CollapsableCard from '@/components/common/CollapsableCard.vue'
import AppSetting from '@/components/ui/AppSetting.vue'
import { ParkPosition, TimelapseSettings } from '@/store/timelapse/types'
import { SocketActions } from '@/api/socketActions'
import ParkExtrudeRetractSettings from '@/components/settings/timelapse/subsettings/ParkExtrudeRetractSettings.vue'
import { VInput } from '@/types'

@Component({
  components: {
    ParkExtrudeRetractSettings,
    AppSetting,
    CollapsableCard
  }
})
export default class LayerMacroSettings extends Mixins(StateMixin) {
  @Ref('parkPosXElement')
  readonly parkPosXElement?: VInput

  @Ref('parkPosYElement')
  readonly parkPosYElement?: VInput

  getCustomParkPosBlocked (axis: 'x' | 'y') {
    return this.$store.getters['timelapse/isBlockedSetting'](`park_custom_pos_${axis}`)
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

  set parkPosX (value: number) {
    if (this.parkPosXElement?.validate()) {
      SocketActions.machineTimelapseSetSettings({ park_custom_pos_x: value })
    }
  }

  get parkPosY (): number {
    return this.settings?.park_custom_pos_y
  }

  set parkPosY (value: number) {
    if (this.parkPosYElement?.validate()) {
      SocketActions.machineTimelapseSetSettings({ park_custom_pos_y: value })
    }
  }

  get printerMinX () {
    return +(this.$store.getters['printer/getPrinterConfig']().stepper_x?.position_min ?? 0)
  }

  get printerMaxX () {
    return +(this.$store.getters['printer/getPrinterConfig']().stepper_x?.position_max ?? Infinity)
  }

  get printerMinY () {
    return +(this.$store.getters['printer/getPrinterConfig']().stepper_y?.position_min ?? 0)
  }

  get printerMaxY () {
    return +(this.$store.getters['printer/getPrinterConfig']().stepper_y?.position_max ?? Infinity)
  }

  get settings (): TimelapseSettings {
    return this.$store.getters['timelapse/getSettings']
  }

  subtitleIfBlocked (blocked: boolean): string {
    return blocked ? this.$tc('app.general.tooltip.managed_by_moonraker') : ''
  }
}
</script>
