<template>
  <v-card
    class="filesystem-wrapper"
    :height="height"
    :max-height="maxHeight"
    :class="{ 'no-pointer-events': dragState.overlay }"
    flat
    @dragenter.capture.prevent="handleDragEnter"
    @dragover.prevent
    @dragleave.self.prevent="handleDragLeave"
    @drop.prevent.stop="handleDropFile"
  >
    <file-system-toolbar
      v-if="selected.length <= 0"
      :roots="availableRoots"
      :root="currentRoot"
      :name="name"
      :search.sync="search"
      :path="visiblePath"
      :disabled="disabled"
      :loading="filesLoading"
      :headers="headers"
      @root-change="handleRootChange"
      @refresh="refreshPath(currentPath)"
      @add-file="handleAddFileDialog"
      @add-dir="handleAddDirDialog"
      @upload="handleUpload"
      @filter="handleFilter"
      @go-to-file="handleGoToFileDialog"
    />

    <file-system-bulk-actions
      v-if="selected.length > 0"
      :root="currentRoot"
      :path="visiblePath"
      @remove="handleRemove(selected)"
      @create-zip="handleCreateZip(selected)"
      @enqueue="handleEnqueue(selected)"
    />

    <file-system-browser
      v-if="headers"
      :headers="visibleHeaders"
      :root="currentRoot"
      :dense="dense"
      :loading="filesLoading"
      :disabled="disabled"
      :search="search"
      :files="files"
      :drag-state.sync="dragState.browserState"
      :bulk-actions="bulkActions"
      :selected.sync="selected"
      :large-thumbnails="currentRoot === 'timelapse'"
      @row-click="handleRowClick"
      @move="handleMove"
      @drag-start="handleDragStart"
    />

    <file-system-context-menu
      v-if="contextMenuState.open"
      v-model="contextMenuState.open"
      :root="currentRoot"
      :file="contextMenuState.file"
      :position-x="contextMenuState.x"
      :position-y="contextMenuState.y"
      @print="handlePrint"
      @view="handleFileOpenDialog"
      @edit="handleFileOpenDialog"
      @rename="handleRenameDialog"
      @duplicate="handleDuplicateDialog"
      @remove="handleRemove"
      @download="handleDownload"
      @preheat="handlePreheat"
      @preview-gcode="handlePreviewGcode"
      @view-thumbnail="handleViewThumbnail"
      @enqueue="handleEnqueue"
      @create-zip="handleCreateZip"
    />

    <file-editor-dialog
      v-if="fileEditorDialogState.open"
      v-model="fileEditorDialogState.open"
      :contents="fileEditorDialogState.contents"
      :filename="fileEditorDialogState.filename"
      :loading="fileEditorDialogState.loading"
      :readonly="fileEditorDialogState.readonly"
      :root="currentRoot"
      @save="handleSaveFileChanges"
    />

    <!-- A generic dialog to define the name of a file, or folder.
         Used to create, or rename a file or folder. -->
    <file-name-dialog
      v-if="fileNameDialogState.open"
      v-model="fileNameDialogState.open"
      :name="fileNameDialogState.value"
      :title="fileNameDialogState.title"
      :label="fileNameDialogState.label"
      @save="fileNameDialogState.handler"
    />

    <app-drag-overlay
      v-model="dragState.overlay"
      :message="$t('app.file_system.overlay.drag_files_folders_upload')"
      icon="$fileUpload"
    />

    <file-system-upload-dialog
      v-if="currentUploads.length > 0"
      :value="currentUploads.length > 0"
      :files="currentUploads"
      @cancel="handleCancelUpload"
    />

    <file-preview-dialog
      v-if="filePreviewState.open"
      :file="filePreviewState"
      removable
      downloadable
      @download="handleDownload"
      @remove="handleRemove"
    />

    <file-system-go-to-file-dialog
      v-if="goToFileDialogOpen"
      v-model="goToFileDialogOpen"
      :root="currentRoot"
      @path-change="loadFiles"
    />
  </v-card>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Watch } from 'vue-property-decorator'
