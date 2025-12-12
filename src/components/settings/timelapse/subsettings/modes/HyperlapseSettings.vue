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
        submit-on-change
        @submit="setHyperlapseCycle"
      />
    </app-setting>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { SocketActions } from '@/api/socketActions'
import { defaultWritableSettings } from '@/store/timelapse/state'

@Component({})
export default class HyperlapseSettings extends Mixins(StateMixin) {
  get hyperlapseCycleBlocked (): boolean {
    return this.$typedGetters['timelapse/isBlockedSetting']('hyperlapse_cycle')
  }

  get hyperlapseCycle () {
    return this.settings.hyperlapse_cycle
  }

  setHyperlapseCycle (value: number) {
    SocketActions.machineTimelapsePostSettings({ hyperlapse_cycle: value })
  }

  get settings (): Moonraker.Timelapse.WriteableSettings {
    return this.$typedState.timelapse.settings ?? defaultWritableSettings
  }

  subtitleIfBlocked (blocked: boolean): string {
    return blocked ? this.$tc('app.general.tooltip.managed_by_moonraker') : ''
  }
}
</script>
