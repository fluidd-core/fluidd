<template>
  <AceEditor
    class="editor"
    v-model="code"
    @init="editorInit"
    lang="gcode"
    theme="monokai"
    width="100%"
    height="100%"
    :options="{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        fontSize: 14,
        highlightActiveLine: true,
        enableSnippets: false,
        showLineNumbers: true,
        tabSize: 2,
        showPrintMargin: false,
        showGutter: true
    }"
  ></AceEditor>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
// import * as monaco from 'monaco-editor'
import AceEditor from 'vuejs-ace-editor'

@Component({
  components: {
    AceEditor
  }
})
export default class AceEditorC extends Vue {
  @Prop({ type: String, required: true })
  value!: string;

  @Prop({ type: String, default: 'cfg' })
  fileExtension!: string;

  @Prop({ type: Boolean, default: false })
  readonly!: boolean;

  // @Ref('monaco-editor') monacoEditor!: HTMLElement

  @Watch('value')
  onContentsChange (val: string) {
    this.code = val
    // if (this.editor) this.editor.setValue(val)
  }

  code = ''

  // editor: monaco.editor.IStandaloneCodeEditor | undefined = undefined

  // theme: monaco.editor.IStandaloneThemeData = {
  //   base: 'vs-dark',
  //   inherit: true,
  //   rules: [],
  //   colors: {
  //     'editor.background': '#28282b'
  //   }
  // }

  // opts = {
  //   contextmenu: false,
  //   readOnly: false,
  //   automaticLayout: true,
  //   language: 'yaml',
  //   theme: 'my-theme',
  //   scrollbar: {
  //     useShadows: false
  //   }
  // }

  langMap: {[key: string]: string} = {
    md: 'markdown',
    cfg: 'ini',
    conf: 'ini',
    gcode: 'gcode'
  }

  editorInit () {
    require('brace/ext/language_tools')
    require('brace/mode/gcode')
    require('brace/theme/monokai')
  }

  mounted () {
    // monaco.editor.defineTheme('my-theme', this.theme)
    // this.editor = monaco.editor.create(this.monacoEditor, {
    //   ...this.opts,
    //   value: this.value
    // })
    // this.code = this.value
  }

  emitChange (val: string) {
    // this.$emit('input', val)
  }

  // highlighter (code: string) {
  //   const lang = this.langMap[this.fileExtension] || 'ini'
  //   const extension = this.fileExtension || 'cfg'
  //   return highlight(code, languages[lang], extension)
  // }
}
</script>

<style lang="scss">
  .editor {
    // margin-top: -48px;
    // padding-top: 48px;
  //   min-width: 100%;
    // height: calc(100% - 58px);
  }
</style>
