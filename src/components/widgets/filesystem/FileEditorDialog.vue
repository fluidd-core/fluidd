<template>
  <v-dialog
    @input="$emit('input', $event)"
    :value="value"
    :loading="loading"
    hide-overlay
    fullscreen
    persistent
    transition="dialog-bottom-transition"
    content-class="config-editor-overlay"
  >
    <v-card d-flex class="fill-height" style="overflow: hidden;">
      <v-toolbar
        dense
        :elevation="6"
        style="z-index: 1"
      >
        <app-btn
          v-if="!$vuetify.breakpoint.smAndDown"
          icon
          :disabled="!ready"
          color=""
          @click="emitClose()"
        >
          <v-icon>$close</v-icon>
        </app-btn>
        <v-toolbar-title>{{ filename }}</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items>
          <app-btn
            v-if="!printerPrinting && rootProperties.showConfigRef"
            @click="handleKeyboardShortcuts"
            target="_blank">
            <v-icon small :left="!$vuetify.breakpoint.smAndDown">$keyboard</v-icon>
            <span v-if="!$vuetify.breakpoint.smAndDown">{{ $t('app.file_system.title.keyboard_shortcuts') }}</span>
          </app-btn>
          <app-btn
            v-if="!printerPrinting && rootProperties.showConfigRef"
            :href="configRefUrl"
            target="_blank">
            <v-icon small :left="!$vuetify.breakpoint.smAndDown">$help</v-icon>
            <span v-if="!$vuetify.breakpoint.smAndDown">{{ $t('app.general.btn.config_reference') }}</span>
          </app-btn>
          <app-btn
            v-if="!readonly && !printerPrinting && rootProperties.showSaveRestart"
            :disabled="!ready"
            @click="emitSave(true)">
            <v-icon small :left="!$vuetify.breakpoint.smAndDown">$restart</v-icon>
            <span v-if="!$vuetify.breakpoint.smAndDown">{{ $t('app.general.btn.save_restart') }}</span>
          </app-btn>
          <app-btn
            v-if="!readonly"
            :disabled="!ready"
            @click="emitSave(false)">
            <v-icon small :left="!$vuetify.breakpoint.smAndDown">$save</v-icon>
            <span v-if="!$vuetify.breakpoint.smAndDown">{{ $t('app.general.btn.save') }}</span>
          </app-btn>
          <app-btn
            @click="emitClose()">
            <v-icon small :left="!$vuetify.breakpoint.smAndDown">$close</v-icon>
            <span v-if="!$vuetify.breakpoint.smAndDown">{{ $t('app.general.btn.close') }}</span>
          </app-btn>
        </v-toolbar-items>
      </v-toolbar>

      <file-editor
        v-if="contents !== undefined"
        v-model="updatedContent"
        :filename="filename"
        :readonly="readonly"
        @ready="editorReady = true">
      </file-editor>

      <keyboard-shortcuts-dialog
        v-model="shortcutsDialog"
      >
      </keyboard-shortcuts-dialog>

    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Globals } from '@/globals'

// Lazy Load the file editor.
// const FileEditor = () => import(
//   /* webpackPreload: true */
//   /* webpackChunkName: "chunk-fileeditor" */
//   './FileEditor.vue'
// )
import FileEditor from './FileEditor.vue'

@Component({
  components: {
    FileEditor
  }
})
export default class FileEditorDialog extends Mixins(StateMixin) {
  @Prop({ type: Boolean, required: true })
  public value!: boolean

  @Prop({ type: String, required: true })
  root!: string

  @Prop({ type: String, required: true })
  public filename!: string;

  @Prop({ type: String, required: true })
  public contents!: string

  @Prop({ type: Boolean, default: false })
  public loading!: boolean

  @Prop({ type: Boolean, default: false })
  public readonly!: boolean

  updatedContent = this.contents
  editorReady = false
  shortcutsDialog = false

  get ready () {
    return (
      !this.loading &&
      this.editorReady &&
      !this.isUploading
    )
  }

  get isUploading (): boolean {
    return this.$store.state.files.uploads.length > 0
  }

  get rootProperties () {
    return this.$store.getters['files/getRootProperties'](this.root)
  }

  get configRefUrl () {
    if (this.filename && this.filename.includes('moonraker.conf')) {
      return Globals.DOCS_MOONRAKER_CONFIG_REF
    } else {
      return Globals.DOCS_KLIPPER_CONFIG_REF
    }
  }

  mounted () {
    this.updatedContent = this.contents
  }

  emitClose () {
    this.$emit('input', false)
  }

  emitSave (restart: boolean) {
    if (this.editorReady) {
      this.$emit('save', this.updatedContent, restart)
      if (restart) this.$emit('input', false)
    }
  }

  handleKeyboardShortcuts () {
    this.shortcutsDialog = true
  }
}
</script>
