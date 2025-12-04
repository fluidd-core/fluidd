<template>
  <div>
    <v-divider />
    <app-setting
      :title="$t('app.timelapse.setting.hyperlapse_cycle')"
      :sub-title="subtitleIfBlocked(hyperlapseCycleBlocked)"
    >
      <app-text-field
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
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { TimelapseSettings } from '@/store/timelapse/types'
import { SocketActions } from '@/api/socketActions'

@Component({})
export default class HyperlapseSettings extends Mixins(StateMixin) {
  get hyperlapseCycleBlocked (): boolean {
    return this.$typedGetters['timelapse/isBlockedSetting']('hyperlapse_cycle')
  }

  get hyperlapseCycle () {
    return this.settings?.hyperlapse_cycle
  }

  setHyperlapseCycle (value: number) {
    SocketActions.machineTimelapseSetSettings({ hyperlapse_cycle: value })
  }

  get settings (): TimelapseSettings {
    return this.$typedState.timelapse.settings ?? {} as TimelapseSettings
  }

  subtitleIfBlocked (blocked: boolean): string {
    return blocked ? this.$tc('app.general.tooltip.managed_by_moonraker') : ''
  }
}
</script>
