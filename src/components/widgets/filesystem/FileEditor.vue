<template>
  <div class="editor" ref="monaco-editor"></div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Ref } from 'vue-property-decorator'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api'
// import { IGrammarDefinition, Registry } from 'monaco-textmate'
// import { wireTmGrammars } from 'monaco-editor-textmate'
import baseDark from '@/monaco/theme/base.dark.json'
import themeDark from '@/monaco/theme/editor.dark.theme.json'
import themeLight from '@/monaco/theme/editor.light.theme.json'

import type { LanguageId } from '@/monaco/register'
import type { ScopeName, TextMateGrammar, ScopeNameInfo } from '@/monaco/providers'

import { loadWASM, createOnigScanner, createOnigString } from 'vscode-oniguruma'
import { SimpleLanguageInfoProvider } from '@/monaco/providers'
import { registerLanguages } from '@/monaco/register'
import { rehydrateRegexps } from '@/monaco/configuration'
import VsCodeDarkTheme from '@/monaco/vs-dark-plus-theme'
import { IRawTheme } from 'vscode-textmate'

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
    const language = 'log'

    const languages: monaco.languages.ILanguageExtensionPoint[] = [
      {
        id: 'log',
        extensions: [
          '.log'
        ]
      }
    ]

    interface DemoScopeNameInfo extends ScopeNameInfo {
      path: string;
    }

    const grammars: {[scopeName: string]: DemoScopeNameInfo} = {
      'source.python': {
        language: 'python',
        path: 'MagicPython.tmLanguage.json'
      },
      'text.log': {
        language: 'log',
        path: 'log.tmLanguage.json'
      }
    }

    // This needs to fetch via webpack
    const fetchGrammar = async (scopeName: ScopeName): Promise<TextMateGrammar> => {
      const { path } = grammars[scopeName]
      const uri = `/grammars/${path}`
      const response = await fetch(uri)
      const grammar = await response.text()
      const type = path.endsWith('.json') ? 'json' : 'plist'
      return { type, grammar }
    }

    // This needs to fetch via webpack
    const fetchConfiguration = async (
      language: LanguageId
    ): Promise<monaco.languages.LanguageConfiguration> => {
      const uri = `/configurations/${language}.json`
      const response = await fetch(uri)
      const rawConfiguration = await response.text()
      return rehydrateRegexps(rawConfiguration)
    }

    const data: ArrayBuffer | Response = await this.loadVSCodeOnigurumWASM()
    loadWASM(data)
    const onigLib = Promise.resolve({
      createOnigScanner,
      createOnigString
    })

    // const theme = {
    //   ...baseDark
    // } as IRawTheme
    const theme = VsCodeDarkTheme

    const provider = new SimpleLanguageInfoProvider({
      grammars,
      fetchGrammar,
      configurations: languages.map((language) => language.id),
      fetchConfiguration,
      theme,
      onigLib,
      monaco
    })

    registerLanguages(
      languages,
      (language: LanguageId) => provider.fetchLanguageInfo(language),
      monaco
    )

    // Create an editor instance.
    this.editor = monaco.editor.create(this.monacoEditor, {
      value: this.value,
      language,
      theme: 'vs-dark',
      minimap: {
        enabled: true
      }
    })

    provider.injectCSS()

    // Define the model. The filename will map to the supported languages.
    // Focus the editor.
    this.editor.focus()

    // Fire the editorMounted call.
    this.editorMounted()
  }

  // Taken from https://github.com/microsoft/vscode/blob/829230a5a83768a3494ebbc61144e7cde9105c73/src/vs/workbench/services/textMate/browser/textMateService.ts#L33-L40
  async loadVSCodeOnigurumWASM (): Promise<Response | ArrayBuffer> {
    const response = await fetch('/onig.wasm')
    const contentType = response.headers.get('content-type')
    if (contentType === 'application/wasm') {
      return response
    }

    // Using the response directly only works if the server sets the MIME type 'application/wasm'.
    // Otherwise, a TypeError is thrown when using the streaming compiler.
    // We therefore use the non-streaming compiler :(.
    return await response.arrayBuffer()
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
