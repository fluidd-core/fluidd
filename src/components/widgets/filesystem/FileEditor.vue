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
import { Component, Prop, Ref, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
import md5AsBase64 from '@/util/md5-as-base64'
import type { InstanceConfig, RestoreViewState } from '@/store/config/types'
import consola from 'consola'
let monaco: typeof Monaco // dynamically imported

@Component({})
export default class FileEditor extends Mixins(BrowserMixin) {
  @Prop({ type: String, required: true })
  readonly value!: string

  @Prop({ type: String, required: true })
  readonly filename!: string

  @Prop({ type: Boolean })
  readonly readonly?: boolean

  @Prop({ type: Boolean, default: true })
  readonly codeLens?: boolean

  @Prop({ type: String, required: true })
  readonly path!: string

  @Ref('monaco-editor')
  readonly monacoEditor!: HTMLElement

  viewStateHash: string | null = null

  // Our editor, once init'd.
  editor: Monaco.editor.IStandaloneCodeEditor | null = null

  get restoreViewState (): RestoreViewState {
    return this.$store.state.config.uiSettings.editor.restoreViewState as RestoreViewState
  }

  get activeInstance (): InstanceConfig {
    return this.$store.getters['config/getCurrentInstance'] as InstanceConfig
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

    this.editor.addAction({
      id: 'action-save-file',
      label: this.$tc('app.general.btn.save'),
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        this.$emit('save')
      }
    })

    const filename = this.path ? `${this.path}/${this.filename}` : this.filename
    const apiFileUrl = `${this.activeInstance.apiUrl}/server/files/${filename}`

    // Define the model. The filename will map to the supported languages.
    const model = monaco.editor.createModel(
      this.value,
      undefined,
      monaco.Uri.file(filename)
    )
    this.editor.setModel(model)

    const restoreViewStateStorage = this.restoreViewStateStorage

    if (restoreViewStateStorage) {
      this.viewStateHash = 'monaco.' + md5AsBase64(apiFileUrl)

      const viewState = restoreViewStateStorage.getItem(this.viewStateHash)

      if (viewState) {
        this.editor.restoreViewState(JSON.parse(viewState))
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

    if (restoreViewStateStorage && this.viewStateHash) {
      const viewState = this.editor?.saveViewState()

      if (viewState) {
        try {
          restoreViewStateStorage.setItem(this.viewStateHash, JSON.stringify(viewState))
        } catch (e) {
          consola.error('[Storage] setItem', e)
        }
      }
    }

    if (monaco) monaco.editor.getModels().forEach(model => model.dispose())
    if (this.editor) this.editor.dispose()
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
