<template>
  <app-dialog
    v-model="open"
    :title="$t('app.keyboard_shortcuts.title.keyboard_shortcuts')"
    max-width="400"
    no-actions
  >
    <v-card-text class="pa-0">
      <v-card flat>
        <v-card-title>{{ $t('app.keyboard_shortcuts.label.navigation') }}</v-card-title>

        <v-simple-table dense>
          <tbody>
            <tr>
              <th>{{ $t('app.general.title.home') }}</th>
              <td><kbd>{{ keyboardShortcuts.home }}</kbd></td>
            </tr>
            <tr>
              <th>{{ $t('app.general.title.console') }}</th>
              <td><kbd>{{ keyboardShortcuts.console }}</kbd></td>
            </tr>
            <tr>
              <th>{{ $t('app.general.title.gcode_preview') }}</th>
              <td><kbd>{{ keyboardShortcuts.preview }}</kbd></td>
            </tr>
            <tr>
              <th>{{ $t('app.general.title.jobs') }}</th>
              <td><kbd>{{ keyboardShortcuts.jobs }}</kbd></td>
            </tr>
            <tr v-if="supportsHistory">
              <th>{{ $t('app.general.title.history') }}</th>
              <td><kbd>{{ keyboardShortcuts.history }}</kbd></td>
            </tr>
            <tr v-if="supportsTimelapse">
              <th>{{ $t('app.general.title.timelapse') }}</th>
              <td><kbd>{{ keyboardShortcuts.timelapse }}</kbd></td>
            </tr>
            <tr>
              <th>{{ $t('app.general.title.tune') }}</th>
              <td><kbd>{{ keyboardShortcuts.tune }}</kbd></td>
            </tr>
            <tr v-if="enableDiagnostics">
              <th>{{ $t('app.general.title.diagnostics') }}</th>
              <td><kbd>{{ keyboardShortcuts.diagnostics }}</kbd></td>
            </tr>
            <tr>
              <th>{{ $t('app.general.title.configure') }}</th>
              <td><kbd>{{ keyboardShortcuts.configure }}</kbd></td>
            </tr>
            <tr>
              <th>{{ $t('app.general.title.system') }}</th>
              <td><kbd>{{ keyboardShortcuts.system }}</kbd></td>
            </tr>
            <tr>
              <th>{{ $t('app.general.title.settings') }}</th>
              <td><kbd>{{ keyboardShortcuts.settings }}</kbd></td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-card>

      <v-card flat>
        <v-card-title>{{ $t('app.keyboard_shortcuts.label.printing') }}</v-card-title>

        <v-simple-table dense>
          <tbody>
            <tr>
              <th>{{ $t('app.general.btn.pause') }}</th>
              <td><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd></td>
            </tr>
            <tr>
              <th>{{ $t('app.general.btn.cancel') }}</th>
              <td><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>C</kbd></td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-card>

      <v-card flat>
        <v-card-title>{{ $t('app.keyboard_shortcuts.label.actions') }}</v-card-title>

        <v-simple-table dense>
          <tbody>
            <tr>
              <th>{{ $t('app.general.tooltip.estop') }}</th>
              <td><kbd>Ctrl</kbd> + <kbd>Alt</kbd> + <kbd>F12</kbd></td>
            </tr>
            <tr>
              <th>{{ $t('app.keyboard_shortcuts.label.open_keyboard_shortcut_help') }}</th>
              <td><kbd>?</kbd></td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-card>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Globals } from '@/globals'
import eventTargetIsContentEditable from '@/util/event-target-is-content-editable'
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class KeyboardShortcutsDialog extends Vue {
  open = false

  get keyboardShortcuts () {
    return Globals.KEYBOARD_SHORTCUTS
  }

  get enableKeyboardShortcuts (): boolean {
    return this.$store.state.config.uiSettings.general.enableKeyboardShortcuts
  }

  get supportsHistory (): boolean {
    return this.$store.getters['server/componentSupport']('history')
  }

  get supportsTimelapse (): boolean {
    return this.$store.getters['server/componentSupport']('timelapse')
  }

  get enableDiagnostics (): boolean {
    return this.$store.state.config.uiSettings.general.enableDiagnostics
  }

  handleKeyDown (event: KeyboardEvent) {
    if (!this.enableKeyboardShortcuts) {
      return
    }

    const { key, ctrlKey, altKey } = event

    if (
      key === '?' &&
      !ctrlKey &&
      !altKey &&
      !eventTargetIsContentEditable(event)
    ) {
      event.preventDefault()

      this.open = true
    }
  }

  created () {
    window.addEventListener('keydown', this.handleKeyDown, false)
  }

  beforeDestroy () {
    window.removeEventListener('keydown', this.handleKeyDown)
  }
}
</script>
