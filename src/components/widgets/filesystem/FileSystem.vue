<template>
  <v-card
    color="tertiary"
    class="filesystem-wrapper"
    :height="height"
    @dragenter.capture.prevent="handleDragEnter"
    @dragover.prevent
    @dragleave.self.prevent="handleDragLeave"
    @drop.prevent.stop="handleDropFile"
    :class="{ 'no-pointer-events': dragState.overlay }">

    <file-system-drag-overlay
      v-model="dragState.overlay"
    ></file-system-drag-overlay>

    <file-system-upload-overlay
      :value="currentUploads.length > 0"
      :files="currentUploads"
    ></file-system-upload-overlay>

    <file-system-toolbar
      :roots="availableRoots"
      :root.sync="currentRoot"
      :search.sync="search"
      :path="visiblePath"
      @refresh="refreshPath(currentPath)"
      @add-file="handleAddFileDialog"
      @add-dir="handleAddDirDialog"
      @upload="handleUpload"
    ></file-system-toolbar>

    <file-system-browser
      :root="currentRoot"
      :dense="dense"
      :loading="filesLoading"
      :search="search"
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
    >
    </file-system-context-menu>

    <file-editor-dialog
      v-if="fileEditorDialogState.open"
      v-model="fileEditorDialogState.open"
      :contents="fileEditorDialogState.contents"
      :filename="fileEditorDialogState.filename"
      :loading="fileEditorDialogState.loading"
      :readonly="fileEditorDialogState.readonly"
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
import FileSystemDragOverlay from './FileSystemDragOverlay.vue'
import FileSystemUploadOverlay from './FileSystemUploadOverlay.vue'
import FileEditorDialog from '@/components/dialogs/FileEditorDialog.vue'
import FileNameDialog from '@/components/dialogs/FileNameDialog.vue'
import { AxiosResponse } from 'axios'

/**
 * NOTE: Generally, moonraker expects the paths to include the root.
 */
@Component({
  components: {
    FileSystemToolbar,
    FileSystemBrowser,
    FileSystemContextMenu,
    FileSystemDragOverlay,
    FileSystemUploadOverlay,
    FileEditorDialog,
    FileNameDialog
  }
})
export default class FileSystem extends Mixins(StateMixin, FilesMixin, ServicesMixin) {
  // Title. Defaults to Jobs
  @Prop({ type: String, default: 'Jobs' })
  title!: string | string[];

  // Can be a list of roots, or a single root.
  @Prop({ type: [String, Array], required: true })
  roots!: string | string[];

  // If dense, hide the meta and reduce the overall size.
  @Prop({ type: Boolean, default: false })
  dense!: boolean

  // Constrain height
  @Prop({ type: [Number, String] })
  height!: number | string;

  // Maintains the path and root.
  currentPath = ''
  currentRoot = ''

  // Maintains search state.
  search = ''

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

  // Returns the current path with no root.
  get visiblePath (): string {
    if (this.currentPath.startsWith(`${this.currentRoot}`)) {
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
    return this.hasWait(`${Waits.onGetDirectory}${this.currentPath}`)
  }

  // Get a list of currently active uploads.
  get currentUploads (): FilesUpload[] {
    return this.$store.state.files.uploads
  }

  // Set the initial root and path, and load the dir.
  mounted () {
    this.currentRoot = this.availableRoots[0]
    this.currentPath = ''
    this.loadFiles(this.currentRoot)
  }

  // If the root changes, reset the path and load the root path files.
  @Watch('currentRoot')
  onRootChange (root: string) {
    if (root && root.length) {
      this.currentPath = ''
      this.loadFiles(root)
    }
  }

  // If the path changes, load the path files.
  @Watch('currentPath')
  onCurrentPathChange (path: string) {
    this.loadFiles(path)
  }

  // Sets a new path and loads the files if necessary.
  loadFiles (path: string) {
    this.currentPath = path
    if (this.files.length <= 0) {
      this.refreshPath(path)
    }
  }

  // Refreshes a path by loading the directory.
  refreshPath (path: string) {
    this.currentPath = path
    SocketActions.serverFilesGetDirectory(this.currentRoot, path)
  }

  // Handles a user clicking a file row.
  handleRowClick (item: AppFile | AppDirectory, e: MouseEvent) {
    if (!this.contextMenuState.open) {
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
    let title = 'Rename Directory'
    let label = 'Directory name'
    const rules: any = [
      (v: string) => !!v || 'Required'
    ]
    if (item.type === 'file') {
      title = 'Rename File'
      label = 'Filename'
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
    this.fileNameDialogState = {
      open: true,
      title: 'Add File',
      label: 'Filename',
      value: '',
      rules: [(v: string) => !!v || 'Required'],
      handler: this.handleAddFile
    }
  }

  handleAddDirDialog () {
    this.fileNameDialogState = {
      open: true,
      title: 'Add Directory',
      label: 'Directory name',
      value: '',
      rules: [(v: string) => !!v || 'Required'],
      handler: this.handleAddDir
    }
  }

  handleFileOpenDialog (file: AppFile | AppFileWithMeta) {
    // Open the dialog, with no data - in a loading state.
    this.fileEditorDialogState = {
      open: true,
      contents: '',
      filename: file.filename,
      loading: true,
      readonly: this.rootProperties.readonly
    }

    const filepath = (this.currentPath) ? `${this.currentPath}/${file.filename}` : `${file.filename}`
    this.getFile(filepath)
      .then((response: AxiosResponse) => {
        this.fileEditorDialogState = {
          ...this.fileEditorDialogState,
          contents: response.data,
          loading: false
        }
      })
  }

  /**
   * ===========================================================================
   * Core file handling.
   * ===========================================================================
  */
  handlePrint (file: AppFile | AppFileWithMeta) {
    SocketActions.printerPrintStart(`${this.visiblePath}/${file.filename}`)

    // If we aren't on the dashboard, push the user back there.
    if (this.$router.currentRoute.path !== '/') {
      this.$router.push({ path: '/' })
    }
  }

  async handleSaveFileChanges (contents: string, restart: boolean) {
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
    if (file.type === 'directory') SocketActions.serverFilesDeleteDirectory(`${this.currentPath}/${file.name}`)
    if (file.type === 'file') SocketActions.serverFilesDeleteFile(`${this.currentPath}/${file.name}`)
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
