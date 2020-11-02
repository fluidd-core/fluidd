<template>
  <v-card color="tertiary" class="filesystem-wrapper">
    <v-card-title class="quaternary rounded-t py-1" v-if="showTitle">
      <v-icon left>$files</v-icon>
      <span class="font-weight-light">{{ panelTitle }}</span>
      <v-spacer></v-spacer>
      <v-select
        v-if="isMultiRoot"
        style="max-width: 190px;"
        dense
        solo
        hide-details
        v-model="currentRoot"
        :items="root">
      </v-select>
    </v-card-title>
    <v-divider v-if="showTitle"></v-divider>
    <file-system-browser
      :root="currentRoot"
      :show-meta-data="showMetaData"
      :accept="accept"
      :readonly="(this.currentRoot === 'config_examples') ? true : false"
      :dense="dense"
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
import { KlipperFile } from '@/store/files/types'

@Component({
  components: {
    FileSystemBrowser,
    DialogFileEditor
  }
})
export default class FileSystemCard extends Mixins(UtilsMixin) {
  @Prop({ type: [String, Array], required: true })
  root!: string | string[];

  @Prop({ type: Boolean, required: false, default: false })
  showMetaData!: boolean;

  @Prop({ type: String, required: false, default: '.gcode' })
  accept!: string;

  @Prop({ type: String, default: 'Jobs' })
  panelTitle!: string;

  @Prop({ type: Boolean, default: true })
  showTitle!: boolean;

  @Prop({ type: Boolean, default: false })
  dense!: boolean;

  currentRoot = ''

  dialog = {
    open: false,
    loading: false,
    contents: '',
    filename: '',
    path: ''
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

  edit (file: KlipperFile, path: string) {
    this.dialog = {
      open: true,
      loading: true,
      contents: '',
      filename: '',
      path: ''
    }
    this.getFile(`/server/files/${path}/${file.name}`)
      .then((response: AxiosResponse) => {
        this.dialog.filename = file.name || ''
        this.dialog.path = path
        this.dialog.contents = response.data
        this.dialog.loading = false
      })
  }

  upload (file: File, root: string, path: string) {
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
.filesystem-wrapper,
.file-system,
.file-system ::v-deep .v-data-table {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.v-text-field .v-select__slot .v-select__selection--comma {
  min-width: min-content;
}
</style>
