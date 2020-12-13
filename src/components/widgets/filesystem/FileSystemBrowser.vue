<template>
  <div class="file-system">
    <v-data-table
      mobile-breakpoint="0"
      :headers="headers"
      :items="directory.items"
      :dense="dense"
      :disable-pagination="true"
      :loading="loadingDirectory"
      :sort-desc="true"
      :custom-sort="$filters.fileSystemSort"
      :search="search"
      item-key="name"
      height="100%"
      no-data-text="No files"
      no-results-text="No files found"
      sort-by="modified"
      hide-default-footer
    >

      <template v-slot:top>
        <v-toolbar flat color="tertiary">
          <v-toolbar-title class="grey--text text--lighten-1 d-none d-sm-block">
            <div>/{{ trimmedPath }}</div>
          </v-toolbar-title>

          <v-spacer></v-spacer>
          <v-col cols="4" class="d-none d-sm-block">
            <v-text-field
              v-model="search"
              :max-width="130"
              label="Search"
              solo
              flat
              dense
              single-line
              hide-details>
              <template v-slot:append>
                <v-icon>$magnify</v-icon>
              </template>
            </v-text-field>
          </v-col>
          <file-system-controls
            :accept="accept"
            :readonly="readonly"
            :upload-loading="hasWait(waits.onUploadGcode)"
            :upload-and-print="uploadAndPrint"
            :file-create="fileCreate"
            @upload="uploadFile"
            @refresh="refreshPath(currentPath)"
            @folder-add="createDirectoryDialog()"
            @file-add="createFileDialog()"
            >
          </file-system-controls>
        </v-toolbar>
        <dialog-base
          :title="dialog.title"
          v-model="dialog.active">
          <template v-slot:actions>
            <v-btn color="secondary" @click="dialog.active = false">Close</v-btn>
            <v-btn color="primary" :disabled="!dialog.valid" type="submit" form="form">Save</v-btn>
          </template>
          <v-form
            ref="form"
            id="form"
            @submit="saveDialog()"
            v-model="dialog.valid">
            <v-text-field
              autofocus
              v-model="dialog.item.name"
              :rules="dialog.rules"
              required>
            </v-text-field>
          </v-form>
        </dialog-base>
      </template>

      <template v-slot:item="{ item }">
        <tr
          :class="{ 'is-directory': (item.type === 'directory'), 'is-file': (item.type === 'file') }"
          class="px-1"
          @click="rowClick(item, $event)"
          @contextmenu="openContextMenu(item, $event)"
        >
          <td>
            <!-- icons are 16px small, or 24px for standard size. -->
            <v-icon
              v-if="!item.thumbnails || !item.thumbnails.length"
              :small="dense"
              :color="(item.type === 'file') ? 'grey' : 'primary'"
              class="mr-1">
              {{ (item.type === 'file' ? '$file' : item.name === '..' ? '$folderUp' : '$folder') }}
            </v-icon>
            <img
              v-if="item.thumbnails && item.thumbnails.length"
              class="mr-1 file-icon-thumb"
              :src="getThumb(item).data"
              :width="(dense) ? 16 : 24"
            />

          </td>
          <td class="grey--text">
            {{ item.name }}
          </td>
          <td class="grey--text" v-if="showMetaData">
            <span v-if="item.type === 'file' && item.object_height">
              {{ item.object_height }} mm
            </span>
          </td>
          <td class="grey--text" v-if="showMetaData">
            <span v-if="item.type === 'file' && item.layer_height">
              {{ item.layer_height }} mm
            </span>
          </td>
          <td class="grey--text" v-if="showMetaData">
            <span v-if="item.type === 'file' && item.filament_total">
              {{ getReadableLengthString(item.filament_total) }}
            </span>
          </td>
          <td class="grey--text" v-if="showMetaData">
            <span v-if="item.type === 'file' && item.slicer">
              {{ item.slicer }}
            </span>
          </td>
          <td class="grey--text" v-if="showMetaData">
            <span v-if="item.type === 'file' && item.estimated_time">
              {{ formatCounterTime(item.estimated_time) }}
            </span>
          </td>
          <td class="grey--text">
            {{ (item.type === 'directory' && item.name === '..') ? '--' : formatDate(item.modified) }}
          </td>
          <td class="grey--text text-end">{{ (item.type === 'file') ? formatSize(item.size) : '--' }}</td>
        </tr>
      </template>
    </v-data-table>

    <v-menu
      v-model="contextMenu.open"
      :position-x="contextMenu.x"
      :position-y="contextMenu.y"
      min-width="180"
      absolute
      right>

      <v-card color="tertiary">
        <v-row align="center" justify="center" no-gutters>
          <v-col>
            <v-list
              nav
              dense
              color="secondary">
              <v-list-item
                link
                @click="printItem(contextMenu.item)"
                v-if="contextMenu.item.type !== 'directory' && contextMenu.item.extension === 'gcode'">
                <v-list-item-icon>
                  <v-icon class="white--text">$printer</v-icon>
                </v-list-item-icon>
                <v-list-item-title class="white--text">Print</v-list-item-title>
              </v-list-item>
              <v-list-item
                link
                @click="editItem(contextMenu.item)"
                v-if="!readonly && contextMenu.item.type !== 'directory' && contextMenu.item.extension !== 'gcode'">
                <v-list-item-icon>
                  <v-icon class="white--text">$pencil</v-icon>
                </v-list-item-icon>
                <v-list-item-title class="white--text">Edit</v-list-item-title>
              </v-list-item>
              <v-list-item
                link
                @click="viewItem(contextMenu.item)"
                v-if="readonly && contextMenu.item.type !== 'directory' && contextMenu.item.extension !== 'gcode'">
                <v-list-item-icon>
                  <v-icon class="white--text">$magnify</v-icon>
                </v-list-item-icon>
                <v-list-item-title class="white--text">View</v-list-item-title>
              </v-list-item>
              <v-list-item
                link
                @click="downloadFile(contextMenu.item.name)"
                v-if="contextMenu.item.type !== 'directory'">
                <v-list-item-icon>
                  <v-icon class="white--text">$download</v-icon>
                </v-list-item-icon>
                <v-list-item-title class="white--text">Download</v-list-item-title>
              </v-list-item>
              <v-list-item
                link
                @click="renameDialog(contextMenu.item)"
                v-if="!readonly">
                <v-list-item-icon>
                  <v-icon class="white--text">$rename</v-icon>
                </v-list-item-icon>
                <v-list-item-title class="white--text">Rename</v-list-item-title>
              </v-list-item>
              <v-list-item
                link
                @click="removeItem(contextMenu.item)"
                v-if="!readonly">
                <v-list-item-icon>
                  <v-icon class="white--text">$delete</v-icon>
                </v-list-item-icon>
                <v-list-item-title class="white--text">Remove</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-col>
          <v-col class="px-2 d-none d-sm-flex" v-if="contextMenu.item.thumbnails && contextMenu.item.thumbnails.length">
            <img
              class="mr-2 ml-2"
              :src="getThumb(contextMenu.item, true).data"
              :height="150"
            />
          </v-col>
        </v-row>
      </v-card>
    </v-menu>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Watch } from 'vue-property-decorator'
