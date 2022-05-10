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
import getReferenceSection from '@/util/get-reference-section'
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
    if (!monaco) {
      const { default: promise } = await import(
        /* webpackChunkName: "monaco-editor" */
        /* webpackPrefetch: -100 */
        './setupMonaco'
      )
      monaco = await promise

      monaco.editor.registerCommand('fluidd_open_docs', (_, isMoonrakerConfig, hash) => {
        if (isMoonrakerConfig) {
          const url = this.$t('app.file_system.url.moonraker_config', { hash }).toString()
          window.open(url)
        } else {
          const url = this.$t('app.file_system.url.klipper_config', { hash }).toString()
          window.open(url)
        }
      })

      monaco.languages.registerCodeLensProvider('klipper-config', {
        provideCodeLenses: (model) => {
          const isMoonrakerConfig = model.uri.path.toLowerCase().endsWith('/moonraker.conf')

          const linesContent = model.getLinesContent()

          const sections = linesContent.reduce((ranges, lineContent, index) => {
            const section = /^\[([^\]]+)\]/.exec(lineContent)
            if (section) {
              const [sectionName] = section[1].split(' ')

              const referenceSection = getReferenceSection(sectionName)

              return ranges.concat({
                referenceSection,
                range: {
                  startLineNumber: index + 1,
                  startColumn: model.getLineFirstNonWhitespaceColumn(index + 1),
                  endLineNumber: index + 1,
                  endColumn: model.getLineLastNonWhitespaceColumn(index + 1)
                }
              })
            }
            return ranges
          }, [] as { referenceSection: string, range: Monaco.IRange }[])

          return {
            lenses: sections.map((section, index) =>
              ({
                range: section.range,
                id: `docs${index}`,
                command: {
                  id: 'fluidd_open_docs',
                  title: this.$t('app.file_system.label.view_section_documentation', { section: section.referenceSection }).toString(),
                  arguments: [isMoonrakerConfig, section.referenceSection]
                }
              })
            ),
            dispose: () => undefined
          }
        },
        resolveCodeLens: (_model, codeLens) => codeLens
      })

      monaco.languages.registerFoldingRangeProvider('klipper-config', {
        provideFoldingRanges: (model) => {
          const linesContent = model.getLinesContent()

          return linesContent.reduce((sections, lineContent, index) => {
            const isSection = /^\[([^\]]+)\]/.test(lineContent)

            if (isSection) {
              return sections.concat({
                start: index + 1,
                end: index + 1,
                kind: monaco.languages.FoldingRangeKind.Region
              })
            }

            const lastSection = sections.length > 0 ? sections[sections.length - 1] : undefined
            const isLastSectionComment = lastSection?.kind === monaco.languages.FoldingRangeKind.Comment

            const isComment = lineContent.startsWith('#')

            if (isComment && !isLastSectionComment) {
              return sections.concat({
                start: index + 1,
                end: index + 1,
                kind: monaco.languages.FoldingRangeKind.Comment
              })
            }

            if (lineContent.trim().length > 0 && isComment === isLastSectionComment) {
              sections[sections.length - 1].end = index + 1
            }

            return sections
          }, [] as Monaco.languages.FoldingRange[])
        }
      })
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
