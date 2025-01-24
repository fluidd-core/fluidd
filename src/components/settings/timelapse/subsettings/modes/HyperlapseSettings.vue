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
        :rules="[
          $rules.required,
          $rules.numberValid,
          $rules.numberGreaterThanOrEqual(1)
        ]"
        :disabled="hyperlapseCycleBlocked"
        hide-details="auto"
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
import type { TimelapseSettings } from '@/store/timelapse/types'
import { SocketActions } from '@/api/socketActions'
import type { VInput } from '@/types'

@Component({})
export default class HyperlapseSettings extends Mixins(StateMixin) {
  @Ref('hyperlapseCycleElement')
  readonly hyperlapseCycleElement!: VInput

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
    return this.$store.state.timelapse.settings ?? {} as TimelapseSettings
  }

  subtitleIfBlocked (blocked: boolean): string {
    return blocked ? this.$tc('app.general.tooltip.managed_by_moonraker') : ''
  }
}
</script>