import { AppDirectory, AppFile, AppFileWithMeta } from '@/store/files/types'
import { SocketActions } from '@/socketActions'
import { getThumb } from '@/store/helpers'
import DialogBase from '@/components/dialogs/dialogBase.vue'
import FileSystemControls from '@/components/widgets/filesystem/FileSystemControls.vue'
import { FileSystemDialogData } from '@/types'
import { clone } from 'lodash-es'
import UtilsMixin from '@/mixins/utils'
import { DataTableHeader } from 'vuetify'

@Component({
  components: {
    DialogBase,
    FileSystemControls
  }
})
export default class FileSystemBrowser extends Mixins(UtilsMixin) {
  @Prop({ type: String, required: true })
  root!: string;

  @Prop({ type: Boolean, required: false, default: false })
  showMetaData!: boolean;

  @Prop({ type: String, required: false })
  accept!: string;

  @Prop({ type: Boolean, default: false })
  readonly!: boolean;

  @Prop({ type: Boolean, default: false })
  uploadAndPrint!: boolean

  @Prop({ type: Boolean, default: false })
  fileCreate!: boolean

  @Prop({ type: Boolean, default: false })
  dense!: boolean;

  currentRoot = ''
  currentPath = ''
  search = ''
  loadingDirectory = false
  headers: DataTableHeader[] = [
    { text: '', value: 'data-table-icons', sortable: false, width: '24px' },
    { text: 'name', value: 'name' },
    { text: 'modified', value: 'modified', width: '1%' },
    { text: 'size', value: 'size', width: '1%', align: 'end' }
  ]

