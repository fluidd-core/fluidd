<template>
  <v-card color="tertiary">
    <v-card-title class="quaternary rounded-t">
      <v-row>
        <v-col cols="7" class="px-4 py-0">
          <v-icon left>{{ icons.files }}</v-icon>
          <span class="font-weight-light">{{ panelTitle }}</span>
        </v-col>
        <v-col cols="5" class="px-4 py-0" v-if="isMultiRoot">
          <v-select
            style="min-width: min-content;"
            dense
            filled
            hide-details
            max-width="120"
            v-model="currentRoot"
            :items="root">
          </v-select>
        </v-col>
      </v-row>
    </v-card-title>
    <v-divider></v-divider>
    <file-system-browser
      :root="currentRoot"
      :show-meta-data="showMetaData"
      :accept="accept"
      :readonly="(this.currentRoot === 'config_examples') ? true : false"
      @create-file="upload"
      @create-dir="create"
      @rename-file="rename"
      @rename-dir="rename"
      @remove-file="removeFile"
      @remove-dir="removeDir"
      @download-file="download"
      @edit-file="edit"
      @view-file="edit">
    </file-system-browser>
    <dialog-file-editor
      v-model="dialog.open"
      @save="saveEdit"
      :contents="dialog.contents"
      :filename="dialog.filename"
      :path="dialog.path"
      :loading="dialog.loading"
      :readonly="(this.currentRoot === 'config_examples') ? true : false"
    ></dialog-file-editor>
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import FileSystemBrowser from '@/components/widgets/filesystem/FileSystemBrowser.vue'
import { AxiosResponse } from 'axios'
import { SocketActions } from '@/socketActions'
import DialogFileEditor from '@/components/dialogs/dialogFileEditor.vue'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {
    FileSystemBrowser,
    DialogFileEditor
  }
})
export default class FileSystemWidget extends Mixins(UtilsMixin) {
  @Prop({ type: [String, Array], required: true })
  root!: string | string[];

  @Prop({ type: Boolean, required: false, default: false })
  showMetaData!: boolean;

  @Prop({ type: String, required: false, default: '.gcode' })
  accept!: string;

  // @Prop({ type: Boolean, default: false })
  // readonly!: boolean;

  @Prop({ type: String, default: 'Jobs' })
  panelTitle!: string;

  currentRoot = ''

  dialog = {
    open: false,
    loading: false,
    contents: '',
    filename: '',
    path: ''
  }

  get apiUrl () {
    return this.$store.state.config.apiUrl
  }

  get isMultiRoot () {
    return (Array.isArray(this.root))
  }

  mounted () {
    this.currentRoot =
      (Array.isArray(this.root))
        ? this.root[0]
        : this.root
  }

  create (path: string) {
    SocketActions.serverFilesPostDirectory(path)
  }

  rename (source: string, destination: string) {
    SocketActions.serverFilesMove(source, destination)
  }

  removeFile (path: string) {
    SocketActions.serverFilesDeleteFile(path)
  }

  removeDir (path: string) {
    SocketActions.serverFilesDeleteDirectory(path)
  }

  getFile (path: string) {
    const filepath = path
    return this.$http.get(
      this.apiUrl + filepath + '?date' + new Date().getTime(),
      {
        responseType: 'blob'
      }
    )
  }

  edit (file: File, path: string) {
    this.dialog = {
      open: true,
      loading: true,
      contents: '',
      filename: '',
      path: ''
    }
    this.getFile(`/server/files/${path}/${file.name}`)
      .then((response: AxiosResponse) => {
        const blob = new Blob([response.data])
        blob.text()
          .then((result) => {
            this.dialog.filename = file.name
            this.dialog.path = path
            this.dialog.contents = result
            this.dialog.loading = false
          })
      })
  }

  download (file: File, path: string) {
    const filename = file.name || ''
    this.getFile(`/server/files/${path}/${file.name}`)
      .then((response: AxiosResponse) => {
        const url = window.URL.createObjectURL(new Blob([response.data]))
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()
      })
  }

  upload (file: globalThis.File, root: string, path: string) {
    const formData = new FormData()
    let filename = file.name.replace(' ', '_')
    filename = `${path}/${filename}`.substring(7)
    formData.append('file', file, filename)
    formData.append('root', root)
    return this.$http.post(
      this.apiUrl + '/server/files/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
  }

  saveEdit (content: string, filename: string, path: string) {
    const file = new File([content], filename)
    this.dialog.loading = true
    this.upload(file, this.currentRoot, path)
      .then(() => {
        this.dialog.loading = false
        this.dialog.contents = content
      })
  }
}
</script>

<style lang="scss" scoped>
.v-text-field .v-select__slot .v-select__selection--comma {
  min-width: min-content;
}
</style>
