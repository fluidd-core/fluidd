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
        :sub-title="subtitleIfBlocked(enabledBlocked)"
        :r-cols="2"
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
        :sub-title="subtitleIfBlocked(autoRenderBlocked)"
        :r-cols="2"
      >
        <v-switch
          v-model="autoRender"
          hide-details
          :disabled="autoRenderBlocked"
          @click.native.stop
        />
      </app-setting>
    </v-card-text>
    <div v-if="!frameCount">
      <v-divider />
      <v-card-actions>
        <v-spacer />

        <app-btn
          color="primary"
          text
          @click="$emit('openRenderDialog')"
        >
          {{ $t('app.timelapse.btn.open_render_settings') }}
        </app-btn>
      </v-card-actions>
    </div>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AppSetting from '@/components/ui/AppSetting.vue'
import { TimelapseSettings } from '@/store/timelapse/types'
import { SocketActions } from '@/api/socketActions'

@Component({
  components: { AppSetting }
})
export default class TimelapseSettingsCard extends Mixins(StateMixin) {
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

  get frameCount () {
    return this.$store.getters['timelapse/getLastFrame']?.count
  }

  get settings (): TimelapseSettings {
    return this.$store.getters['timelapse/getSettings']
  }

  subtitleIfBlocked (blocked: boolean): string {
    return blocked ? this.$tc('app.timelapse.tooltip.managed_by_moonraker') : ''
  }
}
</script>
