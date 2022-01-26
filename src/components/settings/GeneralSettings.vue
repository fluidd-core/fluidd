<template>
  <div>
    <v-subheader id="general">{{ $t('app.setting.title.general') }}</v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4">

      <app-setting :title="$t('app.setting.label.printer_name')">
        <v-text-field
          filled
          dense
          single-line
          hide-details="auto"
          ref="instanceName"
          :rules="instanceNameRules"
          :value="instanceName"
          :default-value="$globals.APP_NAME"
          @change="setInstanceName"
        ></v-text-field>
      </app-setting>

      <v-divider></v-divider>

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
        ></v-select>
      </app-setting>

      <v-divider></v-divider>

      <app-setting
        :title="$t('app.setting.label.confirm_on_estop')"
      >
        <v-switch
          @click.native.stop
          v-model="confirmOnEstop"
          hide-details
          class="mb-5"
        ></v-switch>
      </app-setting>

      <v-divider></v-divider>

      <app-setting
        :title="$t('app.setting.label.confirm_on_power_device_change')"
      >
        <v-switch
          @click.native.stop
          v-model="confirmOnPowerDeviceChange"
          hide-details
          class="mb-5"
        ></v-switch>
      </app-setting>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({
  components: {}
})
export default class GeneralSettings extends Mixins(StateMixin) {
  @Ref('instanceName') readonly instanceNameElement!: any

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
}
</script>
