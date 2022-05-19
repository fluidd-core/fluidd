<template>
  <div>
    <v-divider />
    <app-setting
      :title="$t('app.timelapse.setting.park_custom_pos_x')"
      :sub-title="subtitleIfBlocked(getCustomParkPosBlocked('x'))"
    >
      <v-text-field
        ref="parkPosXElement"
        :value="parkPosX"
        :rules="[rules.numRequired, rules.validNum, rules.numMin(0), rules.numMax(printerMaxX)]"
        :disabled="getCustomParkPosBlocked('x')"
        :hide-details="parkPosXElement ? parkPosXElement.valid : true"
        filled
        dense
        single-line
        suffix="mm"
        @change="setParkPosX"
      />
    </app-setting>

    <v-divider />
    <app-setting
      :title="$t('app.timelapse.setting.park_custom_pos_y')"
      :sub-title="subtitleIfBlocked(getCustomParkPosBlocked('y'))"
    >
      <v-text-field
        ref="parkPosYElement"
        :value="parkPosY"
        :rules="[rules.numRequired, rules.validNum, rules.numMin(0), rules.numMax(printerMaxY)]"
        :disabled="getCustomParkPosBlocked('y')"
        :hide-details="parkPosYElement ? parkPosYElement.valid : true"
        filled
        dense
        single-line
        suffix="mm"
        @change="setParkPosY"
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

@Component({
  components: {
    ParkExtrudeRetractSettings,
    AppSetting,
    CollapsableCard
  }
})
export default class LayerMacroSettings extends Mixins(StateMixin) {
  @Ref('parkPosXElement') parkPosXElement?: any;
  @Ref('parkPosYElement') parkPosYElement?: any;

  rules = {
    numRequired: (v: number | string) => v !== '' || this.$t('app.general.simple_form.error.required'),
    validNum: (v: string) => !isNaN(+v) || this.$t('app.general.simple_form.error.invalid_number'),
    numMin: (min: number) => (v: number) => v >= min || this.$t('app.general.simple_form.error.min', { min }),
    numMax: (max: number) => (v: number) => v <= max || this.$t('app.general.simple_form.error.max', { max })
  }

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

  setParkPosX (value: number) {
    if (this.parkPosXElement?.validate()) {
      SocketActions.machineTimelapseSetSettings({ park_custom_pos_x: value })
    }
  }

  get parkPosY (): number {
    return this.settings?.park_custom_pos_y
  }

  setParkPosY (value: number) {
    if (this.parkPosYElement?.validate()) {
      SocketActions.machineTimelapseSetSettings({ park_custom_pos_y: value })
    }
  }

  get printerMaxX () {
    return +(this.$store.getters['printer/getPrinterConfig']().stepper_x?.position_max ?? Infinity)
  }

  get printerMaxY () {
    return +(this.$store.getters['printer/getPrinterConfig']().stepper_y?.position_max ?? Infinity)
  }

  get settings (): TimelapseSettings {
    return this.$store.getters['timelapse/getSettings']
  }

  subtitleIfBlocked (blocked: boolean): string {
    return blocked ? this.$tc('app.timelapse.tooltip.managed_by_moonraker') : ''
  }
}
</script>
