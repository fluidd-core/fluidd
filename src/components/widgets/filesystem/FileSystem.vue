<template>
  <v-card
    class="filesystem-wrapper"
    :height="height"
    :max-height="maxHeight"
    @dragenter.capture.prevent="handleDragEnter"
    @dragover.prevent
    @dragleave.self.prevent="handleDragLeave"
    @drop.prevent.stop="handleDropFile"
    :class="{ 'no-pointer-events': dragState.overlay }">

    <file-system-toolbar
      :roots="availableRoots"
      :root="currentRoot"
      :search.sync="search"
      :path="visiblePath"
      :disabled="disabled"
      :loading="filesLoading"
      @root-change="handleRootChange"
      @refresh="refreshPath(currentPath)"
      @add-file="handleAddFileDialog"
      @add-dir="handleAddDirDialog"
      @upload="handleUpload"
      @filter="handleFilter"
    ></file-system-toolbar>

    <file-system-browser
      :root="currentRoot"
      :dense="dense"
      :loading="filesLoading"
      :disabled="disabled"
      :search="search"
      :filters="filters"
      :files="files"
      :drag-state.sync="dragState.browserState"
      @row-click="handleRowClick"
      @move="handleMove"
    >
    </file-system-browser>

    <file-system-context-menu
      v-if="contextMenuState.open"
      :root="currentRoot"
      :open.sync="contextMenuState.open"
      :file="contextMenuState.file"
      :position-x="contextMenuState.x"
      :position-y="contextMenuState.y"
      @print="handlePrint"
      @view="handleFileOpenDialog"
      @edit="handleFileOpenDialog"
      @rename="handleRenameDialog"
      @remove="handleRemove"
      @download="handleDownload"
      @preheat="handlePreheat"
    >
    </file-system-context-menu>

    <file-editor-dialog
      v-if="fileEditorDialogState.open"
      v-model="fileEditorDialogState.open"
      :contents="fileEditorDialogState.contents"
      :filename="fileEditorDialogState.filename"
      :loading="fileEditorDialogState.loading"
      :readonly="fileEditorDialogState.readonly"
      :root="this.currentRoot"
      @save="handleSaveFileChanges"
    ></file-editor-dialog>

    <!-- A generic dialog to define the name of a file, or folder.
         Used to create, or rename a file or folder. -->
    <file-name-dialog
      v-if="fileNameDialogState.open"
      v-model="fileNameDialogState.open"
      :name="fileNameDialogState.value"
      :title="fileNameDialogState.title"
      :label="fileNameDialogState.label"
      :rules="fileNameDialogState.rules"
      @save="fileNameDialogState.handler"
    >
    </file-name-dialog>

    <file-system-drag-overlay
      v-model="dragState.overlay"
    ></file-system-drag-overlay>

    <file-system-download-dialog
      :value="currentDownload !== null"
      :file="currentDownload"
      @cancel="handleCancelDownload"
    >
    </file-system-download-dialog>

    <file-system-upload-dialog
      :value="currentUploads.length > 0"
      :files="currentUploads"
    >
    </file-system-upload-dialog>

    <!-- <pre>roots: {{ availableRoots }}</pre>
    <pre>currentRoot: {{ currentRoot }}<br />currentPath: {{ currentPath }}<br />visiblePath: {{ visiblePath }}</pre>
    <pre>dragState: {{ dragState }}</pre> -->
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Watch } from 'vue-property-decorator'
import { SocketActions } from '@/socketActions'
import { AppDirectory, AppFile, AppFileWithMeta, FilesUpload } from '@/store/files/types'
import { Waits } from '@/globals'
import consola from 'consola'
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'
import ServicesMixin from '@/mixins/services'
import FileSystemToolbar from './FileSystemToolbar.vue'
import FileSystemBrowser from './FileSystemBrowser.vue'
import FileSystemContextMenu from './FileSystemContextMenu.vue'
import FileEditorDialog from './FileEditorDialog.vue'
import FileNameDialog from './FileNameDialog.vue'
import FileSystemDragOverlay from './FileSystemDragOverlay.vue'
import FileSystemDownloadDialog from './FileSystemDownloadDialog.vue'
import FileSystemUploadDialog from './FileSystemUploadDialog.vue'
import { AxiosResponse, CancelTokenSource } from 'axios'

