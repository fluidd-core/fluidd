<template>
  <div>
    <v-subheader id="editor">{{ $t('app.setting.title.file_editor') }}</v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4">
      <app-setting
        :title="$t('app.setting.label.confirm_dirty_editor_close')"
      >
        <v-switch
          @click.native.stop
          v-model="confirmDirtyEditorClose"
          hide-details
          class="mb-5"
        ></v-switch>
      </app-setting>

      <v-divider></v-divider>

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
        ></v-combobox>
      </app-setting>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({
  components: {}
})
export default class FileEditorSettings extends Mixins(StateMixin) {
  get confirmDirtyEditorClose (): boolean {
    return this.$store.state.config.uiSettings.editor.confirmDirtyEditorClose
  }

  set confirmDirtyEditorClose (value: boolean) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.editor.confirmDirtyEditorClose',
      value,
      server: true
    })
  }

  get autoEditExtensions (): string[] {
    return this.$store.state.config.uiSettings.editor.autoEditExtensions
  }

  set autoEditExtensions (value: string[]) {
    value = value.map((ext: string) => ext.startsWith('.') ? ext : `.${ext}`)
    value = value.filter((ext: string, index: number) => value.indexOf(ext) === index) // deduplicate entries

    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.editor.autoEditExtensions',
      value: value.sort(),
      server: true
    })
  }
}
</script>
