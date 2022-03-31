<template>
  <collapsable-card
    :title="$t('app.timelapse.title.timelapse_settings')"
    icon="$cog"
    class="mb-2 sb-sm-4"
    :draggable="false"
  >
    <v-card-text>
      <app-setting
        :title="$t('app.timelapse.setting.enable')"
        :sub-title="enabledBlocked && managedByConfigFile"
        r-cols="2"
      >
        <v-switch
          v-model="enabled"
          hide-details
          :disabled="enabledBlocked"
          @click.native.stop
        />
      </app-setting>
      <app-setting
        :title="$t('app.timelapse.setting.auto_render')"
        :sub-title="autoRenderBlocked && managedByConfigFile"
        r-cols="2"
      >
        <v-switch
          v-model="autoRender"
          hide-details
          :disabled="autoRenderBlocked"
          @click.native.stop
        />
      </app-setting>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FileSystem from '@/components/widgets/filesystem/FileSystem.vue'
import CollapsableCard from '@/components/common/CollapsableCard.vue'
import AppSlider from '@/components/ui/AppSlider.vue'
import AppSetting from '@/components/ui/AppSetting.vue'
import { TimelapseSettings } from '@/store/timelapse/types'
import { SocketActions } from '@/api/socketActions'
import TimelapseStatusCard from '@/components/widgets/timelapse/TimelapseStatusCard.vue'

@Component({
  components: {
    AppSetting,
    AppSlider,
    CollapsableCard,
    FileSystem,
    TimelapseStatusCard
  }
})
export default class Timelapse extends Mixins(StateMixin) {
  get enabledBlocked () {
    return this.$store.getters['timelapse/isBlockedSetting']('enabled')
  }

  get enabled () {
    return this.settings?.enabled
  }

  set enabled (value: boolean) {
    SocketActions.machineTimelapseSetSettings({ enabled: value })
  }

  get autoRenderBlocked () {
    return this.$store.getters['timelapse/isBlockedSetting']('autorender')
  }

  get autoRender () {
    return this.settings?.autorender
  }

  set autoRender (value: boolean) {
    SocketActions.machineTimelapseSetSettings({ autorender: value })
  }

  get settings (): TimelapseSettings {
    return this.$store.getters['timelapse/getSettings']
  }

  get managedByConfigFile () {
    return this.$t('app.timelapse.tooltip.managed_by_moonraker')
  }
}
</script>
