<template>
  <div class="editor-container d-flex">
    <div
      ref="monaco-editor"
      :class="(sidebar && !isMobile)?'editor':'editor-full'"
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
    <div
      v-if="sidebar && !isMobile"
      ref="editor-sidebar"
      class="editor-sidebar pa-2"
    >
      <v-card flat>
        <v-card-subtitle>
          <v-icon small>
            $tree
          </v-icon>
          {{ $t('app.file_system.label.structure') }}
        </v-card-subtitle>
        <v-divider />
        <div class="pa-2 heading">
          <div
            v-for="(item, index) in structures"
            :id="'line_'+item.index"
            :key="index"
            style="cursor: pointer"
            :class="(item.section!==undefined?'':'pl-5')+' px-2 d-flex justify-space-between align-center'"
            @click="gotoLine(item.index)"
          >
            <div
              v-if="item.section!==undefined"
              class="py-1"
            >
              <span :class="$vuetify.theme.dark?'mtk1':'mtk1'">[</span> <span
                :class="$vuetify.theme.dark?'mtk13':'mtk4'"
              >{{ item.section }}</span> <span :class="$vuetify.theme.dark?'mtk1':'mtk1'">]</span>
            </div>
            <div
              v-else
              class="py-1"
            >
              <span :class="$vuetify.theme.dark?'mtk1':'mtk13'">{{
                item.name
              }}</span>
            </div>
            <a
              :href="configMap.link + '#' + item.section_name"
              target="_blank"
            >
              <v-icon
                v-if="item.section!==undefined && configMap.link"
                class="float-right mr-3"
                color="secondary"
                size="20"
              >$help
              </v-icon>
            </a>
          </div>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts">
import { Vue, Component, Prop, Ref } from 'vue-property-decorator'
import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api'
let monaco: typeof Monaco // dynamically imported

interface Structure {
  index: number;
  section: string;
  section_name: string;
  name: string;
  value: string;
}

@Component({})
export default class FileEditor extends Vue {
  @Prop({ type: String, required: true })
  value!: string;

  @Prop({ type: String, required: true })
  filename!: string;

  @Prop({ type: Boolean, default: false })
  readonly!: boolean;

  @Prop({ type: Boolean, default: false })
  sidebar!: boolean;

  @Ref('monaco-editor') monacoEditor!: HTMLElement
  @Ref('editor-sidebar') editor_sidebar!: HTMLElement

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

  structures: Structure[] = []

  st: any[] = []

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }

  get configMap () {
    return this.$store.getters['server/getConfigMapByFilename'](this.filename)
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

    if (this.sidebar && !this.isMobile) {
      this.structures = this.parseFile(this.value)
      this.editor.onDidChangeCursorPosition(event => {
        console.log('cursor event', event.source)
        const lineNumber = event.position.lineNumber
        let sectionLineNumber = 0
        let itemLineNumber = 0
        for (let i = 0; i < this.structures.length; i++) {
          if (lineNumber < this.structures[i].index) break
          itemLineNumber = this.structures[i].index
          if (this.structures[i].section !== undefined) {
            sectionLineNumber = this.structures[i].index
          }
        }

        const sectionAnchor: HTMLElement | null = this.editor_sidebar.querySelector('#line_' + sectionLineNumber)
        const itemAnchor: HTMLElement | null = this.editor_sidebar.querySelector('#line_' + itemLineNumber)
        if (sectionAnchor && event.source === 'mouse') {
          this.editor_sidebar.scrollTop = sectionAnchor?.offsetTop - 80
        }

        if (itemAnchor) {
          const active: HTMLElement | null = this.editor_sidebar.querySelector('.active-item')
          if (active) {
            const activeClass = active.getAttribute('class')?.replace('active-item', '').trimEnd()
            active.setAttribute('class', activeClass || '')
          }
          itemAnchor.setAttribute('class', itemAnchor.getAttribute('class') + ' active-item')
        }
      })
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

  gotoLine (index: number) {
    if (this.editor) {
      this.editor.revealLineNearTop(index)
      this.editor.setPosition({ column: 1, lineNumber: index })
    }
  }

  parseFile (value: string) {
    const lines = value.split(/\n/gi)
    value = ''
    for (let i = 0; i < lines.length; i++) {
      value += '|' + i + '|' + lines[i] + '\n'
    }
    const regex = /(\|\d+\|)#.*|#.*/gi
    value = value.replace(regex, '$1')
    const regex2 = /^\|\d+\|[ \f\r\t\v]*$\n/gim
    value = value.replace(regex2, '')
    value = value + '|0|['
    const regex3 = /\|(?<index>\d+)\|(\[(?<section>.*?)\]|(?<name>\w+):(?<value>[^[]*?)(?=\|\d+\|\w+:|\|\d+\|\[))/gim
    const matchArrays = [...value.matchAll(regex3)]
    const items = []
    // let section = null
    for (const index in matchArrays) {
      const groups = matchArrays[index].groups
      if (groups) {
        const section = groups.section
        let section_key = groups.section
        if (section) {
          section_key = section.split(' ')[0]
        }
        items.push({
          index: parseInt(groups.index) + 1,
          section: section,
          section_name: section_key,
          name: groups.name,
          value: groups.value
        })
      }
    }
    return items
  }
}
</script>

<style lang="scss" scoped>
.editor {
  // margin-top: 12px;
  width: calc(100% - 400px);
  height: calc(100% - 48px);
}

.editor-full {
  width: 100%;
  height: calc(100% - 48px);
}

.editor-sidebar {
  //display: none;
  min-width: 400px;
  letter-spacing: 0px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+, edge */
  &::-webkit-scrollbar {
    display: none; /* Chrome Safari */
    // 或者 width: 0;
  }
}

.active-item {
  font-weight: bold;
  text-decoration: underline;
}

.editor-container {
  width: 100%;
  height: 100%;
}
</style>
