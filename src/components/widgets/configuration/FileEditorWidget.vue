<template>
  <prism-editor
    class="file-editor"
    :value="newValue"
    @input="emitChange($event)"
    :highlight="highlighter"
    :readonly="readonly"
    line-numbers>
  </prism-editor>
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { PrismEditor } from 'vue-prism-editor'
import 'vue-prism-editor/dist/prismeditor.min.css'
import 'prismjs/themes/prism-okaidia.css'

import { highlight, languages } from 'prismjs'
import 'prismjs/components/prism-ini'
import 'prismjs/components/prism-markdown'

@Component({
  components: {
    PrismEditor
  }
})
export default class FileEditorWidget extends Vue {
  @Prop({ type: String, required: true })
  value!: string;

  @Prop({ type: String, default: 'cfg' })
  fileExtension!: string;

  @Prop({ type: Boolean, default: false })
  readonly!: boolean;

  @Watch('value')
  onContentsChange (val: string) {
    this.newValue = val
  }

  newValue = ''
  langMap: {[key: string]: string} = {
    md: 'markdown',
    cfg: 'ini',
    conf: 'ini',
    gcode: 'gcode'
  }

  mounted () {
    this.newValue = this.value
  }

  emitChange (val: string) {
    this.newValue = val
    this.$emit('input', val)
  }

  highlighter (code: string) {
    const lang = this.langMap[this.fileExtension] || 'ini'
    const extension = this.fileExtension || 'cfg'
    return highlight(code, languages[lang], extension)
  }
}
</script>

<style lang="scss">
  .file-editor {
    background: #2d2d2d;
    color: #ccc;

    /* you must provide font-family font-size line-height. Example: */
    font-family: Fira code, Fira Mono, Consolas, Menlo, Courier, monospace;
    font-size: 14px;
    line-height: 1.5;
    padding: 5px;
  }

  /* optional class for removing the outline */
  .prism-editor__textarea:focus {
    outline: none;
  }
</style>
