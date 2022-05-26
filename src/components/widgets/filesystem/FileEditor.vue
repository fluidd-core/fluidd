<template>
  <div
    ref="monaco-editor"
    class="editor"
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
import { Vue, Component, Prop, Ref } from 'vue-property-decorator'
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
let monaco: typeof Monaco // dynamically imported

@Component({})
export default class FileEditor extends Vue {
  @Prop({ type: String, required: true })
  value!: string;

  @Prop({ type: String, required: true })
  filename!: string;

  @Prop({ type: Boolean, default: false })
  readonly!: boolean;

  @Ref('monaco-editor') monacoEditor!: HTMLElement

  // Our editor, once init'd.
  editor: Monaco.editor.IStandaloneCodeEditor | null = null

  // Base editor options.
  opts: Monaco.editor.IStandaloneEditorConstructionOptions = {
    contextmenu: false,
    readOnly: this.readonly,
    automaticLayout: true,
    fontSize: 16,
    scrollbar: {
      useShadows: false
    },
    minimap: {
      enabled: (!this.isMobile)
    },
    rulers: (this.isMobile) ? [80, 120] : []
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }

  async mounted () {
    // Init the editor.
    await this.initEditor()
  }

  async initEditor () {
    if (!monaco) {
      const { default: promise } = await import(
        /* webpackChunkName: "monaco-editor" */
        /* webpackPrefetch: -100 */
        './setupMonaco'
      )
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
      ...this.opts
    })

    // Define the model. The filename will map to the supported languages.
    const model = monaco.editor.createModel(
      this.value,
      undefined,
      monaco.Uri.file(this.filename)
    )
    this.editor.setModel(model)

    // Focus the editor.
    this.editor.focus()

    this.$emit('ready')
    this.editor.onDidChangeModelContent(event => {
      const value = this.editor?.getValue()
      this.emitChange(value, event)
    })
  }

  showCommandPalette () {
    if (this.editor) {
      this.editor.focus()
      this.editor.trigger(null, 'editor.action.quickCommand', null)
    }
  }

  // Ensure we dispose of our models and editor.
  destroyed () {
    if (monaco) monaco.editor.getModels().forEach(model => model.dispose())
    if (this.editor) this.editor.dispose()
  }

  emitChange (value: string | undefined, event: Monaco.editor.IModelContentChangedEvent) {
    this.$emit('change', value, event)
    this.$emit('input', value)
  }
}
</script>

<style lang="scss" scoped>
  .editor {
    // margin-top: 12px;
    min-width: 100%;
    height: 90%;
    height: calc(100% - 48px);
  }

  .editor > .spinner {
    display:flex;
    justify-content:center;
    align-items:center;
    height:100vh;
  }
</style>
