<template>
  <div
    ref="monaco-editor"
  >
    <div
      v-if="!editor"
      class="spinner"
    >
      <v-progress-circular
        indeterminate
        size="100"
        color="primary"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Ref, Mixins, Watch } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
import md5 from 'md5'
import type { InstanceConfig, RestoreViewState } from '@/store/config/types'
import { consola } from 'consola'
let monaco: typeof Monaco // dynamically imported

@Component({})
export default class FileEditor extends Mixins(BrowserMixin) {
  @Prop({ type: String, required: true })
  readonly value!: string

  @Prop({ type: String, required: true })
  readonly filename!: string

  @Prop({ type: Boolean })
  readonly readonly?: boolean

  @Prop({ type: Boolean })
  readonly canSaveAndRestart?: boolean

  @Prop({ type: Boolean, default: true })
  readonly codeLens?: boolean

  @Prop({ type: String, required: true })
  readonly path!: string

  @Ref('monaco-editor')
  readonly monacoEditor!: HTMLElement

  viewStateHash: string | null = null

  // Our editor, once init'd.
  editor: Monaco.editor.IStandaloneCodeEditor | null = null

  @Watch('filename')
  onFilenameChange () {
    if (this.restoreViewStateStorage) {
      this.viewStateHash = 'monaco.' + md5(this.apiFileUrl)
    }
  }

  get pathFilename (): string {
    return this.path ? `${this.path}/${this.filename}` : this.filename
  }

  get apiFileUrl (): string {
    return `${this.activeInstance?.apiUrl}/server/files/${this.pathFilename}`
  }

  get restoreViewState (): RestoreViewState {
    return this.$typedState.config.uiSettings.editor.restoreViewState
  }

  get activeInstance (): InstanceConfig | undefined {
    return this.$typedGetters['config/getCurrentInstance']
  }

  get restoreViewStateStorage (): Storage | undefined {
    switch (this.restoreViewState) {
      case 'local':
        return localStorage

      case 'session':
        return sessionStorage
    }
  }

  async mounted () {
    // Init the editor.
    await this.initEditor()
  }

  async initEditor () {
    if (!monaco) {
      const { default: promise } = await import('./setupMonaco')
      monaco = await promise
    }

    // Set the correct theme.
    if (this.$vuetify.theme.dark) {
      monaco.editor.setTheme('dark-converted')
    } else {
      monaco.editor.setTheme('light-converted')
    }

    // Create an editor instance.
    this.editor = monaco.editor.create(this.monacoEditor, {
      contextmenu: true,
      readOnly: this.readonly,
      codeLens: this.codeLens,
      automaticLayout: true,
      fontSize: 16,
      scrollbar: {
        useShadows: false
      },
      minimap: {
        enabled: (!this.isMobileViewport)
      },
      rulers: (this.isMobileViewport) ? [80, 120] : []
    })

    if (!this.readonly) {
      this.editor.addAction({
        id: 'action-save-file',
        label: this.$tc('app.general.btn.save'),
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
        run: () => {
          this.$emit('save')
        }
      })

      this.editor.addAction({
        id: 'action-save-file-as',
        label: this.$tc('app.general.btn.save_as'),
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyS],
        run: () => {
          this.$emit('save-as')
        }
      })
    }

    if (this.canSaveAndRestart) {
      this.editor.addAction({
        id: 'action-save-file-restart',
        label: this.$tc('app.general.btn.save_restart'),
        keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.KeyS],
        run: () => {
          this.$emit('save-and-restart')
        }
      })
    }

    this.editor.addAction({
      id: 'action-emergency-stop',
      label: this.$tc('app.general.tooltip.estop'),
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyE],
      run: () => {
        this.$emit('emergency-stop')
      }
    })

    // Define the model. The filename will map to the supported languages.
    const model = monaco.editor.createModel(
      this.value,
      undefined,
      monaco.Uri.file(this.pathFilename)
    )
    this.editor.setModel(model)

    const restoreViewStateStorage = this.restoreViewStateStorage

    if (restoreViewStateStorage) {
      this.viewStateHash = 'monaco.' + md5(this.apiFileUrl)

      const viewState = restoreViewStateStorage.getItem(this.viewStateHash)

      if (viewState) {
        this.editor.restoreViewState(JSON.parse(viewState) as Monaco.editor.ICodeEditorViewState | null)
      }
    }

    // Focus the editor.
    this.$nextTick(() => {
      focus()
    })

    this.$emit('ready')

    this.editor.onDidChangeModelContent(() => {
      const value = this.editor?.getValue()

      this.$emit('input', value)
    })
  }

  focus () {
    this.editor?.focus()
  }

  showCommandPalette () {
    if (this.editor) {
      this.editor.focus()
      this.editor.trigger(null, 'editor.action.quickCommand', null)
    }
  }

  // Ensure we dispose of our models and editor.
  destroyed () {
    const restoreViewStateStorage = this.restoreViewStateStorage

    if (this.editor && restoreViewStateStorage && this.viewStateHash) {
      const viewState = this.editor.saveViewState()

      try {
        restoreViewStateStorage.setItem(this.viewStateHash, JSON.stringify(viewState))
      } catch (e) {
        consola.error('[Storage] setItem', e)
      }
    }

    monaco?.editor.getModels().forEach(model => model.dispose())

    this.editor?.dispose()
  }
}
</script>

<style lang="scss" scoped>
  :deep() {
    // margin-top: 12px;
    min-width: 100%;
    height: 90%;
    height: calc(100% - 48px);
  }

  :deep(.spinner) {
    display:flex;
    justify-content:center;
    align-items:center;
    height:100vh;
  }
</style>