/**
 * NOTE: Generally, moonraker expects the paths to include the root.
 */
@Component({
  components: {
    FileSystemToolbar,
    FileSystemBrowser,
    FileSystemContextMenu,
    FileSystemDragOverlay,
    FileEditorDialog,
    FileNameDialog,
    FileSystemDownloadDialog,
    FileSystemUploadDialog
  }
})
export default class FileSystem extends Mixins(StateMixin, FilesMixin, ServicesMixin) {
  // Can be a list of roots, or a single root.
  @Prop({ type: [String, Array], required: true })
  roots!: string | string[];

  // If dense, hide the meta and reduce the overall size.
  @Prop({ type: Boolean, default: false })
  dense!: boolean

  // Constrain height
  @Prop({ type: [Number, String] })
  height!: number | string;

  // Constrain height
  @Prop({ type: [Number, String] })
  maxHeight!: number | string;

  // Maintains the path and root.
  // currentPath = ''
  currentRoot = ''

  // Maintains search state.
  search = ''

  // Maintains filter state.
  filters = []

  // Maintains content menu state.
  contextMenuState: any = {
    open: false,
    x: 0,
    y: 0,
    file: null
  }

  // Maintains drag overlay state.
  dragState = {
    browserState: false, // indicates if our browser is in a drag state.
    overlay: false // toggles our overlay for file drops.
  }

  // Maintains the file editor dialog state.
  fileEditorDialogState: any = {
    open: false,
    contents: '',
    filename: '',
    loading: false,
    readonly: false
  }

  // Maintains the name change dialog state.
  fileNameDialogState: any = {
    open: false,
    title: '',
    value: '',
    label: '',
    rules: [],
    handler: ''
  }

  // Maintains a cancel token source should we need to disable a request.
  cancelTokenSource: CancelTokenSource | undefined = undefined

  // Gets available roots.
  get availableRoots () {
    if (!Array.isArray(this.roots)) {
      return [this.roots]
    }
    return this.roots
  }

  get rootProperties () {
    return this.$store.getters['files/getRootProperties'](this.currentRoot)
  }

  get disabled () {
    return !this.$store.getters['files/isRootAvailable'](this.currentRoot)
  }

  @Watch('disabled')
  onDisabledChange (val: boolean) {
    // We know this always fires on mount, so we rely on it for our initial
    // load too.
    if (!val) {
      this.loadFiles(this.currentPath)
    }
  }

  get currentPath () {
    return this.$store.getters['files/getCurrentPathByRoot'](this.currentRoot) || this.currentRoot
  }

  set currentPath (path: string) {
    this.$store.dispatch('files/updateCurrentPathByRoot', { root: this.currentRoot, path })
  }

  // Returns the current path with no root.
  get visiblePath (): string {
    if (
      this.currentPath &&
      this.currentPath.startsWith(`${this.currentRoot}`)
    ) {
      const dirs = this.currentPath.split('/')
      dirs.shift()
      return (dirs)
        ? dirs.join('/')
        : ''
    }
    return this.currentPath
  }

  // Get the available files given the current root and path.
  get files (): AppFile[] | AppDirectory[] {
    const dir = this.$store.getters['files/getDirectory'](this.currentRoot, this.currentPath)
    if (
      dir &&
      dir.items
    ) {
      return dir.items
    }
    return []
  }

  // Determine if we're waiting for a directory load on our current path.
  get filesLoading () {
    return this.hasWait([
      `${Waits.onUpload}`,
      Waits.onFileSystem,
      `${Waits.onFileSystem}${this.currentPath}`
    ])
  }

  // Get a list of currently active uploads.
  get currentUploads (): FilesUpload[] {
    return this.$store.state.files.uploads
  }

  // Get the state of a currently file being retrieved.
  get currentDownload () {
    return this.$store.state.files.download
  }

  // Set the initial root, and load the dir.
  mounted () {
    this.currentRoot = this.availableRoots[0]
  }

