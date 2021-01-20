<template>
  <v-card
    @dragenter.capture.prevent="dragEnter"
    @dragover.prevent
    @dragleave.self.prevent="dragLeave"
    @drop.prevent.stop="dropUpload"
    color="tertiary"
    class="filesystem-wrapper"
    :class="{ 'no-pointer-events': dragOverlay }"
    :height="height">

    <drag-overlay-widget v-model="dragOverlay"></drag-overlay-widget>
    <upload-overlay-widget v-model="uploadOverlay" :files="currentUploads"></upload-overlay-widget>

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
    <!-- <p>
      currentPath: {{ currentPath }}<br />
      trimmedPath: {{ trimmedPath }}
    </p> -->
    <file-system-browser
      :root="currentRoot"
      :show-meta-data="showMetaData"
      :accept="accept"
      :readonly="readOnly"
      :dense="dense"
      :upload-and-print="uploadAndPrint"
      :file-create="fileCreate"
      @current-path="currentPath = $event"
      @trimmed-path="trimmedPath = $event"
      @upload-file="upload"
      @create-dir="createdir"
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
import { AxiosResponse } from 'axios'
import { SocketActions } from '@/socketActions'
import FileSystemBrowser from '@/components/widgets/filesystem/FileSystemBrowser.vue'
import DialogFileEditor from '@/components/dialogs/dialogFileEditor.vue'
import DragOverlayWidget from '@/components/widgets/filesystem/DragOverlayWidget.vue'
import UploadOverlayWidget from '@/components/widgets/filesystem/UploadOverlayWidget.vue'
import UtilsMixin from '@/mixins/utils'
import { AppFile, FilesUpload } from '@/store/files/types'
import { Waits } from '@/globals'
import EventBus from '@/eventBus'

@Component({
  components: {
    FileSystemBrowser,
    DialogFileEditor,
    DragOverlayWidget,
    UploadOverlayWidget
  }
})
export default class FileSystemCard extends Mixins(UtilsMixin) {
  @Prop({ type: [String, Array], required: true })
  root!: string | string[];

  @Prop({ type: Boolean, required: false, default: false })
  showMetaData!: boolean;

  @Prop({ type: String, required: false })
  accept!: string;

  @Prop({ type: String, default: 'Jobs' })
  panelTitle!: string;

  @Prop({ type: Boolean, default: true })
  showTitle!: boolean;

  @Prop({ type: Boolean, default: false })
  dense!: boolean;

  @Prop({ type: [Number, String] })
  height!: number | string;

  @Prop({ type: Boolean, default: false })
  uploadAndPrint!: boolean

  @Prop({ type: Boolean, default: false })
  fileCreate!: boolean

  currentRoot = ''
  currentPath = ''
  trimmedPath = ''

  dragOverlay = false

  dialog = {
    open: false,
    loading: false,
    contents: '',
    filename: '',
    path: ''
  }

  get uploadOverlay () {
    return this.$store.state.files.uploads.length > 0
  }

  get currentUploads (): FilesUpload[] {
    return this.$store.state.files.uploads
  }

  get isMultiRoot () {
    return (Array.isArray(this.root))
  }

  get readOnly () {
    return (this.currentRoot === 'config_examples' || this.currentRoot === 'docs')
  }

  mounted () {
    this.currentRoot =
      (Array.isArray(this.root))
        ? this.root[0]
        : this.root
  }

  createdir (path: string) {
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

  edit (file: AppFile, root: string, path: string) {
    this.dialog = {
      open: true,
      loading: true,
      contents: '',
      filename: '',
      path: ''
    }

    let filepath = '/server/files'
    if (root) filepath += `/${root}`
    if (path) filepath += `/${path}`
    filepath += `/${file.name}`

    this.getFile(filepath)
      .then((response: AxiosResponse) => {
        this.dialog.filename = file.name || ''
        this.dialog.path = path
        this.dialog.contents = response.data
        this.dialog.loading = false
      })
  }

  ensureFileArray (files: FileList | File): Array<File> {
    if (files instanceof File) {
      return [files]
    }
    return Array.from(files)
  }

  async upload (files: FileList | File, andPrint: boolean) {
    const fileList = this.ensureFileArray(files)

    this.$store.dispatch('wait/addWait', Waits.onUploadGcode)
    await this.uploadFiles(fileList, this.currentRoot, this.trimmedPath, andPrint)
    this.$store.dispatch('wait/removeWait', Waits.onUploadGcode)
  }

  async dropUpload (e: DragEvent) {
    if (e && e.dataTransfer && e.dataTransfer.files.length && !this.readOnly) {
      this.upload(e.dataTransfer.files, false)
    }
  }

  async uploadFiles (files: Array<File>, root: string, path: string, andPrint: boolean) {
    // Async uploads cause issues in moonraker / klipper.
    // So instead, upload sequentially.
    for (const file of files) {
      try {
        const extension = '.' + file.name.split('.').pop()
        const accepts = this.accept.split(',')
        if (extension && accepts.includes(extension)) {
          await this.doUpload(file, root, path, andPrint)
        } else {
          EventBus.$emit('flashMessage', { type: 'warning', text: `Error uploading ${file.name}, invalid extension.` })
        }
      } catch (e) {
        EventBus.$emit('flashMessage', { type: 'error', text: `Error uploading ${file.name}<br />${e}` })
      }
    }
  }

  async doUpload (file: File, root: string, path: string, andPrint: boolean) {
    this.dragOverlay = false
    const formData = new FormData()
    let filename = file.name.replace(' ', '_')
    filename = `${path}/${filename}`
    filename = (filename.startsWith('/'))
      ? filename
      : '/' + filename
    formData.append('file', file, filename)
    formData.append('root', root)
    if (andPrint) {
      formData.append('print', 'true')
    }

    this.$store.dispatch('files/addFileUpload', { filename, percentComplete: 0 })

    return this.$http
      .post(
        this.apiUrl + '/server/files/upload',
        formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent: ProgressEvent) => {
            const percentComplete = Math.round(progressEvent.loaded / progressEvent.total * 100)
            this.$store.dispatch('files/updateFileUpload', { filename, percentComplete })
          }
        }
      )
      .then((response) => {
        this.$store.dispatch('files/removeFileUpload', filename)
        return response
      })
  }

  async saveEdit (restart: boolean, content: string, filename: string, path: string) {
    const file = new File([content], filename)
    this.dialog.loading = true
    await this.doUpload(file, this.currentRoot, path, false)
    this.dialog.loading = false
    this.dialog.contents = content
    if (restart) { SocketActions.printerFirmwareRestart() }
  }

  dragEnter () {
    if (!this.readOnly) {
      this.dragOverlay = true
    }
  }

  dragLeave () {
    if (!this.readOnly) {
      this.dragOverlay = false
    }
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

  .dragOverlay.v-overlay--active {
    border: dashed 3px #616161;
  }

  ::v-deep .dragOverlay > .v-overlay__content {
    width: 100%;
  }
</style>
