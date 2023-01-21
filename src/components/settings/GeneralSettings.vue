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
          :rules="[
            $rules.required
          ]"
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

      <app-setting :title="$t('app.setting.label.date_format')">
        <v-select
          v-model="dateFormat"
          filled
          dense
          hide-details="auto"
          :items="availableDateFormats"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.time_format')">
        <v-select
          v-model="timeFormat"
          filled
          dense
          hide-details="auto"
          :items="availableTimeFormats"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.text_sort_order')">
        <v-select
          v-model="textSortOrder"
          filled
          dense
          hide-details="auto"
          :items="availableTextSortOrders"
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
        :title="$t('app.setting.label.show_upload_and_print')"
      >
        <v-switch
          v-model="showUploadAndPrint"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.setting.label.power_toggle_in_top_nav')"
      >
        <v-select
          v-model="topNavPowerToggle"
          filled
          dense
          single-line
          hide-details="auto"
          :items="[{ text: $tc('app.setting.label.none'), value: null }, ...powerDevicesList]"
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
        :title="$t('app.setting.label.show_save_config_and_restart')"
      >
        <v-switch
          v-model="showSaveConfigAndRestart"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <template v-if="showSaveConfigAndRestart">
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
      </template>

      <v-divider />

      <app-setting
        :title="$t('app.setting.label.enable_diagnostics')"
        :sub-title="$t('app.setting.tooltip.diagnostics_performance')"
      >
        <v-switch
          v-model="enableDiagnostics"
          hide-details
          class="mt-0 mb-4"
        />
      </app-setting>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { VInput } from '@/types'
import { SupportedLocales, DateFormats, TimeFormats } from '@/globals'
import { OutputPin } from '@/store/printer/types'
import { Device } from '@/store/power/types'

@Component({
  components: {}
})
export default class GeneralSettings extends Mixins(StateMixin) {
  @Ref('instanceName')
  readonly instanceNameElement!: VInput

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
      ...SupportedLocales
    ]
  }

  setLocale (value: string) {
    this.$store.dispatch('config/onLocaleChange', value)
  }

  get dateFormat () {
    return this.$store.state.config.uiSettings.general.dateFormat
  }

  set dateFormat (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.dateFormat',
      value,
      server: true
    })
  }

  get availableDateFormats () {
    const date = new Date()

    return Object.entries(DateFormats)
      .map(([key, entry]) => ({
        value: key,
        text: `${date.toLocaleDateString(entry.locale ?? this.$i18n.locale, entry.options)}${entry.suffix ?? ''}`
      }))
  }

  get timeFormat () {
    return this.$store.state.config.uiSettings.general.timeFormat
  }

  set timeFormat (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.timeFormat',
      value,
      server: true
    })
  }

  get availableTimeFormats () {
    const date = new Date()

    return Object.entries(TimeFormats)
      .map(([key, entry]) => ({
        value: key,
        text: `${date.toLocaleTimeString(entry.locale ?? this.$i18n.locale, entry.options)}${entry.suffix ?? ''}`
      }))
  }

  get textSortOrder () {
    return this.$store.state.config.uiSettings.general.textSortOrder
  }

  set textSortOrder (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.textSortOrder',
      value,
      server: true
    })
  }

  get availableTextSortOrders () {
    return [
      {
        value: 'default',
        text: this.$t('app.general.label.default')
      },
      {
        value: 'numeric-prefix',
        text: this.$t('app.general.label.numeric_prefix_sort')
      },
      {
        value: 'version',
        text: this.$t('app.general.label.version_sort')
      }
    ]
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

  get topNavPowerToggle () {
    return this.$store.state.config.uiSettings.general.topNavPowerToggle
  }

  set topNavPowerToggle (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.topNavPowerToggle',
      value,
      server: true
    })
  }

  get powerDevicesList () {
    const devices = this.$store.state.power.devices as Device[]
    const deviceEntries = devices.map(device => ({ text: device.device, value: device.device }))

    const pins = this.$store.getters['printer/getPins'] as OutputPin[]
    const pinEntries = pins.map(outputPin => ({ text: outputPin.prettyName, value: `${outputPin.name}:klipper` }))

    return [
      { header: 'Moonraker' },
      ...deviceEntries,
      { header: 'Klipper' },
      ...pinEntries
    ]
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

  get showSaveConfigAndRestart () {
    return this.$store.state.config.uiSettings.general.showSaveConfigAndRestart
  }

  set showSaveConfigAndRestart (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.showSaveConfigAndRestart',
      value,
      server: true
    })
  }

  get showUploadAndPrint () {
    return this.$store.state.config.uiSettings.general.showUploadAndPrint
  }

  set showUploadAndPrint (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.showUploadAndPrint',
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

  get enableDiagnostics () {
    return this.$store.state.config.uiSettings.general.enableDiagnostics
  }

  set enableDiagnostics (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.enableDiagnostics',
      value,
      server: true
    })
  }

  get current_time () {
    return Math.floor(Date.now() / 1000)
  }
}
</script>