  // If the root changes, reset the path and load the root path files.
  handleRootChange (root: string) {
    if (root.length) {
      this.currentRoot = root
      this.loadFiles(root)
    }
  }

  // Sets a new path and loads the files if necessary.
  loadFiles (path: string) {
    if (!this.disabled) {
      this.currentPath = path
      if (this.files.length <= 0) {
        this.refreshPath(path)
      }
    }
  }

  // Refreshes a path by loading the directory.
  refreshPath (path: string) {
    if (path && !this.disabled) SocketActions.serverFilesGetDirectory(this.currentRoot, path)
  }

  // Handles a user filtering the data.
  handleFilter (filters: any) {
    this.filters = filters
  }

  // Handles a user clicking a file row.
  handleRowClick (item: AppFile | AppDirectory, e: MouseEvent) {
    if (!this.contextMenuState.open && !this.disabled) {
      if (item.type === 'directory' && e.type !== 'contextmenu') {
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
        // Open the context menu
        this.contextMenuState.x = e.clientX
        this.contextMenuState.y = e.clientY
        this.contextMenuState.file = item
        this.$nextTick(() => {
          this.contextMenuState.open = true
        })
      }
    }
  }

  /**
   * ===========================================================================
   * Dialog handling.
   * ===========================================================================
  */
  handleRenameDialog (item: AppFile | AppFileWithMeta | AppDirectory) {
    if (this.disabled) return
    let title = this.$t('app.file_system.title.rename_dir')
    let label = this.$t('app.file_system.label.dir_name')
    const rules: any = [
      (v: string) => !!v || this.$t('app.general.simple_form.error.required')
    ]
    if (item.type === 'file') {
      title = this.$t('app.file_system.title.rename_file')
      label = this.$t('app.file_system.label.file_name')
    }
    this.fileNameDialogState = {
      open: true,
      title,
      label,
      value: item.name,
      rules,
      handler: this.handleRename
    }
  }

  handleAddFileDialog () {
    if (this.disabled) return
    this.fileNameDialogState = {
      open: true,
      title: this.$t('app.file_system.title.add_file'),
      label: this.$t('app.file_system.label.file_name'),
      value: '',
      rules: [(v: string) => !!v || this.$t('app.general.simple_form.error.required')],
      handler: this.handleAddFile
    }
  }

  handleAddDirDialog () {
    if (this.disabled) return
    this.fileNameDialogState = {
      open: true,
      title: this.$t('app.file_system.title.add_dir'),
      label: this.$t('app.file_system.label.dir_name'),
      value: '',
      rules: [(v: string) => !!v || this.$t('app.general.simple_form.error.required')],
      handler: this.handleAddDir
    }
  }

  handleFileOpenDialog (file: AppFile | AppFileWithMeta) {
    // Grab the file. This should provide a dialog.
    this.cancelTokenSource = this.$http.CancelToken.source()
    this.getFile(
      file.filename,
      this.currentPath,
      file.size,
      {
        responseType: 'text',
        transformResponse: [v => v],
        cancelToken: this.cancelTokenSource.token
      }
    )
      .then((response: AxiosResponse) => {
        // Open the edit dialog.
        this.fileEditorDialogState = {
          open: true,
          contents: response.data,
          filename: file.filename,
          loading: false,
          readonly: this.rootProperties.readonly
        }
      })
      .catch(reason => {
        consola.debug(reason)
      })
  }

  handleCancelDownload () {
    if (this.cancelTokenSource) this.cancelTokenSource.cancel('User cancelled.')
    this.$store.dispatch('files/removeFileDownload')
  }

  /**
   * ===========================================================================
   * Core file handling.
   * ===========================================================================
  */
  handlePrint (file: AppFile | AppFileWithMeta) {
    if (this.disabled) return
    SocketActions.printerPrintStart(`${this.visiblePath}/${file.filename}`)

    // If we aren't on the dashboard, push the user back there.
    if (this.$router.currentRoute.path !== '/') {
      this.$router.push({ path: '/' })
    }
  }

