<template>
  <v-dialog
    v-model="open"
    :loading="loading"
    hide-overlay
    fullscreen
    persistent
    transition="dialog-bottom-transition"
    content-class="config-editor-overlay"
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
          @click="emitClose()"
        >
          <v-icon>$close</v-icon>
        </app-btn>
        <v-toolbar-title>
          {{ filename }}
          <v-icon
            v-if="readonly"
            small
            class="ml-1"
          >
            $lock
          </v-icon>
          <v-icon
            v-else-if="updatedContent !== lastSavedContent"
            small
            class="ml-1"
          >
            $circle
          </v-icon>
        </v-toolbar-title>

        <v-spacer />

        <v-toolbar-items>
          <app-btn
            v-if="canShowPeripheralsDialog && !$vuetify.breakpoint.smAndDown"
            @click="peripheralsDialogOpen = true"
          >
            <v-icon
              small
              left
            >
              $devices
            </v-icon>
            <span>{{ $t('app.file_system.title.devices') }}</span>
          </app-btn>
          <app-btn
            v-if="!useTextOnlyEditor"
            :disabled="!ready"
            @click="handleCommandPalette"
          >
            <v-icon
              small
              :left="!$vuetify.breakpoint.smAndDown"
            >
              $consoleLine
            </v-icon>
            <span v-if="!$vuetify.breakpoint.smAndDown">{{ $t('app.file_system.title.command_palette') }}</span>
          </app-btn>
          <app-btn
            v-if="!printerPrinting && configMap?.link"
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
            v-if="canSaveAndRestart"
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
          <v-tooltip
            v-if="!readonly"
            bottom
          >
            <template #activator="{ on, attrs }">
              <app-btn
                v-bind="attrs"
                :disabled="!ready"
                v-on="on"
                @click="emitSave(false)"
              >
                <v-icon>
                  $save
                </v-icon>
              </app-btn>
            </template>
            <span>{{ $t('app.general.btn.save') }}</span>
          </v-tooltip>
          <v-tooltip
            v-if="!readonly"
            bottom
          >
            <template #activator="{ on, attrs }">
              <app-btn
                v-bind="attrs"
                :disabled="!ready"
                v-on="on"
                @click="emitSave({ saveAs: true })"
              >
                <v-icon>
                  $saveAs
                </v-icon>
              </app-btn>
            </template>
            <span>{{ $t('app.general.btn.save_as') }}</span>
          </v-tooltip>
          <app-btn
            @click="emitClose()"
          >
            <v-icon>
              $close
            </v-icon>
          </app-btn>
        </v-toolbar-items>
      </v-toolbar>

      <file-editor
        v-if="contents !== undefined && !useTextOnlyEditor"
        ref="editor"
        v-model="updatedContent"
        :path="path"
        :filename="filename"
        :readonly="readonly"
        :can-save-and-restart="canSaveAndRestart"
        :code-lens="codeLens"
        @ready="editorReady = true"
        @save="emitSave()"
        @save-as="emitSave({ saveAs: true })"
        @save-and-restart="emitSave({ restart: true })"
        @emergency-stop="emergencyStop"
      />

      <file-editor-text-only
        v-if="contents !== undefined && useTextOnlyEditor"
        v-model="updatedContent"
        :filename="filename"
        :readonly="readonly"
        @ready="editorReady = true"
      />

      <peripherals-dialog
        v-if="peripheralsDialogOpen"
        v-model="peripheralsDialogOpen"
      />
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref, VModel, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
import FileEditor from './FileEditor.vue'
import FileEditorTextOnly from './FileEditorTextOnly.vue'
import isWebAssemblySupported from '@/util/is-web-assembly-supported'

@Component({
  components: {
    FileEditor,
    FileEditorTextOnly
  }
})
export default class FileEditorDialog extends Mixins(StateMixin, BrowserMixin) {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: String, required: true })
  readonly root!: string

  @Prop({ type: String, required: true })
  readonly path!: string

  @Prop({ type: String, required: true })
  readonly filename!: string

  @Prop({ type: String, required: true })
  readonly contents!: string

  @Prop({ type: Boolean })
  readonly loading?: boolean

  @Prop({ type: Boolean })
  readonly readonly?: boolean

  @Ref('editor')
  readonly editor?: FileEditor

  updatedContent: string | null = null
  lastSavedContent: string | null = null
  editorReady = false
  peripheralsDialogOpen = false

  get ready () {
    return (
      !this.loading &&
      this.editorReady &&
      !this.isUploading
    )
  }

  @Watch('ready')
  onReady (value: boolean) {
    if (value) {
      this.editor?.focus()
    }
  }

  get isWebAssemblySupported () {
    return isWebAssemblySupported()
  }

  get useTextOnlyEditor () {
    return this.isMobileUserAgent || !this.isWebAssemblySupported
  }

  get isUploading (): boolean {
    return this.$typedState.files.uploads.length > 0
  }

  get configMap () {
    return this.$typedGetters['server/getConfigMapByFilename'](this.filename)
  }

  get canSaveAndRestart (): boolean {
    return (
      !this.readonly &&
      !this.printerPrinting &&
      this.configMap?.serviceSupported === true
    )
  }

  get canShowPeripheralsDialog (): boolean {
    return (
      !this.readonly &&
      this.configMap?.serviceSupported === true
    )
  }

  get codeLens (): boolean {
    return this.$typedState.config.uiSettings.editor.codeLens
  }

  created () {
    this.updatedContent = this.contents
    this.lastSavedContent = this.contents
  }

  mounted () {
    window.addEventListener('beforeunload', this.handleBeforeUnload)
  }

  beforeDestroy () {
    window.removeEventListener('beforeunload', this.handleBeforeUnload)
  }

  get showDirtyEditorWarning () {
    const confirmDirtyEditorClose: boolean = this.$typedState.config.uiSettings.editor.confirmDirtyEditorClose

    return (
      confirmDirtyEditorClose &&
      this.updatedContent !== this.lastSavedContent
    )
  }

  async emitClose () {
    const result = (
      !this.showDirtyEditorWarning ||
      await this.$confirm(
        this.$tc('app.general.simple_form.msg.unsaved_changes'),
        { title: this.$tc('app.general.label.unsaved_changes'), color: 'card-heading', icon: '$error' }
      )
    )

    if (result) {
      this.open = false
    }
  }

  handleBeforeUnload (event: Event) {
    if (this.showDirtyEditorWarning) {
      event.preventDefault() // show browser-native "Leave site?" modal
      return ((event || window.event).returnValue = true) // fallback
    }
  }

  emitSave (options?: boolean | { restart?: boolean, saveAs?: boolean }) {
    if (this.editorReady) {
      const [restart, saveAs] = typeof options === 'object' && options != null
        ? [options.restart === true, options.saveAs === true]
        : [options === true, false]

      if (this.configMap?.serviceSupported && restart) {
        this.$emit('save', this.updatedContent, this.configMap.service)
        this.open = false
      } else {
        this.$emit(saveAs ? 'save-as' : 'save', this.updatedContent)
      }

      this.lastSavedContent = this.updatedContent
    }
  }

  handleCommandPalette () {
    this.editor?.showCommandPalette()
  }
}
</script>
