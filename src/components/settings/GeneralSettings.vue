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

      <app-setting>
        <template v-slot:title>
          <span class="text-wrap">{{ $t('app.setting.label.time_estimates') }}</span>
          <app-inline-help bottom small class="ml-2">
            <span>{{ $t('app.setting.timer_options.duration') }}</span><br />
            <span>{{ $t('app.setting.timer_options.duration_description') }}</span><br /><br />

            <span>{{ $t('app.setting.timer_options.slicer') }}</span><br />
            <span>{{ $t('app.setting.timer_options.slicer_description') }}</span><br /><br />

            <span>{{ $t('app.setting.timer_options.file') }}</span><br />
            <span v-html="$t('app.setting.timer_options.file_description')"></span><br /><br />

            <span>{{ $t('app.setting.timer_options.filament') }}</span><br />
            <span v-html="$t('app.setting.timer_options.filament_description')"></span>
          </app-inline-help>
        </template>
        <v-select
          filled
          dense
          hide-details="auto"
          :items="estimateTypes"
          item-text="name"
          item-value="value"
          v-model="printTimeEstimateType">
        </v-select>
      </app-setting>

      <v-divider></v-divider>

      <app-setting
        :title="$t('app.setting.label.account_for_speed')"
      >
        <v-switch
          @click.native.stop
          v-model="accountForSpeed"
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

  get printTimeEstimateType () {
    return this.$store.state.config.uiSettings.general.printTimeEstimationsType
  }

  set printTimeEstimateType (value: string) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.printTimeEstimationsType',
      value,
      server: true
    })
  }

  get accountForSpeed () {
    return this.$store.state.config.uiSettings.general.accountForSpeed
  }

  set accountForSpeed (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.accountForSpeed',
      value,
      server: true
    })
  }
}
</script>