  /* eslint-disable @typescript-eslint/no-explicit-any */
  contextMenu: any = {
    open: false,
    x: 0,
    y: 0,
    item: {
      filename: '',
      name: '',
      type: 'file',
      modified: 0,
      size: 0
    }
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  uploadDialog = false
  dialog: FileSystemDialogData = {
    type: '',
    valid: false,
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
    if (root && root.length) {
      this.currentRoot = root
      this.loadFiles(root)
    }
  }

  @Watch('currentPath')
  onCurrentPathChange (path: string) {
    this.$emit('current-path', path)
    this.$emit('trimmed-path', this.trimmedPath)
  }

  get directory (): AppFile[] | AppDirectory[] {
    return this.$store.getters['files/getDirectory'](this.currentRoot, this.currentPath)
  }

  // Returns the current path with no root.
  get trimmedPath (): string {
    if (this.currentPath.startsWith(`${this.root}`)) {
      const dirs = this.currentPath.split('/')
      dirs.shift()
      return (dirs)
        ? dirs.join('/')
        : ''
    }
    return this.currentPath
  }

  get apiUrl () {
    return this.$store.state.config.apiUrl
  }

  mounted () {
    this.currentRoot = this.root

    if (this.showMetaData) {
      this.headers = [
        ...this.headers.slice(0, 2),
        { text: 'height', value: 'object_height' },
        { text: 'layer height', value: 'layer_height' },
        { text: 'filament', value: 'filament_total' },
        { text: 'slicer', value: 'slicer' },
        { text: 'estimated time', value: 'estimated_time' },
        ...this.headers.slice(2)
      ]
    }
  }

  formatCounterTime (seconds: number) {
    return this.$filters.formatCounterTime(seconds)
  }

  getReadableLengthString (length: number) {
    return this.$filters.getReadableLengthString(length)
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

  formatDate (date: number) {
    return this.$filters.formatFileDateTime(date)
  }

  formatSize (size: number) {
    return this.$filters.getReadableFileSizeString(size)
  }

  printItem (item: AppFile) {
    const filename = `${this.currentPath}/${item.filename}`.replace(this.root, '')
    SocketActions.printerPrintStart(filename)
    if (this.$router.currentRoute.path !== '/') {
      this.$router.push({ path: '/' })
    }
  }

  saveDialog () {
    if (this.dialog.valid) {
      if (this.dialog.type === 'rename') {
        const item = this.dialog.item as AppFile | AppDirectory
        const original = this.dialog.original as AppFile | AppDirectory
        this.renameItem(item, original)
      }
      if (this.dialog.item && this.dialog.type === 'createdir') {
        const name = this.dialog.item.name
        if (name) {
          this.createDirectory(name)
        }
      }
      if (this.dialog.item && this.dialog.type === 'createfile') {
        const name = this.dialog.item.name
        if (name) {
          this.createFile(name)
        }
      }
      this.dialog.active = false
    }
  }

  renameDialog (item: AppFile | AppDirectory) {
    if (item) {
      this.dialog = {
        type: 'rename',
        title: 'Rename',
        valid: false,
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

  renameItem (item: AppFile | AppDirectory, original: AppFile | AppDirectory) {
    const source = `${this.currentPath}/${original.name}`
    const dest = `${this.currentPath}/${item.name}`

    if (item.type === 'file') {
      this.$emit('rename-file', source, dest)
    } else {
      this.$emit('rename-dir', source, dest)
    }
  }

  editItem (item: AppFile) {
    this.$emit('edit-file', item, this.root, this.trimmedPath)
  }

  viewItem (item: AppFile) {
    this.$emit('view-file', item, this.root, this.trimmedPath)
  }

  getThumb (item: AppFile | AppFileWithMeta, goLarge: boolean) {
    if ('thumbnails' in item) {
      const file = item as AppFileWithMeta
      return getThumb(file, goLarge)
    }
    return null
  }

  createDirectoryDialog () {
    this.dialog = {
      type: 'createdir',
      title: 'Create Directory',
      valid: false,
      formLabel: 'Name',
      rules: [
        (v: string) => !!v || 'Name is required',
        (v: string) => (v && v.length > 2) || 'Name must be greater than 2 characters'
      ],
      item: { name: '' },
      active: true
    }
  }

  createDirectory (name: string) {
    this.$emit('create-dir', `${this.currentPath}/${name}`)
  }

  createFileDialog () {
    this.dialog = {
      type: 'createfile',
      title: 'Create File',
      valid: false,
      formLabel: 'Name',
      rules: [
        (v: string) => !!v || 'Required',
        (v: string) => (v && v.length > 2) || 'Must be greater than 2 characters',
        (v: string) => {
          if (v && v.length && this.accept) {
            const e = this.accept.split(',')
            const r = e.filter((val) => v.endsWith(val)).length > 0
            return r || 'Must end with ' + this.accept
          }
          return true
        }
      ],
      item: { name: '' },
      active: true
    }
  }

  createFile (name: string) {
    const file = new File([''], name)
    this.$emit('upload-file', file, this.currentRoot, this.trimmedPath)
  }

  removeItem (item: AppFile | AppDirectory) {
    if (item.type === 'file') {
      this.$emit('remove-file', `${this.currentPath}/${item.name}`)
    } else {
      // TODO: This needs a warning dialog
      this.$emit('remove-dir', `${this.currentPath}/${item.name}`)
    }
  }

  uploadFile (file: File, andPrint: boolean) {
    this.$emit('upload-file', file, this.currentRoot, this.trimmedPath, andPrint)
  }

  downloadFile (file: string) {
    this.$emit('download-file', file, this.currentPath)
  }

  rowClick (item: AppFile | AppDirectory, e: MouseEvent) {
    if (!this.contextMenu.open) {
      if (item.type === 'directory') {
        const dir = item as AppDirectory
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

  openContextMenu (item: AppFile | AppDirectory, e: MouseEvent) {
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
