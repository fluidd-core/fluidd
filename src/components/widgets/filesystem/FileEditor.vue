<template>
  <div
    ref="monaco-editor"
    class="editor"
  />
</template>

<script lang="ts">
import { Vue, Component, Prop, Ref } from 'vue-property-decorator'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
import { IGrammarDefinition, Registry } from 'monaco-textmate'
import { wireTmGrammars } from 'monaco-editor-textmate'
import themeDark from '@/monaco/theme/editor.dark.theme.json'
import themeLight from '@/monaco/theme/editor.light.theme.json'

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
  editor: monaco.editor.IStandaloneCodeEditor | undefined = undefined

  // Base editor options.
  opts = {
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
    // Register our custom TextMate languages.
    const registry = new Registry({
      getGrammarDefinition: async (scopeName): Promise<IGrammarDefinition> => {
        const fileName = scopeName.split('.').pop()
        return import(
          /* webpackChunkName: "grammar-[request]" */
          `@/monaco/language/${fileName}.tmLanguage.json`
        )
          .then(language => {
            return Promise.resolve({
              format: 'json',
              content: language.default
            })
          })
      }
    })

    // Load our grammars...
    const grammars = new Map()
    grammars.set('gcode', 'source.gcode')
    grammars.set('klipper-config', 'source.klipper-config')
    grammars.set('log', 'text.log')

    // ... and our languages
    monaco.languages.register({ id: 'gcode', extensions: ['gcode', 'g', 'gc', 'gco', 'ufp', 'nc'] })
    monaco.languages.register({ id: 'klipper-config', extensions: ['cfg', 'conf'] })
    monaco.languages.register({ id: 'log', extensions: ['log'] })

    // Define how commenting works.
    monaco.languages.setLanguageConfiguration('gcode', {
      comments: {
        lineComment: ';'
      }
    })
    monaco.languages.setLanguageConfiguration('klipper-config', {
      comments: {
        lineComment: '#'
      }
    })

    // Defined the themes.
    monaco.editor.defineTheme('dark-converted', themeDark as any)
    monaco.editor.defineTheme('light-converted', themeLight as any)

    // Set the correct theme.
    if (this.$vuetify.theme.dark) {
      monaco.editor.setTheme('dark-converted')
    } else {
      monaco.editor.setTheme('light-converted')
    }

    // Wire it up.
    await wireTmGrammars(monaco, registry, grammars)

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

    // Fire the editorMounted call.
    this.editorMounted()
  }

  editorMounted () {
    if (this.editor) {
      this.$emit('ready')
      this.editor.onDidChangeModelContent(event => {
        const value = this.editor?.getValue()
        this.emitChange(value, event)
      })
    }
  }

  // Ensure we dispose of our models and editor.
  destroyed () {
    monaco.editor.getModels().forEach(model => model.dispose())
    if (this.editor) this.editor.dispose()
  }

  emitChange (value: string | undefined, event: monaco.editor.IModelContentChangedEvent) {
    this.$emit('change', value, event)
    this.$emit('input', value)
  }
}
</script>

<style lang="scss">
  .editor {
    // margin-top: 12px;
    min-width: 100%;
    height: 90%;
    height: calc(100% - 48px);
  }
</style>
