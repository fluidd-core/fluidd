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

      <app-setting
        :title="$t('app.setting.label.keyboard_shortcuts')"
        :sub-title="$t('app.setting.tooltip.keyboard_shortcuts')"
      >
        <v-switch
          v-model="enableKeyboardShortcuts"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.confirm_on_estop')">
        <v-switch
          v-model="confirmOnEstop"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.show_upload_and_print')">
        <v-switch
          v-model="showUploadAndPrint"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.power_toggle_in_top_nav')">
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

      <app-setting :title="$t('app.setting.label.confirm_on_power_device_change')">
        <v-switch
          v-model="confirmOnPowerDeviceChange"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.show_save_config_and_restart')">
        <v-switch
          v-model="showSaveConfigAndRestart"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <template v-if="showSaveConfigAndRestart">
        <v-divider />

        <app-setting :title="$t('app.setting.label.confirm_on_save_config_and_restart')">
          <v-switch
            v-model="confirmOnSaveConfigAndRestart"
            hide-details
            class="mb-5"
            @click.native.stop
          />
        </app-setting>
      </template>

      <template v-if="showSaveConfigAndRestart && confirmOnSaveConfigAndRestart">
        <v-divider />

        <app-setting :title="$t('app.setting.label.sections_to_ignore_pending_configuration_changes')">
          <v-combobox
            v-model="sectionsToIgnorePendingConfigurationChanges"
            :items="['bed_mesh default', 'bed_tilt']"
            filled
            dense
            hide-selected
            hide-details="auto"
            multiple
            small-chips
            append-icon=""
            deletable-chips
          />
        </app-setting>
      </template>

      <v-divider />

      <app-setting :title="$t('app.setting.label.print_in_progress_layout')">
        <v-select
          v-model="printInProgressLayout"
          filled
          dense
          hide-details="auto"
          :items="availablePrintInProgressLayouts"
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.setting.label.print_progress_calculation')"
        :sub-title="$t('app.setting.tooltip.average_calculation')"
      >
        <v-select
          v-model="printProgressCalculation"
          multiple
          filled
          dense
          hide-details="auto"
          :rules="[
            $rules.lengthGreaterThanOrEqual(1),
          ]"
          :items="availablePrintProgressCalculation"
        />
      </app-setting>

      <v-divider />

      <app-setting
        :title="$t('app.setting.label.print_eta_calculation')"
        :sub-title="$t('app.setting.tooltip.average_calculation')"
      >
        <v-select
          v-model="printEtaCalculation"
          multiple
          filled
          dense
          hide-details="auto"
          :rules="[
            $rules.lengthGreaterThanOrEqual(1),
          ]"
          :items="availablePrintEtaCalculation"
        />
      </app-setting>

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

      <v-divider />

      <app-setting :title="$t('app.setting.label.fluidd_settings_in_moonraker_db')">
        <app-btn
          outlined
          small
          color="primary"
          class="mr-2"
          @click="handleBackupSettings"
        >
          {{ $t('app.setting.btn.backup') }}
        </app-btn>

        <app-btn
          outlined
          small
          color="primary"
          @click="uploadSettingsFile.click()"
        >
          {{ $t('app.setting.btn.restore') }}
        </app-btn>
      </app-setting>
    </v-card>

    <input
      ref="uploadSettingsFile"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleRestoreSettings"
    >
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { VInput } from '@/types'
import { SupportedLocales, DateFormats, TimeFormats } from '@/globals'
import type { OutputPin } from '@/store/printer/types'
import type { Device } from '@/store/power/types'
import type { PrintEtaCalculation, PrintInProgressLayout, PrintProgressCalculation } from '@/store/config/types'
import { httpClientActions } from '@/api/httpClientActions'
import consola from 'consola'
import { readFileAsTextAsync } from '@/util/file-system-entry'
import { EventBus } from '@/eventBus'
import { isFluiddContent, toFluiddContent } from '@/util/fluidd-content'

@Component({
  components: {}
})
export default class GeneralSettings extends Mixins(StateMixin) {
  @Ref('instanceName')
  readonly instanceNameElement!: VInput

  @Ref('uploadSettingsFile')
  readonly uploadSettingsFile!: HTMLInputElement

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

