<template>
  <v-card
    @dragenter.capture.prevent="dragEnter"
    @dragover.prevent
    @dragleave.self.prevent="dragLeave"
    @drop.prevent.stop="dropUpload"
    color="tertiary"
    class="filesystem-wrapper"
    :class="{ 'no-pointer-events': uploadOverlay.active }"
    :height="height">
    <v-overlay
      class="uploadOverlay"
      :value="uploadOverlay.active"
      :opacity="0.85"
      absolute
    >
      <v-layout column align-center>
        <v-icon x-large v-if="!uploadOverlay.uploading">$fileUpload</v-icon>
        <v-progress-circular
          v-if="uploadOverlay.uploading"
          indeterminate
          color="primary"
        ></v-progress-circular>
        <div class="text-h6 font-weight-light"><strong>Drag</strong> a file here</div>
      </v-layout>
    </v-overlay>
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
import FileSystemBrowser from '@/components/widgets/filesystem/FileSystemBrowser.vue'
import { AxiosResponse } from 'axios'
import { SocketActions } from '@/socketActions'
import DialogFileEditor from '@/components/dialogs/dialogFileEditor.vue'
import UtilsMixin from '@/mixins/utils'
import { AppFile } from '@/store/files/types'
import { Waits } from '@/globals'
import EventBus from '@/eventBus'

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

  uploadOverlay = {
    active: false,
    uploading: false
  }

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

  get readOnly () {
    return (this.currentRoot === 'config_examples')
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

  async upload (file: File, root: string, path: string, andPrint: boolean) {
    this.$store.dispatch('socket/addWait', Waits.onUploadGcode)
    await this.doUpload(file, root, path, andPrint)
    this.$store.dispatch('socket/removeWait', Waits.onUploadGcode)
  }

  async dropUpload (e: DragEvent) {
    if (e && e.dataTransfer && e.dataTransfer.files.length && !this.readOnly) {
      this.$store.dispatch('socket/addWait', Waits.onUploadGcode)
      this.uploadOverlay.uploading = true

      const files = e.dataTransfer.files
      // Async uploads cause issues in moonraker / klipper.
      // So instead, upload sequentially.
      for (const file of files) {
        try {
          const extension = '.' + file.name.split('.').pop()
          const accepts = this.accept.split(',')
          if (extension && accepts.includes(extension)) {
            await this.doUpload(file, this.currentRoot, this.trimmedPath, false)
          } else {
            EventBus.$emit('flashMessage', { type: 'warning', text: `Error uploading ${file.name}, invalid extension.` })
          }
        } catch (e) {
          EventBus.$emit('flashMessage', { type: 'error', text: `Error uploading ${file.name}<br />${e}` })
        }
      }
      this.uploadOverlay.uploading = false

      // await Promise.all(
      //   files.map(async file => {
      //     try {
      //       const extension = '.' + file.name.split('.').pop()
      //       const accepts = this.accept.split(',')
      //       if (extension && accepts.includes(extension)) {
      //         return await this.doUpload(file, this.currentRoot, this.trimmedPath)
      //       }
      //     } catch (e) {
      //       EventBus.$emit('flashMessage', { type: 'error', text: `Error uploading ${file.name}<br />${e}` })
      //     }
      //   })
      // )

      this.uploadOverlay.active = false
      this.$store.dispatch('socket/removeWait', Waits.onUploadGcode)
    }
  }

  async doUpload (file: File, root: string, path: string, andPrint: boolean) {
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
    return this.$http
      .post(
        this.apiUrl + '/server/files/upload',
        formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      )
  }

  async saveEdit (content: string, filename: string, path: string) {
    const file = new File([content], filename)
    this.dialog.loading = true
    await this.doUpload(file, this.currentRoot, path, false)
    this.dialog.loading = false
    this.dialog.contents = content
  }

  dragEnter () {
    if (!this.readOnly) {
      this.uploadOverlay.active = true
    }
  }

  dragLeave () {
    if (!this.readOnly) {
      this.uploadOverlay.active = false
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

  .uploadOverlay.v-overlay--active {
    border: dashed 3px #616161;
  }
</style>
