<template>
  <div
    id="general"
    class="m3-sets"
    data-tid="general-settings"
  >
    <section class="m3-set">
      <h2 class="m3-set__title">
        This printer
      </h2>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Name</b>
          <span>In the top bar, on Printers, and in your browser's tab.</span>
        </div>
        <div class="m3-set__control m3-set__control--wide">
          <v-text-field
            ref="instanceName"
            outlined
            dense
            single-line
            hide-details="auto"
            :rules="[$rules.required]"
            :value="instanceName"
            :default-value="$globals.APP_NAME"
            data-tid="setting-name"
            @change="setInstanceName"
          />
        </div>
      </div>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Language</b>
        </div>
        <div class="m3-set__control m3-set__control--wide">
          <v-select
            outlined
            dense
            hide-details
            item-value="code"
            item-text="name"
            :items="supportedLocales"
            :value="locale"
            @change="setLocale"
          />
        </div>
      </div>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Dates and times</b>
          <span>How this page writes them.</span>
        </div>
        <div class="m3-set__control m3-set__control--wide m3-set__control--pair">
          <v-select
            v-model="dateFormat"
            outlined
            dense
            hide-details
            :items="availableDateFormats"
          />
          <v-select
            v-model="timeFormat"
            outlined
            dense
            hide-details
            :items="availableTimeFormats"
          />
        </div>
      </div>
    </section>

    <section class="m3-set">
      <h2 class="m3-set__title">
        Asking first
      </h2>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Emergency stop</b>
          <span>{{ confirmOnEstop ? 'It asks before it stops the printer.' : 'One press stops the printer at once, which is safest.' }}</span>
        </div>
        <div class="m3-set__control">
          <toggle-switch
            :value="confirmOnEstop"
            label="Ask before an emergency stop"
            @input="confirmOnEstop = $event"
          />
        </div>
      </div>
      <div
        v-if="hasPowerDevices"
        class="m3-set__row"
      >
        <div class="m3-set__label">
          <b>Power switches</b>
          <span>Ask before turning one of the printer's power devices on or off.</span>
        </div>
        <div class="m3-set__control">
          <toggle-switch
            :value="confirmOnPowerDeviceChange"
            label="Ask before switching power"
            @input="confirmOnPowerDeviceChange = $event"
          />
        </div>
      </div>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Saving the config</b>
          <span>Show what changed and ask before Klipper restarts to keep it.</span>
        </div>
        <div class="m3-set__control">
          <toggle-switch
            :value="confirmOnSaveConfigAndRestart"
            label="Ask before saving the config"
            @input="confirmOnSaveConfigAndRestart = $event"
          />
        </div>
      </div>
    </section>

    <section class="m3-set">
      <h2 class="m3-set__title">
        Keyboard
      </h2>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>Shortcuts</b>
          <span>G then a letter goes to a page, Ctrl K finds anything, ? lists them all.</span>
        </div>
        <div class="m3-set__control">
          <toggle-switch
            :value="enableKeyboardShortcuts"
            label="Keyboard shortcuts"
            @input="enableKeyboardShortcuts = $event"
          />
        </div>
      </div>
    </section>

    <task-fold
      v-model="detailsOpen"
      fold-id="settings-page-print-details"
      title="Choose page and print details"
      summary="Top bar, estimates and diagnostics"
    >
      <div class="m3-sets">
        <section class="m3-set">
          <h2 class="m3-set__title">
            The top bar
          </h2>
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>Upload and print</b>
              <span>A button to send a file and start it at once.</span>
            </div>
            <div class="m3-set__control">
              <toggle-switch
                :value="showUploadAndPrint"
                label="Upload and print button"
                @input="showUploadAndPrint = $event"
              />
            </div>
          </div>
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>Save the config and restart</b>
              <span>A button that appears when a calibration has results to keep.</span>
            </div>
            <div class="m3-set__control">
              <toggle-switch
                :value="showSaveConfigAndRestart"
                label="Save config and restart button"
                @input="showSaveConfigAndRestart = $event"
              />
            </div>
          </div>
          <div
            v-if="powerDevicesList.length"
            class="m3-set__row"
          >
            <div class="m3-set__label">
              <b>A power switch</b>
              <span>One of the printer's power devices, a press away.</span>
            </div>
            <div class="m3-set__control m3-set__control--wide">
              <v-select
                v-model="topNavPowerToggle"
                outlined
                dense
                hide-details
                :items="[{ text: 'None', value: null }, ...powerDevicesList]"
              />
            </div>
          </div>
        </section>

        <section class="m3-set">
          <h2 class="m3-set__title">
            A print's progress
          </h2>
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>How far along</b>
              <span>Worked out from these; with more than one, their average.</span>
            </div>
            <div class="m3-set__control m3-set__control--wide">
              <v-select
                v-model="printProgressCalculation"
                multiple
                outlined
                dense
                hide-details="auto"
                :rules="[$rules.lengthGreaterThanOrEqual(1)]"
                :items="availablePrintProgressCalculation"
              />
            </div>
          </div>
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>Time left</b>
              <span>Worked out from these; with more than one, their average.</span>
            </div>
            <div class="m3-set__control m3-set__control--wide">
              <v-select
                v-model="printEtaCalculation"
                multiple
                outlined
                dense
                hide-details="auto"
                :rules="[$rules.lengthGreaterThanOrEqual(1)]"
                :items="availablePrintEtaCalculation"
              />
            </div>
          </div>
        </section>

        <section class="m3-set">
          <h2 class="m3-set__title">
            Config changes and diagnostics
          </h2>
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>Changes not to list</b>
              <span>Sections whose saved results Save doesn't show, such as the bed mesh.</span>
            </div>
            <div class="m3-set__control m3-set__control--wide">
              <v-combobox
                v-model="sectionsToIgnorePendingConfigurationChanges"
                :items="['bed_mesh default', 'bed_tilt']"
                multiple
                small-chips
                deletable-chips
                outlined
                dense
                hide-details
                append-icon=""
              />
            </div>
          </div>
          <div class="m3-set__row">
            <div class="m3-set__label">
              <b>Diagnostics</b>
              <span>Records how busy each board is, for Charts. Uses a little more of the printer.</span>
            </div>
            <div class="m3-set__control">
              <toggle-switch
                :value="enableDiagnostics"
                label="Diagnostics"
                @input="enableDiagnostics = $event"
              />
            </div>
          </div>
        </section>
      </div>
    </task-fold>

    <section class="m3-set">
      <h2 class="m3-set__title">
        These settings
      </h2>
      <div class="m3-set__row">
        <div class="m3-set__label">
          <b>A copy of them</b>
          <span>Everything set here is kept on the printer. A copy moves it to another one.</span>
        </div>
        <div class="m3-set__control">
          <button
            type="button"
            class="cbtn"
            @click="handleBackupSettings"
          >
            Download a copy
          </button>
          <button
            type="button"
            class="cbtn cbtn--ghost"
            @click="uploadSettingsFile.click()"
          >
            Restore one
          </button>
        </div>
      </div>
    </section>

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
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'
import TaskFold from '@/components/control/TaskFold.vue'

@Component({
  components: { ToggleSwitch, TaskFold }
})
export default class GeneralSettings extends Mixins(StateMixin) {
  detailsOpen = false

  get hasPowerDevices (): boolean {
    return ((this.$store.getters['power/getDevices'] as Device[] | undefined) ?? []).length > 0
  }

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
    return this.$store.state.config.uiSettings.general.printProgressCalculation as PrintProgressCalculation
  }

  set printProgressCalculation (value: string) {
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
