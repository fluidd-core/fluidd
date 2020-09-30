<template>
  <v-card class="file-system" elevation="5">
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
      sort-by="modified"
      hide-default-footer
      dense
      height="300"
    >
      <template v-slot:top>
        <v-toolbar flat color="#1E1E1E">
          <v-toolbar-title class="grey--text text--lighten-1">
            /{{ currentPath }}
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
              single-line
              hide-details>
            </v-text-field>
          </v-col>
          <v-btn small color="secondary" class="mr-2" @click="createDirectoryDialog()"><v-icon small>mdi-folder-plus</v-icon></v-btn>
          <btn-file-upload
            icon="mdi-upload"
            color="secondary"
            class="mr-2"
            accept=".gcode"
            @file-update="uploadFile">
          </btn-file-upload>
          <v-btn small color="secondary" @click="refreshPath(currentPath)"><v-icon small>mdi-refresh</v-icon></v-btn>
        </v-toolbar>
        <dialog-input
          :title="dialog.title"
          v-model="dialog.active"
          @save="saveDialog()">
          <v-text-field v-model="dialog.item.name" required></v-text-field>
        </dialog-input>
        <!-- <dialog-input
          title="Upload File"
          v-model="uploadDialog"
          @save="saveUpload()">
          <v-file-input accept=".gcode"></v-file-input>
        </dialog-input> -->
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
          @click="rowClick(item)"
        >
          <!-- <td class="px-0">
            <v-icon
              small
              color="grey"
              class="mr-1">
              mdi-drag
            </v-icon>
          </td> -->
          <td class="grey--text">
            <v-icon
              small
              :color="(item.type === 'file') ? 'grey' : 'primary'"
              class="mr-1">
              {{ (item.type === 'file' ? 'mdi-file' : item.name === '..' ? 'mdi-folder-upload' : 'mdi-folder') }}
            </v-icon>
            {{ item.name }}
          </td>
          <td class="grey--text">
            {{ (item.type === 'directory' && item.name === '..') ? '--' : formatDate(item.modified) }}
          </td>
          <td class="grey--text">{{ (item.type === 'file') ? formatSize(item.size) : '--' }}</td>
          <td class="px-0">
            <v-menu
              :offset-x="true"
              bottom
              left
              transition="slide-x-transition">
              <template v-slot:activator="{ on, attrs }">
                <v-btn small v-bind="attrs" v-on="on" icon color="white"><v-icon small>mdi-dots-vertical</v-icon></v-btn>
              </template>
              <v-list nav dense transition="slide-y-transition">
                <v-list-item link @click="printItem(item)" v-if="item.type !== 'directory'">
                  <v-list-item-title>Print</v-list-item-title>
                  <v-list-item-action>
                    <v-icon small>mdi-printer</v-icon>
                  </v-list-item-action>
                </v-list-item>
                <v-list-item link @click="downloadFile(item)" v-if="item.type !== 'directory'">
                  <v-list-item-title>Download</v-list-item-title>
                  <v-list-item-action>
                    <v-icon small>mdi-download</v-icon>
                  </v-list-item-action>
                </v-list-item>
                <v-list-item link @click="renameDialog(item)">
                  <v-list-item-title>Rename</v-list-item-title>
                  <v-list-item-action>
                    <v-icon small>mdi-form-textbox</v-icon>
                  </v-list-item-action>
                </v-list-item>
                <v-list-item link @click="removeItem(item)">
                  <v-list-item-title>Remove</v-list-item-title>
                  <v-list-item-action>
                    <v-icon small color="warning">mdi-delete-alert-outline</v-icon>
                  </v-list-item-action>
                </v-list-item>
              </v-list>
            </v-menu>
          </td>
          <td class="px-0" v-if="showMetaData">
            <v-btn
              icon
              small
              v-if="item.type === 'file'"
              @click="expand(!isExpanded)">
              <v-icon small>
                {{ (isExpanded) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
              </v-icon>
            </v-btn>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Directory, File } from '@/store/files/types'
import { SocketActions } from '@/socketActions'
import DialogInput from '@/components/dialogs/dialogInput.vue'
import BtnFileUpload from '@/components/inputs/BtnFileUpload.vue'
import { DialogData } from '@/types'
import { clone } from 'lodash-es'
import { AxiosResponse } from 'axios'

@Component({
  components: {
    DialogInput,
    BtnFileUpload
  }
})
export default class FileSystemWidget extends Vue {
  @Prop() root!: string;

  @Prop({ type: Boolean, required: false, default: false })
  showMetaData!: boolean;

  currentPath = ''
  search = ''
  loadingDirectory = false
  headers = [
    // { text: '', value: 'data-table-icons' },
    { text: 'name', value: 'name' },
    { text: 'modified', value: 'modified', width: '120px' },
    { text: 'size', value: 'size', width: '100px' },
    { text: '', value: 'actions', width: '30px', sortable: false }
  ]

  uploadDialog = false
  dialog: DialogData = {
    type: '',
    active: false,
    title: '',
    formLabel: '',
    item: {
      name: ''
    }
  };

  get directory () {
    return this.$store.getters['files/getDirectory'](this.root, this.currentPath)
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
    this.loadFiles(this.root)
  }

  refreshPath (path: string) {
    this.currentPath = path
    SocketActions.serverFilesGetDirectory('gcodes', path)
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
        item: clone(item),
        original: item,
        active: true
      }
    }
  }

  renameItem (item: File | Directory, original: File | Directory) {
    SocketActions.serverFilesMove(`${this.currentPath}/${original.name}`, `${this.currentPath}/${item.name}`)
  }

  createDirectoryDialog () {
    this.dialog = {
      type: 'createdir',
      title: 'Create Directory',
      formLabel: 'Name',
      item: { name: '' },
      active: true
    }
  }

  createDirectory (path: string) {
    SocketActions.serverFilesPostDirectory(`${this.currentPath}/${path}`)
  }

  removeItem (item: File | Directory) {
    if (item.type === 'file') {
      SocketActions.serverFilesDeleteFile(`${this.currentPath}/${item.name}`)
    } else {
      // TODO: This needs a warning dialog
      SocketActions.serverFilesDeleteDirectory(`${this.currentPath}/${item.name}`)
    }
  }

  uploadFile (file: globalThis.File) {
    const formData = new FormData()
    let filename = file.name.replace(' ', '_')
    filename = `${this.currentPath}/${filename}`.substring(7)
    formData.append('file', file, filename)
    console.log('uploading a file...', filename, formData)
    this.$http.post(
      this.apiUrl + '/server/files/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
  }

  // This feels hacky...
  downloadFile (item: File) {
    const filename = item.name || ''
    const filepath = `/server/files/${this.currentPath}/${item.name}`
    this.$http.get(
      this.apiUrl + filepath,
      { responseType: 'blob' }
    ).then((response: AxiosResponse) => {
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
    })
  }

  rowClick (item: File | Directory) {
    if (item.type === 'directory') {
      const dir = item as Directory
      if (item.name === '..') {
        const dirs = this.currentPath.split('/')
        const newpath = dirs.slice(0, -1).join('/')
        if (newpath === this.root) {
          this.loadFiles(this.root)
        } else {
          this.loadFiles(newpath)
        }
      } else {
        this.loadFiles(`${this.currentPath}/${dir.dirname}`)
      }
    }
  }
}
</script>
