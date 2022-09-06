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
        :rules="[rules.numRequired, rules.validNum, rules.numMin(0)]"
        :disabled="parkRetractDistanceBlocked"
        :hide-details="parkRetractDistanceElement ? parkRetractDistanceElement.valid : true"
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
        :rules="[rules.numRequired, rules.validNum, rules.numAboveZero]"
        :disabled="parkRetractSpeedBlocked"
        :hide-details="parkRetractSpeedElement ? parkRetractSpeedElement.valid : true"
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
        :rules="[rules.numRequired, rules.validNum, rules.numMin(0)]"
        :disabled="parkExtrudeDistanceBlocked"
        :hide-details="parkExtrudeDistanceElement ? parkExtrudeDistanceElement.valid : true"
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
        :rules="[rules.numRequired, rules.validNum, rules.numAboveZero]"
        :disabled="parkExtrudeSpeedBlocked"
        :hide-details="parkExtrudeSpeedElement ? parkExtrudeSpeedElement.valid : true"
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
import CollapsableCard from '@/components/common/CollapsableCard.vue'
import AppSetting from '@/components/ui/AppSetting.vue'
import { TimelapseSettings } from '@/store/timelapse/types'
import { SocketActions } from '@/api/socketActions'
import { VInput } from '@/types'

@Component({
  components: {
    AppSetting,
    CollapsableCard
  }
})
export default class LayerMacroSettings extends Mixins(StateMixin) {
  @Ref('parkRetractDistanceElement')
  readonly parkRetractDistanceElement!: VInput

  @Ref('parkRetractSpeedElement')
  readonly parkRetractSpeedElement!: VInput

  @Ref('parkExtrudeDistanceElement')
  readonly parkExtrudeDistanceElement!: VInput

  @Ref('parkExtrudeSpeedElement')
  readonly parkExtrudeSpeedElement!: VInput

  rules = {
    numRequired: (v: number | string) => v !== '' || this.$t('app.general.simple_form.error.required'),
    validNum: (v: string) => !isNaN(+v) || this.$t('app.general.simple_form.error.invalid_number'),
    numMin: (min: number) => (v: number) => v >= min || this.$t('app.general.simple_form.error.min', { min }),
    numAboveZero: (v: number) => v > 0 || this.$t('app.general.simple_form.error.min', { min: '> 0' }),
    numMax: (max: number) => (v: number) => v <= max || this.$t('app.general.simple_form.error.min', { max })
  }

  get parkRetractDistanceBlocked (): boolean {
    return this.$store.getters['timelapse/isBlockedSetting']('park_retract_distance')
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
    return this.$store.getters['timelapse/isBlockedSetting']('park_retract_speed')
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
    return this.$store.getters['timelapse/isBlockedSetting']('park_extrude_distance')
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
    return this.$store.getters['timelapse/isBlockedSetting']('park_extrude_speed')
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
    return this.$store.getters['timelapse/getSettings']
  }

  subtitleIfBlocked (blocked: boolean): string {
    return blocked ? this.$tc('app.general.tooltip.managed_by_moonraker') : ''
  }
}
</script>