import { SocketActions } from '@/api/socketActions'
import {
  AppDirectory,
  AppFile,
  AppFileWithMeta,
  FilesUpload,
  FileFilterType,
  FilePreviewState,
  FileBrowserEntry
} from '@/store/files/types'
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'
import ServicesMixin from '@/mixins/services'
import FileSystemToolbar from './FileSystemToolbar.vue'
import FileSystemBulkActions from './FileSystemBulkActions.vue'
import FileSystemBrowser from './FileSystemBrowser.vue'
import FileSystemContextMenu from './FileSystemContextMenu.vue'
import FileEditorDialog from './FileEditorDialog.vue'
import FileNameDialog from './FileNameDialog.vue'
import FileSystemUploadDialog from './FileSystemUploadDialog.vue'
import FileSystemGoToFileDialog from './FileSystemGoToFileDialog.vue'
import FilePreviewDialog from './FilePreviewDialog.vue'
import { AppTableHeader } from '@/types'
import { FileWithPath, getFilesFromDataTransfer } from '@/util/file-system-entry'

/**
 * Represents the filesystem, bound to moonrakers supplied roots.
 * Can be configured via props to look at a specific root, or many.
 *
 * NOTE: Generally, moonraker expects the paths to include the root.
 */
@Component({
  components: {
    FileSystemToolbar,
    FileSystemBulkActions,
    FileSystemBrowser,
    FileSystemContextMenu,
    FileEditorDialog,
    FileNameDialog,
    FileSystemUploadDialog,
    FileSystemGoToFileDialog,
    FilePreviewDialog
  }
})
export default class FileSystem extends Mixins(StateMixin, FilesMixin, ServicesMixin) {
  // Can be a list of roots, or a single root.
  @Prop({ type: [String, Array], required: true })
  readonly roots!: string | string[]

  @Prop({ type: String, required: false })
  readonly name!: string

  // If dense, hide the meta and reduce the overall size.
  @Prop({ type: Boolean, default: false })
  readonly dense!: boolean

  // Constrain height
  @Prop({ type: [Number, String] })
  readonly height!: number | string

  // Constrain height
  @Prop({ type: [Number, String] })
  readonly maxHeight!: number | string

  // Allow bulk-actions
  @Prop({ type: Boolean, default: false })
  readonly bulkActions!: boolean

  // Ready. True once the available roots have loaded from moonraker.
  ready = false

  // Maintains the path and root.
  currentRoot = ''

  // Maintains search state.
  search = ''

  // Maintains filter state.
  get filters (): FileFilterType[] {
    return this.$store.state.config.uiSettings.fileSystem.activeFilters[this.currentRoot] ?? []
  }

  set filters (value: FileFilterType[]) {
    this.$store.dispatch('config/saveByPath', {
      path: `uiSettings.fileSystem.activeFilters.${this.currentRoot}`,
      value,
      server: true
    })
  }

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