  async handleSaveFileChanges (contents: string, restart: boolean) {
    if (contents.length > 0) {
      const file = new File([contents], this.fileEditorDialogState.filename)
      if (!restart && this.fileEditorDialogState.open) this.fileEditorDialogState.loading = true
      await this.uploadFile(file, this.visiblePath, this.currentRoot, false)
      this.fileEditorDialogState.loading = false
      if (restart) {
        if (
          this.fileEditorDialogState.filename &&
          this.fileEditorDialogState.filename === 'moonraker.conf'
        ) {
          this.serviceRestartMoonraker()
        } else {
          this.firmwareRestartKlippy()
        }
      }
    }
  }

  handleMove (source: AppFile | AppFileWithMeta | AppDirectory, destination: AppDirectory) {
    let destinationPath = `${this.currentPath}/${destination.dirname}`
    if (destination.dirname === '..') {
      const arr = this.currentPath.split('/')
      arr.pop()
      destinationPath = arr.join('/')
    }

    if (source.type === 'file') {
      const src = `${this.currentPath}/${source.filename}`
      const dest = (destinationPath)
        ? `${destinationPath}/${source.filename}`
        : `${source.filename}`
      SocketActions.serverFilesMove(src, dest)
    } else {
      const src = `${this.currentPath}/${source.dirname}`
      const dest = (destinationPath)
        ? `${destinationPath}/${source.dirname}`
        : `${source.dirname}`
      SocketActions.serverFilesMove(src, dest)
    }
  }

  handleRename (name: string) {
    const src = `${this.currentPath}/${this.fileNameDialogState.value}`
    const dest = `${this.currentPath}/${name}`
    SocketActions.serverFilesMove(src, dest)
  }

  handleRemove (file: AppFile | AppFileWithMeta | AppDirectory) {
    if (this.disabled) return
    let text = this.$tc('app.general.simple_form.msg.confirm')
    if (file.type === 'directory') text = this.$tc('app.file_system.msg.confirm')
    this.$confirm(
      text,
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )
      .then(res => {
        if (res) {
          if (file.type === 'directory') SocketActions.serverFilesDeleteDirectory(`${this.currentPath}/${file.name}`, true)
          if (file.type === 'file') SocketActions.serverFilesDeleteFile(`${this.currentPath}/${file.name}`)
        }
      })
  }

  async handleUpload (files: FileList, print: boolean) {
    this.$store.dispatch('wait/addWait', Waits.onUpload)
    this.uploadFiles(files, this.visiblePath, this.currentRoot, print)
    this.$store.dispatch('wait/removeWait', Waits.onUpload)
  }

  handleAddDir (name: string) {
    SocketActions.serverFilesPostDirectory(`${this.currentPath}/${name}`)
  }

  handleAddFile (name: string) {
    const file = new File([], name)
    consola.log('handle add file', name, this.currentPath)
    this.uploadFile(file, this.visiblePath, this.currentRoot, false)
  }

  handleDownload (file: AppFile | AppFileWithMeta) {
    this.downloadFile(file.filename, this.currentPath)
  }

  handlePreheat (file: AppFileWithMeta) {
    if (this.disabled) return
    if (
      file.first_layer_extr_temp &&
      file.first_layer_bed_temp &&
      !this.printerPrinting &&
      !this.printerPaused &&
      this.klippyReady
    ) {
      if (file.first_layer_extr_temp > 0) {
        this.sendGcode(`M104 S${file.first_layer_extr_temp}`)
      }
      if (file.first_layer_bed_temp > 0) {
        this.sendGcode(`M140 S${file.first_layer_bed_temp}`)
      }
    }
  }

  /**
   * ===========================================================================
   * Drag handling.
   * ===========================================================================
  */
  handleDragEnter () {
    if (!this.rootProperties.readonly && !this.dragState.browserState) {
      this.dragState.overlay = true
    }
  }

  handleDragLeave () {
    this.dragState.overlay = false
  }

  async handleDropFile (e: DragEvent) {
    this.dragState.overlay = false
    if (e && e.dataTransfer && e.dataTransfer.files.length && !this.rootProperties.readonly) {
      this.handleUpload(e.dataTransfer.files, false)
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