  set dateFormat (value: string) {
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
        text: `${date.toLocaleDateString(entry.locales ?? this.$filters.getAllLocales(), entry.options)}${entry.suffix ?? ''}`
      }))
  }

  get timeFormat () {
    return this.$store.state.config.uiSettings.general.timeFormat
  }

  set timeFormat (value: string) {
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
        text: `${date.toLocaleTimeString(entry.locales ?? this.$filters.getAllLocales(), entry.options)}${entry.suffix ?? ''}`
      }))
  }

  get enableKeyboardShortcuts (): boolean {
    return this.$store.state.config.uiSettings.general.enableKeyboardShortcuts
  }

  set enableKeyboardShortcuts (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.enableKeyboardShortcuts',
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

  get topNavPowerToggle () {
    return this.$store.state.config.uiSettings.general.topNavPowerToggle
  }

  set topNavPowerToggle (value: string | null) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.topNavPowerToggle',
      value,
      server: true
    })
  }

  get powerDevicesList () {
    const devices = this.$store.getters['power/getDevices'] as Device[]
    const deviceEntries = devices.length
      ? [
          { header: 'Moonraker' },
          ...devices.map(device => ({ text: device.device, value: device.device }))
        ]
      : []

    const pins = this.$store.getters['printer/getPins'] as OutputPin[]
    const pinEntries = pins.length
      ? [
          { header: 'Klipper' },
          ...pins.map(outputPin => ({ text: outputPin.prettyName, value: `${outputPin.name}:klipper` }))
        ]
      : []

    return [
      ...deviceEntries,
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

  get confirmOnSaveConfigAndRestart (): boolean {
    return this.$store.state.config.uiSettings.general.confirmOnSaveConfigAndRestart as boolean
  }

  set confirmOnSaveConfigAndRestart (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.confirmOnSaveConfigAndRestart',
      value,
      server: true
    })
  }

  get sectionsToIgnorePendingConfigurationChanges (): string[] {
    return this.$store.state.config.uiSettings.general.sectionsToIgnorePendingConfigurationChanges as string[]
  }

  set sectionsToIgnorePendingConfigurationChanges (value: string[]) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.sectionsToIgnorePendingConfigurationChanges',
      value: [...new Set(value)].sort((a, b) => a.localeCompare(b)),
      server: true
    })
  }

  get printInProgressLayout (): PrintInProgressLayout {
    return this.$store.state.config.uiSettings.general.printInProgressLayout as PrintInProgressLayout
  }

  set printInProgressLayout (value: PrintInProgressLayout) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.printInProgressLayout',
      value,
      server: true
    })
  }

  get availablePrintInProgressLayouts () {
    return [
      {
        value: 'default',
        text: this.$t('app.general.label.default')
      },
      {
        value: 'compact',
        text: this.$t('app.general.label.compact')
      }
    ]
  }

  get availablePrintProgressCalculation () {
    return [
      {
        value: 'file',
        text: this.$t('app.setting.timer_options.relative_file_position')
      },
      {
        value: 'fileAbsolute',
        text: this.$t('app.setting.timer_options.absolute_file_position')
      },
      {
        value: 'slicer',
        text: this.$t('app.setting.timer_options.slicer_m73')
      },
      {
        value: 'filament',
        text: this.$t('app.setting.timer_options.filament')
      }
    ]
  }

  get printProgressCalculation () {
    return this.$store.state.config.uiSettings.general.printProgressCalculation as PrintProgressCalculation[]
  }

  set printProgressCalculation (value: PrintProgressCalculation[]) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.printProgressCalculation',
      value,
      server: true
    })
  }

  get availablePrintEtaCalculation () {
    return [
      {
        value: 'file',
        text: this.$t('app.setting.timer_options.file')
      },
      {
        value: 'slicer',
        text: this.$t('app.setting.timer_options.slicer')
      }
    ]
  }

  get printEtaCalculation () {
    return this.$store.state.config.uiSettings.general.printEtaCalculation as PrintEtaCalculation[]
  }

  set printEtaCalculation (value: PrintEtaCalculation[]) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.printEtaCalculation',
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

  async handleBackupSettings () {
    try {
      const response = await httpClientActions.serverDatabaseItemGet('fluidd')

      const data = response.data?.result?.value

      if (data) {
        const backupData = toFluiddContent('settings-backup', data)
        const backupDataAsString = JSON.stringify(backupData)

        const link = document.createElement('a')

        link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(backupDataAsString)}`
        link.download = `backup-fluidd-v${import.meta.env.VERSION}-${this.instanceName}.json`
        link.target = '_blank'

        document.body.appendChild(link)

        link.click()

        document.body.removeChild(link)
      }
    } catch (e) {
      consola.error('[Settings] backup failed', e)

      EventBus.$emit(this.$t('app.general.msg.fluidd_settings_backup_failed').toString(), { type: 'error' })
    }
  }

  async handleRestoreSettings () {
    try {
      if (this.uploadSettingsFile?.files?.length === 1) {
        const backupDataAsString = await readFileAsTextAsync(this.uploadSettingsFile.files[0])

        if (backupDataAsString) {
          const backupData = JSON.parse(backupDataAsString)

          if (
            !isFluiddContent<Record<string, unknown>>('settings-backup', backupData)
          ) {
            EventBus.$emit(this.$t('app.general.msg.not_valid_fluidd_backup_file').toString(), { type: 'error' })

            return
          }

          for (const key in backupData.data) {
            await httpClientActions.serverDatabaseItemPost('fluidd', key, backupData.data[key])
          }

          window.location.reload()
        }
      }
    } catch (e) {
      consola.error('[Settings] restore failed', e)

      EventBus.$emit(this.$t('app.general.msg.fluidd_settings_restore_failed').toString(), { type: 'error' })
    } finally {
      this.uploadSettingsFile.value = ''
    }
  }
}
</script>
