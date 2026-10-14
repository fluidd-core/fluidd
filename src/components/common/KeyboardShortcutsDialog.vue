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
              <th>All printers</th>
              <td><kbd>G</kbd> <kbd>P</kbd></td>
            </tr>
            <tr
              v-for="section in sections"
              :key="section.id"
            >
              <th>
                {{ section.label }}
                <span
                  v-if="section.pro"
                  class="text--secondary"
                >(Pro)</span>
              </th>
              <td><kbd>G</kbd> <kbd>{{ section.key.toUpperCase() }}</kbd></td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-card>

      <v-card flat>
        <v-card-title>{{ $t('app.keyboard_shortcuts.label.tool') }}</v-card-title>

        <v-simple-table dense>
          <tbody>
            <tr>
              <th>{{ $t('app.keyboard_shortcuts.label.home_all') }}</th>
              <td><kbd>Shift</kbd> + <kbd>h</kbd></td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-card>

      <v-card flat>
        <v-card-title>{{ $t('app.keyboard_shortcuts.label.printing') }}</v-card-title>

        <v-simple-table dense>
          <tbody>
            <tr>
              <th>{{ $t('app.keyboard_shortcuts.label.pause') }}</th>
              <td><kbd>Shift</kbd> + <kbd>p</kbd></td>
            </tr>
            <tr>
              <th>{{ $t('app.keyboard_shortcuts.label.cancel') }}</th>
              <td><kbd>Shift</kbd> + <kbd>c</kbd></td>
            </tr>
          </tbody>
        </v-simple-table>
      </v-card>

      <v-card flat>
        <v-card-title>{{ $t('app.keyboard_shortcuts.label.actions') }}</v-card-title>

        <v-simple-table dense>
          <tbody>
            <tr>
              <th>{{ $t('app.keyboard_shortcuts.label.emergency_stop') }}</th>
              <td><kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>e</kbd></td>
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
import { EventBus } from '@/eventBus'
import { SECTIONS, type Section } from '@/router/printerSections'
import { eventTargetIsContentEditable, keyboardEventToKeyboardShortcut } from '@/util/event-helpers'
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class KeyboardShortcutsDialog extends Vue {
  open = false

  /** Every page's G key, Pro's too, so the keys can be learned before Pro is on. */
  get sections (): Section[] {
    return SECTIONS
  }

  get enableKeyboardShortcuts (): boolean {
    return this.$store.state.config.uiSettings.general.enableKeyboardShortcuts
  }

  handleKeyDown (event: KeyboardEvent) {
    if (!this.enableKeyboardShortcuts) {
      return
    }

    const shortcut = keyboardEventToKeyboardShortcut(event)

    if (
      ['?', 'Shift+?'].includes(shortcut) &&
      !eventTargetIsContentEditable(event)
    ) {
      event.preventDefault()

      this.open = true
    }
  }

  openFromHeader () {
    this.open = true
  }

  created () {
    window.addEventListener('keydown', this.handleKeyDown, false)
    EventBus.bus.$on('keyboard-shortcuts', this.openFromHeader)
  }

  beforeDestroy () {
    window.removeEventListener('keydown', this.handleKeyDown)
    EventBus.bus.$off('keyboard-shortcuts', this.openFromHeader)
  }
}
</script>

<style lang="scss" scoped>
  td:nth-child(2) {
    text-align: right;
  }
</style>
