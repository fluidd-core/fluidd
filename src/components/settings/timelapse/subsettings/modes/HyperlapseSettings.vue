<template>
  <div>
    <v-divider />
    <app-setting
      :title="$t('app.timelapse.setting.hyperlapse_cycle')"
      :sub-title="subtitleIfBlocked(hyperlapseCycleBlocked)"
    >
      <v-text-field
        ref="hyperlapseCycleElement"
        :value="hyperlapseCycle"
        :rules="[rules.numRequired, rules.validNum, rules.numMin]"
        :disabled="hyperlapseCycleBlocked"
        :hide-details="hyperlapseCycleElement ? hyperlapseCycleElement.valid : true"
        filled
        dense
        single-line
        suffix="s"
        @change="setHyperlapseCycle"
      />
    </app-setting>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AppSetting from '@/components/ui/AppSetting.vue'
import { TimelapseSettings } from '@/store/timelapse/types'
import { SocketActions } from '@/api/socketActions'
import { VInput } from '@/types'

@Component({
  components: {
    AppSetting
  }
})
export default class HyperlapseSettings extends Mixins(StateMixin) {
  @Ref('hyperlapseCycleElement')
  readonly hyperlapseCycleElement!: VInput

  rules = {
    numRequired: (v: number | string) => v !== '' || this.$t('app.general.simple_form.error.required'),
    validNum: (v: string) => !isNaN(+v) || this.$t('app.general.simple_form.error.invalid_number'),
    numMin: (v: number) => v >= 1 || this.$t('app.general.simple_form.error.min', { min: 1 })
  }

  get hyperlapseCycleBlocked () {
    return this.$store.getters['timelapse/isBlockedSetting']('hyperlapse_cycle')
  }

  get hyperlapseCycle () {
    return this.settings?.hyperlapse_cycle
  }

  setHyperlapseCycle (value: number) {
    if (this.hyperlapseCycleElement.valid) {
      SocketActions.machineTimelapseSetSettings({ hyperlapse_cycle: value })
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
