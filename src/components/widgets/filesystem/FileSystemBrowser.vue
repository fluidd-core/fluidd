<template>
  <div class="file-system">
    <v-data-table
      :headers="headers"
      :items="directory.items"
      item-key="name"
      :disable-pagination="true"
      :loading="loadingDirectory"
      :sort-desc="true"
      :custom-sort="$filters.fileSystemSort"
      :search="search"
      :single-expand="true"
      :show-expand="showMetaData"
      no-data-text="No files"
      no-results-text="No files found"
      sort-by="modified"
      hide-default-footer
      dense
      height="300"
    >

      <template v-slot:top>
        <v-toolbar flat color="tertiary">
          <v-toolbar-title class="grey--text text--lighten-1">
            <div>/{{ currentPath }}</div>
          </v-toolbar-title>

          <v-spacer></v-spacer>
          <v-col cols="4">
            <v-text-field
              v-model="search"
              :max-width="130"
              append-icon="mdi-magnify"
              label="Search"
              solo
              flat
              dense
              single-line
              hide-details>
            </v-text-field>
          </v-col>
          <v-btn
            v-if="!readonly"
            small
            color="secondary"
            class="mr-2"
            @click="createDirectoryDialog()">
            <v-icon small>{{ icons.folderAdd }}</v-icon>
          </v-btn>
          <btn-file-upload
            v-if="!readonly"
            icon="mdi-upload"
            color="secondary"
            class="mr-2"
            :accept="accept"
            @file-update="uploadFile">
          </btn-file-upload>
          <v-btn
            small
            color="secondary"
            @click="refreshPath(currentPath)">
            <v-icon small>{{ icons.refresh }}</v-icon>
          </v-btn>
        </v-toolbar>
        <dialog-input
          :title="dialog.title"
          v-model="dialog.active"
          @save="saveDialog()">
          <v-text-field
            v-model="dialog.item.name"
            :rules="dialog.rules"
            required>
          </v-text-field>
        </dialog-input>
      </template>

      <template v-slot:expanded-item="{ headers }">
        <tr class="is-expanded grey--text">
          <td :colspan="headers.length">
            <v-row>
              <v-col>
                Object Height: 0.0 <br />
                Layer Height: 2 <br />
                Print Time: 12 <br />
              </v-col>
              <v-col>
                Filament Usage: 1 <br />
                Slicer: SimpleSlicer <br />
                <!-- <img :src="'data:image/gif;base64,'+thumbnail.data" height="36px" /> -->
              </v-col>
            </v-row>
          </td>
        </tr>
      </template>

      <template v-slot:item="{ item, expand, isExpanded }">
        <tr
          :class="{ 'is-directory': (item.type === 'directory'), 'is-file': (item.type === 'file') }"
          class="px-1"
          @click="rowClick(item, $event)"
          @contextmenu="openContextMenu(item, $event)"
        >
          <td>
            <v-icon
              small
              :color="(item.type === 'file') ? 'grey' : 'primary'"
              class="mr-1">
              {{ (item.type === 'file' ? icons.file : item.name === '..' ? icons.folderUp : icons.folder) }}
            </v-icon>
          </td>
          <td class="grey--text">
            {{ item.name }}
          </td>
          <td class="grey--text">
            {{ (item.type === 'directory' && item.name === '..') ? '--' : formatDate(item.modified) }}
          </td>
          <td class="grey--text text-end">{{ (item.type === 'file') ? formatSize(item.size) : '--' }}</td>
          <td class="px-0" v-if="showMetaData">
            <v-btn
              icon
              small
              v-if="item.type === 'file'"
              @click="expand(!isExpanded)">
              <v-icon small>
                {{ (isExpanded) ? icons.chevronUp : icons.chevronDown }}
              </v-icon>
            </v-btn>
          </td>
        </tr>
      </template>
    </v-data-table>
    <v-menu
      v-model="contextMenu.open"
      :position-x="contextMenu.x"
      :position-y="contextMenu.y"
      min-width="180"
      absolute
      left>
      <v-list
        nav
        dense
        color="secondary">
        <v-list-item link @click="printItem(contextMenu.item)" v-if="contextMenu.item.type !== 'directory' && contextMenu.item.extension === 'gcode'">
          <v-list-item-icon>
            <v-icon class="white--text">{{ icons.printer }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="white--text">Print</v-list-item-title>
        </v-list-item>
        <v-list-item link @click="editItem(contextMenu.item)" v-if="!readonly && contextMenu.item.type !== 'directory' && contextMenu.item.extension !== 'gcode'">
          <v-list-item-icon>
            <v-icon class="white--text">{{ icons.pencil }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="white--text">Edit</v-list-item-title>
        </v-list-item>
        <v-list-item link @click="viewItem(contextMenu.item)" v-if="readonly && contextMenu.item.type !== 'directory' && contextMenu.item.extension !== 'gcode'">
          <v-list-item-icon>
            <v-icon class="white--text">{{ icons.magnify }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="white--text">View</v-list-item-title>
        </v-list-item>
        <v-list-item link @click="downloadFile(contextMenu.item)" v-if="contextMenu.item.type !== 'directory'">
          <v-list-item-icon>
            <v-icon class="white--text">{{ icons.download }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="white--text">Download</v-list-item-title>
        </v-list-item>
        <v-list-item link @click="renameDialog(contextMenu.item)" v-if="!readonly">
          <v-list-item-icon>
            <v-icon class="white--text">{{ icons.rename }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="white--text">Rename</v-list-item-title>
        </v-list-item>
        <v-list-item link @click="removeItem(contextMenu.item)" v-if="!readonly">
          <v-list-item-icon>
            <v-icon class="white--text">{{ icons.delete }}</v-icon>
          </v-list-item-icon>
          <v-list-item-title class="white--text">Remove</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Watch } from 'vue-property-decorator'
import { Directory, File } from '@/store/files/types'
import { SocketActions } from '@/socketActions'
import DialogInput from '@/components/dialogs/dialogInput.vue'
import BtnFileUpload from '@/components/inputs/BtnFileUpload.vue'
import { FileSystemDialogData } from '@/types'
import { clone } from 'lodash-es'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {
    DialogInput,
    BtnFileUpload
  }
})
export default class FileSystemBrowser extends Mixins(UtilsMixin) {
  @Prop({ type: String, required: true })
  root!: string;

  @Prop({ type: Boolean, required: false, default: false })
  showMetaData!: boolean;

  @Prop({ type: String, required: false, default: '.gcode' })
  accept!: string;

  @Prop({ type: Boolean, default: false })
  readonly!: boolean;

  currentRoot = ''
  currentPath = ''
  search = ''
  loadingDirectory = false
  headers = [
    { text: '', value: 'data-table-icons', sortable: false, width: '24px' },
    { text: 'name', value: 'name' },
    { text: 'modified', value: 'modified', width: '1%' },
    { text: 'size', value: 'size', width: '1%', align: 'end' }
    // { text: '', value: 'actions', width: '30px', sortable: false }
  ]

  contextMenu: {[key: string]: boolean | number | File | Directory | undefined } = {
    open: false,
    x: 0,
    y: 0,
    item: {
      dirname: '',
      filename: '',
      name: '',
      type: '',
      modified: 0,
      size: 0
    }
  }

  uploadDialog = false
  dialog: FileSystemDialogData = {
    type: '',
    active: false,
    title: '',
    formLabel: '',
    rules: [
      (v: string) => !!v || 'Name is required',
      (v: string) => (v && v.length > 2) || 'Name must be greater than 2 characters'
    ],
    item: {
      name: ''
    }
  };

  @Watch('root')
  onRootChange (root: string) {
    this.currentRoot = root
    this.loadFiles(root)
  }

  get directory (): File[] | Directory[] {
    return this.$store.getters['files/getDirectory'](this.currentRoot, this.currentPath)
  }

  get apiUrl () {
    return this.$store.state.config.apiUrl
  }

  mounted () {
    if (this.showMetaData) {
      this.headers.push({
        text: '',
        value: 'data-table-expand',
        width: '30px'
      })
    }

    this.currentRoot = this.root
  }

  selectRoot (root: string) {
    this.currentRoot = root
    this.loadFiles(root)
  }

  refreshPath (path: string) {
    this.currentPath = path
    SocketActions.serverFilesGetDirectory(this.currentRoot, path)
  }

  loadFiles (path: string) {
    this.currentPath = path
    if (this.directory.length <= 0) {
      this.refreshPath(path)
    }
  }

  formatDate (date: string) {
    return this.$filters.formatFileDateTime(date)
  }

  formatSize (size: number) {
    return this.$filters.getReadableFileSizeString(size)
  }

  printItem (item: File) {
    SocketActions.printerPrintStart(item.filename)
  }

  saveDialog () {
    if (this.dialog.type === 'rename') {
      const item = this.dialog.item as File | Directory
      const original = this.dialog.original as File | Directory
      this.renameItem(item, original)
    }
    if (this.dialog.item && this.dialog.type === 'createdir') {
      const name = this.dialog.item.name
      if (name) {
        this.createDirectory(name)
      }
    }
  }

  renameDialog (item: File | Directory) {
    if (item) {
      this.dialog = {
        type: 'rename',
        title: 'Rename',
        formLabel: 'Name',
        rules: [
          (v: string) => !!v || 'Name is required',
          (v: string) => (v && v.length > 2) || 'Name must be greater than 2 characters'
        ],
        item: clone(item),
        original: item,
        active: true
      }
    }
  }

  renameItem (item: File | Directory, original: File | Directory) {
    const source = `${this.currentPath}/${original.name}`
    const dest = `${this.currentPath}/${item.name}`

    if (item.type === 'file') {
      this.$emit('rename-file', source, dest)
    } else {
      this.$emit('rename-dir', source, dest)
    }
  }

  editItem (item: File) {
    this.$emit('edit-file', item, this.currentPath)
  }

  viewItem (item: File) {
    this.$emit('view-file', item, this.currentPath)
  }

  createDirectoryDialog () {
    this.dialog = {
      type: 'createdir',
      title: 'Create Directory',
      formLabel: 'Name',
      rules: [
        (v: string) => !!v || 'Name is required',
        (v: string) => (v && v.length > 2) || 'Name must be greater than 2 characters'
      ],
      item: { name: '' },
      active: true
    }
  }

  createDirectory (path: string) {
    this.$emit('create-dir', `${this.currentPath}/${path}`)
  }

  removeItem (item: File | Directory) {
    if (item.type === 'file') {
      this.$emit('remove-file', `${this.currentPath}/${item.name}`)
    } else {
      // TODO: This needs a warning dialog
      this.$emit('remove-dir', `${this.currentPath}/${item.name}`)
    }
  }

  uploadFile (file: globalThis.File) {
    this.$emit('create-file', file, this.currentRoot, this.currentPath)
  }

  // This feels hacky...
  downloadFile (file: File) {
    this.$emit('download-file', file, this.currentPath)
  }

  rowClick (item: File | Directory, e: MouseEvent) {
    if (!this.contextMenu.open) {
      if (item.type === 'directory') {
        const dir = item as Directory
        if (item.name === '..') {
          const dirs = this.currentPath.split('/')
          const newpath = dirs.slice(0, -1).join('/')
          if (newpath === this.currentRoot) {
            this.loadFiles(this.currentRoot)
          } else {
            this.loadFiles(newpath)
          }
        } else {
          this.loadFiles(`${this.currentPath}/${dir.dirname}`)
        }
      } else {
        this.openContextMenu(item, e)
      }
    }
  }

  openContextMenu (item: File | Directory, e: MouseEvent) {
    e.preventDefault()
    this.contextMenu.x = e.clientX
    this.contextMenu.y = e.clientY
    this.$nextTick(() => {
      this.contextMenu.item = item
      this.contextMenu.open = true
    })
  }
}
</script>