  // Maintains any selected items and their state.
  selected: FileBrowserEntry[] = []

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
    handler: ''
  }

  filePreviewState: FilePreviewState = {
    open: false,
    type: '',
    filename: '',
    src: ''
  }

  goToFileDialogOpen = false

  @Watch('filePreviewState.open')
  onFilePreviewStateChanged (value: boolean) {
    if (!value && this.filePreviewState.src.startsWith('blob:')) {
      URL.revokeObjectURL(this.filePreviewState.src)
    }
  }

  // Gets available roots.
  get availableRoots () {
    if (!Array.isArray(this.roots)) {
      return [this.roots]
    }
    return this.roots
  }

  // Properties of the current root.
  get rootProperties () {
    return this.$store.getters['files/getRootProperties'](this.currentRoot)
  }

  // If this root is available or not.
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

  // The available headers, based on the current root and system configuration.
  get headers (): AppTableHeader[] {
    // Base headers. All roots have these.
    let headers: any = [
      { text: '', value: 'data-table-icons', sortable: false, width: '24px' },
      {
        text: this.$t('app.general.table.header.name'),
        value: 'name'
      }
    ]

    // If this is a gcode root, then metadata is available, including potentially history data.
    if (this.currentRoot === 'gcodes') {
      headers = [
        ...headers,
        { text: this.$t('app.general.table.header.height'), value: 'object_height', configurable: true },
        { text: this.$t('app.general.table.header.first_layer_height'), value: 'first_layer_height', configurable: true },
        { text: this.$t('app.general.table.header.layer_height'), value: 'layer_height', configurable: true },
        { text: this.$t('app.general.table.header.filament_name'), value: 'filament_name', configurable: true },
        { text: this.$t('app.general.table.header.filament_type'), value: 'filament_type', configurable: true },
        { text: this.$t('app.general.table.header.filament'), value: 'filament_total', configurable: true },
        { text: this.$t('app.general.table.header.filament_weight_total'), value: 'filament_weight_total', configurable: true },
        { text: this.$t('app.general.table.header.filament_used'), value: 'history.filament_used', configurable: true },
        { text: this.$t('app.general.table.header.nozzle_diameter'), value: 'nozzle_diameter', configurable: true },
        { text: this.$t('app.general.table.header.slicer'), value: 'slicer', configurable: true },
        { text: this.$t('app.general.table.header.slicer_version'), value: 'slicer_version', configurable: true },
        { text: this.$t('app.general.table.header.estimated_time'), value: 'estimated_time', configurable: true },
        { text: this.$t('app.general.table.header.print_duration'), value: 'history.print_duration', configurable: true },
        { text: this.$t('app.general.table.header.total_duration'), value: 'history.total_duration', configurable: true },
        { text: this.$t('app.general.table.header.first_layer_bed_temp'), value: 'first_layer_bed_temp', configurable: true },
        { text: this.$t('app.general.table.header.first_layer_extr_temp'), value: 'first_layer_extr_temp', configurable: true },
        { text: this.$t('app.general.table.header.chamber_temp'), value: 'chamber_temp', configurable: true },
        {
          text: this.$t('app.general.table.header.last_printed'),
          value: 'print_start_time',
          configurable: true
        }
      ]
    }

    // Final headers. All roots have these.
    headers = [
      ...headers,
      { text: this.$t('app.general.table.header.modified'), value: 'modified', width: '1%', configurable: true },
      { text: this.$t('app.general.table.header.size'), value: 'size', width: '1%', configurable: true }
    ]

    // Return headers
    const key = `${this.currentRoot}_${this.name}`
    return this.$store.getters['config/getMergedTableHeaders'](headers, key)
  }

  get visibleHeaders (): AppTableHeader[] {
    return this.headers.filter(header => header.visible || header.visible === undefined)
  }

  // The current path for the given root.
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
  get files (): FileBrowserEntry[] {
    const files = this.getAllFiles()

    const filteredFiles = files.filter(file => {
      if (this.currentRoot === 'timelapse' && file.type === 'file' && file.extension === 'jpg') {
        return false
      }

      for (const filter of this.filters) {
        switch (filter) {
          case 'hidden_files':
            if (file.name.match(/^\.(?!\.$)/)) {
              return false
            }
            break

          case 'klipper_backup_files':
            if (file.type === 'file' && file.filename.match(/^printer-\d{8}_\d{6}\.cfg$/)) {
              return false
            }
            break

          case 'print_start_time':
            if (file.type === 'file' && file.print_start_time !== null) {
              return false
            }
            break

          case 'rolled_log_files':
            if (file.type === 'file' && file.filename.match(/\.\d{4}-\d{2}-\d{2}$/)) {
              return false
            }
            break
        }
      }

      return true
    })

    return filteredFiles
  }

  getAllFiles () {
    const items = this.$store.getters['files/getDirectory'](this.currentPath) as FileBrowserEntry[] | undefined

    return items ?? []
  }

  @Watch('files')
  onFilesChange () {
    // If our file list changes, reset selected files.
    this.selected = []
  }

  // Determine if we're waiting for a directory load on our current path.
  get filesLoading () {
    return this.hasWaitsBy(`${this.$waits.onFileSystem}/${this.currentRoot}/`)
  }

  // Get a list of currently active uploads.
  get currentUploads (): FilesUpload[] {
    return this.$store.state.files.uploads
  }

  get registeredRoots () {
    return this.$store.state.server.info.registered_directories || []
  }

  includeTimelapseThumbnailFiles (items: FileBrowserEntry[]) {
    const thumbnailFilenames = new Set(items
      .filter((item): item is AppFileWithMeta => item.type === 'file' && item.extension !== 'jpg' && 'thumbnails' in item)
      .flatMap(item => item.thumbnails
        ? item.thumbnails.map(thumbnail => thumbnail.relative_path)
        : []
      ))

    const thumbnails = this.getAllFiles()
      .filter(file => file.type === 'file' && thumbnailFilenames.has(file.filename))

    items.push(...thumbnails)
  }

  // Set the initial root, and load the dir.
  @Watch('registeredRoots', { immediate: true })
  onRegisteredRoots (roots: string[]) {
    if (roots.length > 0 && !this.ready) {
      for (const root of this.availableRoots) {
        if (roots.includes(root)) {
          this.currentRoot = root
          this.ready = true
          break
        }
      }
    }
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
  handleRowClick (item: FileBrowserEntry, e: MouseEvent) {
    if (this.disabled) {
      return
    }

    if (this.contextMenuState.open) {
      this.contextMenuState.open = false

      if (e.type !== 'contextmenu') {
        return
      }
    }

    if (item.type === 'directory') {
      if (e.type === 'click') {
        if (item.dirname === '..') {
          const dirs = this.currentPath.split('/')
          const newpath = dirs.slice(0, -1).join('/')

          this.loadFiles(newpath)
        } else {
          this.loadFiles(`${this.currentPath}/${item.dirname}`)
        }

        // Clear selected bulk items if we're navigating folders.
        this.selected = []

        return
      } else if (item.dirname === '..') {
        return
      }
    }

    if (
      this.selected.length !== 0 &&
      !this.selected.some(x => x.name === item.name)
    ) {
      return
    }

    if (
      item.type === 'file' &&
      e.type === 'click' && (
        this.$store.state.config.uiSettings.editor.autoEditExtensions.includes(`.${item.extension}`) ||
        this.currentRoot === 'timelapse'
      )
    ) {
      this.handleFileOpenDialog(item)

      return
    }

    // Open the context menu
    this.contextMenuState.x = e.clientX
    this.contextMenuState.y = e.clientY
    this.contextMenuState.file = this.selected.length > 1
      ? this.selected
      : item
    this.$nextTick(() => {
      this.contextMenuState.open = true
    })
  }

  /**
   * ===========================================================================
   * Dialog handling.
   * ===========================================================================
  */
  handleRenameDialog (item: FileBrowserEntry) {
    if (this.disabled) return

    const [title, label] = item.type === 'file'
      ? [this.$t('app.file_system.title.rename_file'), this.$t('app.file_system.label.file_name')]
      : [this.$t('app.file_system.title.rename_dir'), this.$t('app.file_system.label.dir_name')]

    this.fileNameDialogState = {
      open: true,
      title,
      label,
      value: item.name,
      handler: this.handleRename
    }
  }

  handleDuplicateDialog (item: FileBrowserEntry) {
    if (this.disabled) return

    const [title, label] = item.type === 'file'
      ? [this.$t('app.file_system.title.duplicate_file'), this.$t('app.file_system.label.file_name')]
      : [this.$t('app.file_system.title.duplicate_dir'), this.$t('app.file_system.label.dir_name')]

    this.fileNameDialogState = {
      open: true,
      title,
      label,
      value: item.name,
      handler: this.handleDuplicate
    }
  }

  handleAddFileDialog () {
    if (this.disabled) return
    this.fileNameDialogState = {
      open: true,
      title: this.$t('app.file_system.title.add_file'),
      label: this.$t('app.file_system.label.file_name'),
      value: '',
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
      handler: this.handleAddDir
    }
  }

  handleGoToFileDialog () {
    if (this.disabled) return
    this.goToFileDialogOpen = true
  }

  handleFileOpenDialog (file: AppFile) {
    if (this.currentRoot === 'timelapse' && file.extension === 'zip') {
      // don't download zipped frames before opening preview
      this.filePreviewState = {
        open: true,
        type: 'unknown',
        filename: file.filename,
        src: '',
        appFile: file
      }
      return
    }

    // Grab the file. This should provide a dialog.
    this.$store.dispatch('files/createFileTransferCancelTokenSource')

    this.getFile(
      file.filename,
      this.currentPath,
      file.size,
      {
        responseType: this.currentRoot === 'timelapse' ? 'arraybuffer' : 'text',
        transformResponse: [v => v],
        cancelToken: this.cancelTokenSource.token
      }
    )
      .then(response => {
        if (this.currentRoot === 'timelapse') {
          // Open the file preview dialog.
          const type = response.headers['content-type']
          const blob = new Blob([response.data], { type })
          this.filePreviewState = {
            open: true,
            type,
            filename: file.filename,
            src: URL.createObjectURL(blob),
            appFile: file
          }
        } else {
          // Open the edit dialog.
          this.fileEditorDialogState = {
            open: true,
            contents: response.data,
            filename: file.filename,
            loading: false,
            readonly: file.permissions === 'r' || this.rootProperties.readonly
          }
        }
      })
      .finally(() => this.$store.dispatch('files/removeFileDownload'))
      .catch(e => e)
  }

  async handlePreviewGcode (file: AppFile | AppFileWithMeta) {
    this.getGcode(file)
      .then(response => response?.data)
      .then((gcode) => {
        if (this.$router.currentRoute.path !== '/' || !this.$store.getters['layout/isEnabledInCurrentLayout']('gcode-preview-card')) {
          this.$router.push({ path: '/preview' })
        }

        this.$store.dispatch('gcodePreview/loadGcode', {
          file,
          gcode
        })
      })
      .catch(e => e)
      .finally(() => {
        this.$store.dispatch('files/removeFileDownload')
      })
  }

  async handleViewThumbnail (file: AppFileWithMeta) {
    const thumb = this.getThumb(file.thumbnails ?? [], this.currentRoot, file.path, true)

    if (thumb) {
      const thumbUrl = thumb.absolute_path || thumb.data || ''

      this.filePreviewState = {
        open: true,
        src: thumbUrl,
        type: 'image',
        filename: file.filename,
        width: thumb.width
      }
    }
  }

  /**
   * ===========================================================================
   * Core file handling.
   * ===========================================================================
  */
  handlePrint (file: AppFile) {
    if (this.disabled) return
    SocketActions.printerPrintStart(`${this.visiblePath}/${file.filename}`)

    // If we aren't on the dashboard, push the user back there.
    if (this.$router.currentRoute.path !== '/') {
      this.$router.push({ path: '/' })
    }
  }

  async handleSaveFileChanges (contents: string, restart: string) {
    if (contents.length > 0) {
      const file = new File([contents], this.fileEditorDialogState.filename)
      if (!restart && this.fileEditorDialogState.open) this.fileEditorDialogState.loading = true
      await this.uploadFile(file, this.visiblePath, this.currentRoot, false)
      this.fileEditorDialogState.loading = false
      if (restart) {
        if (restart === 'moonraker') {
          this.serviceRestartMoonraker()
          return
        }
        if (restart === 'klipper') {
          this.firmwareRestartKlippy()
          return
        }
        this.serviceRestartByName(restart)
      }
    }
  }

  handleMove (source: FileBrowserEntry | FileBrowserEntry[], destination: AppDirectory) {
    let destinationPath = `${this.currentPath}/${destination.dirname}`
    if (destination.dirname === '..') {
      const arr = this.currentPath.split('/')
      arr.pop()
      destinationPath = arr.join('/')
    }

    const items = (Array.isArray(source)) ? source.filter(item => (item.name !== '..')) : [source]

    if (this.currentRoot === 'timelapse') {
      this.includeTimelapseThumbnailFiles(items)
    }

    items.forEach((item) => {
      const src = `${this.currentPath}/${item.name}`
      const dest = destinationPath
        ? `${destinationPath}/${item.name}`
        : `${item.name}`
      SocketActions.serverFilesMove(src, dest)
    })
  }

  handleDragStart (source: FileBrowserEntry| FileBrowserEntry[], dataTransfer: DataTransfer) {
    if (this.currentRoot === 'gcodes') {
      const items = (Array.isArray(source)) ? source.filter(item => (item.name !== '..')) : [source]
      const files = items
        .filter((item): item is AppFile => item.type === 'file' && this.rootProperties.accepts.includes('.' + item.extension))

      if (files.length > 0) {
        const data = {
          path: files[0].path,
          jobs: files.map(file => file.name)
        }

        dataTransfer.setData('jobs', JSON.stringify(data))
      }
    }
  }

  handleRename (name: string) {
    const src = `${this.currentPath}/${this.fileNameDialogState.value}`
    const dest = `${this.currentPath}/${name}`
    SocketActions.serverFilesMove(src, dest)
  }

  handleDuplicate (name: string) {
    const src = `${this.currentPath}/${this.fileNameDialogState.value}`
    const dest = `${this.currentPath}/${name}`
    SocketActions.serverFilesCopy(src, dest)
  }

  async handleRemove (file: FileBrowserEntry | FileBrowserEntry[]) {
    if (this.disabled) return

    const res = await this.$confirm(
      this.$tc('app.file_system.msg.confirm'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (res) {
      this.filePreviewState.open = false

      const items = (Array.isArray(file)) ? file.filter(item => (item.name !== '..')) : [file]

      if (this.currentRoot === 'timelapse') {
        this.includeTimelapseThumbnailFiles(items)
      }

      items.forEach((item) => {
        if (item.type === 'directory') SocketActions.serverFilesDeleteDirectory(`${this.currentPath}/${item.dirname}`, true)
        if (item.type === 'file') SocketActions.serverFilesDeleteFile(`${this.currentPath}/${item.filename}`)
      })
    }
  }

  async handleUpload (files: FileList | File[] | FileWithPath[], print: boolean) {
    const wait = `${this.$waits.onFileSystem}/${this.currentPath}/`

    this.$store.dispatch('wait/addWait', wait)
    this.uploadFiles(files, this.visiblePath, this.currentRoot, print)
    this.$store.dispatch('wait/removeWait', wait)
  }

  handleCancelUpload (file: FilesUpload) {
    if (!file.complete) {
      // Hasn't started uploading...
      if (file.loaded === 0) {
        this.$store.dispatch('files/updateFileUpload', {
          filepath: file.filepath,
          cancelled: true
        })
      }

      // Started uploading, but not complete.
      if (file.loaded > 0 && file.loaded < file.size) {
        if (this.cancelTokenSource) {
          this.$store.dispatch('files/cancelFileTransferWithTokenSource', 'User cancelled.')
        }
      }
    }
  }

  handleAddDir (name: string) {
    SocketActions.serverFilesPostDirectory(`${this.currentPath}/${name}`)
  }

  handleAddFile (name: string) {
    const file = new File([], name)
    this.uploadFile(file, this.visiblePath, this.currentRoot, false)
  }

  handleDownload (file: AppFile) {
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
      if (file.chamber_temp && file.chamber_temp > 0) {
        this.sendGcode(`M141 S${file.chamber_temp}`)
      }
    }
  }

  handleEnqueue (file: FileBrowserEntry | FileBrowserEntry[]) {
    if (this.disabled) return

    const items = Array.isArray(file) ? file : [file]
    const filenames = items
      .filter((item): item is AppFile => item.type === 'file' && this.rootProperties.accepts.includes('.' + item.extension))
      .map(file => file.path ? `${file.path}/${file.filename}` : file.filename)

    if (filenames.length > 0) {
      SocketActions.serverJobQueuePostJob(filenames)
    }
  }

  handleCreateZip (file: FileBrowserEntry | FileBrowserEntry[]) {
    const dest = Array.isArray(file)
      ? `${this.currentPath}/${Date.now()}.zip`
      : `${this.currentPath}/${file.name}_${Date.now()}.zip`

    const items = (Array.isArray(file) ? file : [file])
      .map(item => `${this.currentPath}/${item.name}`)

    SocketActions.serverFilesZip(dest, items)
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

    if (!e.dataTransfer || this.rootProperties.readonly) {
      return
    }

    const files = await getFilesFromDataTransfer(e.dataTransfer)

    if (files) {
      this.handleUpload(files, false)
    }
  }
}
</script>

<style lang="scss" scoped>
  .filesystem-wrapper,
  .file-system,
  .file-system :deep(.v-data-table) {
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

  :deep(.dragOverlay > .v-overlay__content) {
    width: 100%;
  }
</style>
