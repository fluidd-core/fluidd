<template>
  <v-dialog
    :value="value"
    :loading="loading"
    hide-overlay
    fullscreen
    persistent
    transition="dialog-bottom-transition"
    content-class="config-editor-overlay"
    @input="$emit('input', $event)"
  >
    <v-card
      d-flex
      class="fill-height"
      style="overflow: hidden;"
    >
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
        <v-spacer />
        <v-toolbar-items>
          <app-btn
            v-if="!printerPrinting"
            target="_blank"
            @click="handleKeyboardShortcuts"
          >
            <v-icon
              small
              :left="!$vuetify.breakpoint.smAndDown"
            >
              $keyboard
            </v-icon>
            <span v-if="!$vuetify.breakpoint.smAndDown">{{ $t('app.file_system.title.keyboard_shortcuts') }}</span>
          </app-btn>
          <app-btn
            v-if="!printerPrinting && configMap.link"
            :href="configMap.link"
            target="_blank"
          >
            <v-icon
              small
              :left="!$vuetify.breakpoint.smAndDown"
            >
              $help
            </v-icon>
            <span v-if="!$vuetify.breakpoint.smAndDown">{{ $t('app.general.btn.config_reference') }}</span>
          </app-btn>
          <app-btn
            v-if="!readonly && !printerPrinting && configMap.serviceSupported"
            :disabled="!ready"
            @click="emitSave(true)"
          >
            <v-icon
              small
              :left="!$vuetify.breakpoint.smAndDown"
            >
              $restart
            </v-icon>
            <span v-if="!$vuetify.breakpoint.smAndDown">{{ $t('app.general.btn.save_restart') }}</span>
          </app-btn>
          <app-btn
            v-if="!readonly"
            :disabled="!ready"
            @click="emitSave(false)"
          >
            <v-icon
              small
              :left="!$vuetify.breakpoint.smAndDown"
            >
              $save
            </v-icon>
            <span v-if="!$vuetify.breakpoint.smAndDown">{{ $t('app.general.btn.save') }}</span>
          </app-btn>
          <app-btn
            @click="emitClose()"
          >
            <v-icon
              small
              :left="!$vuetify.breakpoint.smAndDown"
            >
              $close
            </v-icon>
            <span v-if="!$vuetify.breakpoint.smAndDown">{{ $t('app.general.btn.close') }}</span>
          </app-btn>
        </v-toolbar-items>
      </v-toolbar>

      <file-editor
        v-if="contents !== undefined"
        v-model="updatedContent"
        :filename="filename"
        :readonly="readonly"
        @ready="editorReady = true"
      />

      <keyboard-shortcuts-dialog
        v-model="shortcutsDialog"
      />
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
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
  lastSavedContent = this.updatedContent
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

  get configMap () {
    return this.$store.getters['server/getConfigMapByFilename'](this.filename)
  }

  // get configRefUrl () {
  //   if (this.filename && this.filename.includes('moonraker.conf')) {
  //     return Globals.DOCS_MOONRAKER_CONFIG_REF
  //   } else {
  //     return Globals.DOCS_KLIPPER_CONFIG_REF
  //   }
  // }

  mounted () {
    this.updatedContent = this.contents
    this.lastSavedContent = this.updatedContent
  }

  async emitClose () {
    const confirmDirtyEditorClose = this.$store.state.config.uiSettings.editor.confirmDirtyEditorClose
    if (confirmDirtyEditorClose && this.updatedContent !== this.lastSavedContent) {
      const result = await this.$confirm(
        this.$tc('app.general.simple_form.msg.unsaved_changes'),
        { title: this.$tc('app.general.label.unsaved_changes'), color: 'card-heading', icon: '$error' }
      )

      if (!result) {
        return
      }
    }

    this.$emit('input', false)
  }

  emitSave (restart: boolean) {
    if (this.editorReady) {
      if (this.configMap.serviceSupported && restart) {
        this.$emit('save', this.updatedContent, this.configMap.service)
        this.$emit('input', false)
      } else {
        this.$emit('save', this.updatedContent)
      }

      this.lastSavedContent = this.updatedContent
    }
  }

  handleKeyboardShortcuts () {
    this.shortcutsDialog = true
  }
}
</script>
