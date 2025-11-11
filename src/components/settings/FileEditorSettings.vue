<template>
  <div>
    <v-subheader id="editor">
      {{ $t('app.setting.title.file_editor') }}
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting :title="$t('app.setting.label.confirm_dirty_editor_close')">
        <v-switch
          v-model="confirmDirtyEditorClose"
          hide-details
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.auto_edit_extensions')">
        <v-combobox
          v-model="autoEditExtensions"
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

      <v-divider />

      <app-setting :title="$t('app.setting.label.save_and_restore_view_state')">
        <v-select
          v-model="restoreViewState"
          filled
          dense
          hide-details="auto"
          :items="availableRestoreViewState"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.show_code_lens')">
        <v-switch
          v-model="codeLens"
          hide-details
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.klipper_save_and_restart_action')">
        <v-select
          v-model="klipperSaveAndRestartAction"
          filled
          dense
          hide-details="auto"
          :items="availableKlipperSaveAndRestartActions"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.reset')">
        <app-btn
          outlined
          small
          color="primary"
          @click="handleReset"
        >
          {{ $t('app.setting.btn.reset') }}
        </app-btn>
      </app-setting>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { defaultState } from '@/store/config/state'
import type { KlipperSaveAndRestartAction, RestoreViewState } from '@/store/config/types'

@Component({})
export default class FileEditorSettings extends Mixins(StateMixin) {
  get confirmDirtyEditorClose (): boolean {
    return this.$typedState.config.uiSettings.editor.confirmDirtyEditorClose
  }

  set confirmDirtyEditorClose (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.editor.confirmDirtyEditorClose',
      value,
      server: true
    })
  }

  get autoEditExtensions (): string[] {
    return this.$typedState.config.uiSettings.editor.autoEditExtensions
  }

  set autoEditExtensions (value: string[]) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.editor.autoEditExtensions',
      value: [
        ...new Set(value.map(ext => ext.startsWith('.') ? ext : `.${ext}`))
      ].sort((a, b) => a.localeCompare(b)),
      server: true
    })
  }

  get restoreViewState (): RestoreViewState {
    return this.$typedState.config.uiSettings.editor.restoreViewState
  }

  set restoreViewState (value: RestoreViewState) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.editor.restoreViewState',
      value,
      server: true
    })
  }

  get availableRestoreViewState (): { value: RestoreViewState, text: string }[] {
    return [
      {
        value: 'never',
        text: this.$tc('app.setting.label.never')
      },
      {
        value: 'session',
        text: this.$tc('app.setting.label.to_browser_session_storage')
      },
      {
        value: 'local',
        text: this.$tc('app.setting.label.to_browser_local_storage')
      }
    ]
  }

  get codeLens (): boolean {
    return this.$typedState.config.uiSettings.editor.codeLens
  }

  set codeLens (value: boolean) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.editor.codeLens',
      value,
      server: true
    })
  }

  get klipperSaveAndRestartAction (): KlipperSaveAndRestartAction {
    return this.$typedState.config.uiSettings.editor.klipperSaveAndRestartAction
  }

  set klipperSaveAndRestartAction (value: KlipperSaveAndRestartAction) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.editor.klipperSaveAndRestartAction',
      value,
      server: true
    })
  }

  get availableKlipperSaveAndRestartActions (): { value: KlipperSaveAndRestartAction, text: string }[] {
    const isSimulavrMcu: boolean = this.$typedGetters['printer/getIsSimulavrMcu']

    return [
      {
        value: 'auto',
        text: `${this.$tc('app.setting.label.auto')} (${isSimulavrMcu ? this.$tc('app.setting.label.service_restart') : this.$tc('app.setting.label.firmware_restart')})`,
      },
      {
        value: 'firmware-restart',
        text: this.$tc('app.setting.label.firmware_restart')
      },
      {
        value: 'host-restart',
        text: this.$tc('app.setting.label.host_restart')
      },
      {
        value: 'service-restart',
        text: this.$tc('app.setting.label.service_restart')
      }
    ]
  }

  handleReset () {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.editor',
      value: defaultState().uiSettings.editor,
      server: true
    })
  }
}
</script>
