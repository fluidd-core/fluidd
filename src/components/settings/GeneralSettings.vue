<template>
  <div>
    <v-subheader id="general">
      {{ $t('app.setting.title.general') }}
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting :title="$t('app.setting.label.printer_name')">
        <v-text-field
          ref="instanceName"
          filled
          dense
          single-line
          hide-details="auto"
          :rules="instanceNameRules"
          :value="instanceName"
          :default-value="$globals.APP_NAME"
          @change="setInstanceName"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.language')">
        <v-select
          filled
          dense
          single-line
          hide-details="auto"
          :items="supportedLocales"
          :value="locale"
          item-text="name"
          item-value="code"
          @change="setLocale"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.date_time_format')">
        <v-select
          v-model="dateformat"
          filled
          dense
          hide-details="auto"
          :items="[
            { text: $filters.formatDateTime(current_time, 'MMM. DD, YYYY'), value: 'MMM. DD,' },
            { text: $filters.formatDateTime(current_time, 'DD MMM. YYYY'), value: 'DD MMM.' }
          ]"
          item-value="value"
          item-text="text"
        />
        &nbsp;
        <v-select
          v-model="timeformat"
          filled
          dense
          hide-details="auto"
          :items="[
            { text: $filters.formatDateTime(current_time, 'h:mm a'), value: 'hh:mm a' },
            { text: $filters.formatDateTime(current_time, 'HH:mm'), value: 'HH:mm' }
          ]"
          item-value="value"
          item-text="text"
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.setting.label.confirm_on_estop')"
      >
        <v-switch
          v-model="confirmOnEstop"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.setting.label.shutdownOnAppBar')"
      >
        <v-switch
          v-model="shutdownOnAppBar"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.setting.label.confirm_on_power_device_change')"
      >
        <v-switch
          v-model="confirmOnPowerDeviceChange"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.setting.label.confirm_on_save_config_and_restart')"
      >
        <v-switch
          v-model="confirmOnSaveConfigAndRestart"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { VInput } from '@/types'

@Component({
  components: {}
})
export default class GeneralSettings extends Mixins(StateMixin) {
  @Ref('instanceName')
  readonly instanceNameElement!: VInput

  instanceNameRules = [
    (v: string) => !!v || 'Required'
  ]

  get estimateTypes () {
    return [
      { name: this.$t('app.setting.timer_options.duration'), value: 'totals' },
      { name: this.$t('app.setting.timer_options.slicer'), value: 'slicer' },
      { name: this.$t('app.setting.timer_options.file'), value: 'file' },
      { name: this.$t('app.setting.timer_options.filament'), value: 'filament' }
    ]
  }

  get instanceName () {
    return this.$store.state.config.uiSettings.general.instanceName
  }

  setInstanceName (value: string) {
    if (this.instanceNameElement.valid) this.$store.dispatch('config/updateInstance', value)
  }

  get locale () {
    return this.$store.state.config.uiSettings.general.locale
  }

  get supportedLocales () {
    return [
      { name: 'Browser default', code: 'default' },
      ...this.$store.state.config.hostConfig.locales
    ]
  }

  setLocale (value: string) {
    this.$store.dispatch('config/onLocaleChange', value)
  }

  get dateformat () {
    return this.$store.state.config.uiSettings.general.dateformat
  }

  set dateformat (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.dateformat',
      value,
      server: true
    })
  }

  get timeformat () {
    return this.$store.state.config.uiSettings.general.timeformat
  }

  set timeformat (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.timeformat',
      value,
      server: true
    })
  }

  get confirmOnEstop () {
    return this.$store.state.config.uiSettings.general.confirmOnEstop
  }

  set confirmOnEstop (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.confirmOnEstop',
      value,
      server: true
    })
  }

  get shutdownOnAppBar () {
    return this.$store.state.config.uiSettings.general.shutdownOnAppBar
  }

  set shutdownOnAppBar (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.shutdownOnAppBar',
      value,
      server: true
    })
  }

  get confirmOnPowerDeviceChange () {
    return this.$store.state.config.uiSettings.general.confirmOnPowerDeviceChange
  }

  set confirmOnPowerDeviceChange (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.confirmOnPowerDeviceChange',
      value,
      server: true
    })
  }

  get confirmOnSaveConfigAndRestart () {
    return this.$store.state.config.uiSettings.general.confirmOnSaveConfigAndRestart
  }

  set confirmOnSaveConfigAndRestart (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.confirmOnSaveConfigAndRestart',
      value,
      server: true
    })
  }

  get current_time () {
    return Math.floor(Date.now() / 1000)
  }
}
</script>
