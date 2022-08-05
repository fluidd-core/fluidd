<template>
  <v-card
    class="filesystem-wrapper"
    :height="height"
    :max-height="maxHeight"
    :class="{ 'no-pointer-events': dragState.overlay }"
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
    />

    <file-system-bulk-actions
      v-if="selected.length > 0"
      :path="visiblePath"
      @remove="handleRemove(selected)"
    />

    <file-system-browser
      v-if="headers"
      :headers="visibleHeaders"
      :root="currentRoot"
      :dense="dense"
      :loading="filesLoading"
      :disabled="disabled"
      :search="search"
      :filters="filters"
      :files="files"
      :drag-state.sync="dragState.browserState"
      :bulk-actions="bulkActions"
      :selected.sync="selected"
      :large-thumbnails="timelapseBrowser"
      @row-click="handleRowClick"
      @move="handleMove"
    />

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
      @preview-gcode="handlePreviewGcode"
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
      :rules="fileNameDialogState.rules"
      @save="fileNameDialogState.handler"
    />

    <file-system-drag-overlay
      v-model="dragState.overlay"
    />

    <file-system-download-dialog
      v-if="currentDownload !== null"
      :value="currentDownload !== null"
      :file="currentDownload"
      @cancel="handleCancelDownload"
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
      @close="handleClosePreview"
      @download="handleDownload"
      @remove="handleRemove"
    />

    <!-- <pre>roots: {{ availableRoots }}</pre>
    <pre>currentRoot: {{ currentRoot }}<br />currentPath: {{ currentPath }}<br />visiblePath: {{ visiblePath }}</pre>
    <pre>dragState: {{ dragState }}</pre> -->
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
  FileFilter,
  KlipperFileWithMeta,
  FilePreviewState,
  FileBrowserEntry
} from '@/store/files/types'
import { Waits } from '@/globals'
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'
import ServicesMixin from '@/mixins/services'
import FileSystemToolbar from './FileSystemToolbar.vue'
import FileSystemBulkActions from './FileSystemBulkActions.vue'
import FileSystemBrowser from './FileSystemBrowser.vue'
import FileSystemContextMenu from './FileSystemContextMenu.vue'
import FileEditorDialog from './FileEditorDialog.vue'
import FileNameDialog from './FileNameDialog.vue'
import FileSystemDragOverlay from './FileSystemDragOverlay.vue'
import FileSystemDownloadDialog from './FileSystemDownloadDialog.vue'
import FileSystemUploadDialog from './FileSystemUploadDialog.vue'
import FilePreviewDialog from './FilePreviewDialog.vue'
import Axios, { AxiosResponse } from 'axios'
import { AppTableHeader } from '@/types'

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
    FileSystemDragOverlay,
    FileEditorDialog,
    FileNameDialog,
    FileSystemDownloadDialog,
    FileSystemUploadDialog,
    FilePreviewDialog
  }
})
export default class FileSystem extends Mixins(StateMixin, FilesMixin, ServicesMixin) {
  // Can be a list of roots, or a single root.
  @Prop({ type: [String, Array], required: true })
  public roots!: string | string[]

  @Prop({ type: String, required: false })
  public name!: string

  // If dense, hide the meta and reduce the overall size.
  @Prop({ type: Boolean, default: false })
  public dense!: boolean

  // Constrain height
  @Prop({ type: [Number, String] })
  public height!: number | string

  // Constrain height
  @Prop({ type: [Number, String] })
  public maxHeight!: number | string

  // Allow bulk-actions
  @Prop({ type: Boolean, default: false })
  public bulkActions!: boolean

  // Override behavior (thumbnails, click/view actions) for timelapse browser
  @Prop({ type: Boolean, default: false })
  public timelapseBrowser!: boolean

  // Ready. True once the available roots have loaded from moonraker.
  ready = false

  // Maintains the path and root.
  currentRoot = ''

  // Maintains search state.
  search = ''

  // Maintains filter state.
  filters: FileFilter[] = []

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
  selected: (FileBrowserEntry | AppFileWithMeta)[] = []

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

  filePreviewState: FilePreviewState = {
    open: false,
    type: '',
    filename: '',
    src: ''
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
        value: 'name',
        filter: (value: string) => {
          if (!this.filters) return true

          for (const filter of this.filters) {
            switch (filter.value) {
              case 'hidden_files':
                if (value.match(/^\.(?!\.$)/)) {
                  return false
                }
                break
              case 'klipper_backup_files':
                if (value.match(/^printer-\d{8}_\d{6}\.cfg$/)) {
                  return false
                }
                break
            }
          }
          return true
        }
      }
    ]

    // If this is a gcode root, then metadata is available, including potentially history data.
    if (this.currentRoot === 'gcodes') {
      headers = [
        ...headers,
        { text: this.$t('app.general.table.header.height'), value: 'object_height', configurable: true },
        { text: this.$t('app.general.table.header.first_layer_height'), value: 'first_layer_height', configurable: true },
        { text: this.$t('app.general.table.header.layer_height'), value: 'layer_height', configurable: true },
        { text: this.$t('app.general.table.header.filament'), value: 'filament_total', configurable: true },
        { text: this.$t('app.general.table.header.filament_weight_total'), value: 'filament_weight_total', configurable: true },
        { text: this.$t('app.general.table.header.filament_used'), value: 'history.filament_used', configurable: true },
        { text: this.$t('app.general.table.header.slicer'), value: 'slicer', configurable: true },
        { text: this.$t('app.general.table.header.slicer_version'), value: 'slicer_version', configurable: true },
        { text: this.$t('app.general.table.header.estimated_time'), value: 'estimated_time', configurable: true },
        { text: this.$t('app.general.table.header.print_duration'), value: 'history.print_duration', configurable: true },
        { text: this.$t('app.general.table.header.total_duration'), value: 'history.total_duration', configurable: true },
        { text: this.$t('app.general.table.header.first_layer_bed_temp'), value: 'first_layer_bed_temp', configurable: true },
        { text: this.$t('app.general.table.header.first_layer_extr_temp'), value: 'first_layer_extr_temp', configurable: true },
        {
          text: this.$t('app.general.table.header.last_printed'),
          value: 'print_start_time',
          filter: (value: string, search: string | null, item: FileBrowserEntry | AppFileWithMeta) => {
            const filter = this.filters.find(filter => filter.value === 'print_start_time')
            if (
              !this.filters ||
              this.filters.length === 0 ||
              !filter ||
              item.type !== 'file'
            ) return true
            return item.print_start_time === null
          },
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
    return this.getAllFiles(this.timelapseBrowser ? this.transformTimelapseItems : undefined)
  }

  getAllFiles (transformFunction?: (files: FileBrowserEntry[]) => FileBrowserEntry[]): FileBrowserEntry[] {
    const dir = this.$store.getters['files/getDirectory'](this.currentRoot, this.currentPath)
    if (
      dir &&
      dir.items
    ) {
      if (transformFunction) {
        return transformFunction(dir.items)
      }

      return dir.items
    }
    return []
  }

  @Watch('files')
  onFilesChange () {
    // If our file list changes, reset selected files.
    this.selected = []
  }

  // Determine if we're waiting for a directory load on our current path.
  get filesLoading () {
    return this.hasWaitsBy(Waits.onFileSystem)
  }

  // Get a list of currently active uploads.
  get currentUploads (): FilesUpload[] {
    return this.$store.state.files.uploads
  }

  // Get the state of a currently file being retrieved.
  get currentDownload () {
    return this.$store.state.files.download
  }

  get registeredRoots () {
    return this.$store.state.server.info.registered_directories || []
  }

  transformTimelapseItems (items: FileBrowserEntry[]) {
    const timelapses: {[key: string]: AppFile} = {}

    for (const item of items) {
      if (item.type === 'file' && item.extension !== 'jpg') {
        timelapses[item.filename.slice(0, -(item.extension.length + 1))] = item
      }
    }

    for (const item of items) {
      if (item.type === 'file' && item.extension === 'jpg') {
        const name = item.filename.slice(0, -4)
        if (name in timelapses) {
          const url = new URL(this.apiUrl ?? document.location.origin)
          url.pathname = `/server/files/timelapse${item.path ? `/${item.path}` : ''}/${item.filename}`;

          (timelapses[name] as KlipperFileWithMeta).thumbnails = [{
            absolute_path: url.toString(),
            // we have no data regarding the thumbnail other than it's URL, but setting it is mandatory...
            data: '',
            height: 0,
            width: 0,
            size: 0,
            relative_path: ''
          }]
        }
      }
    }

    return [...items.filter(item => item.type === 'directory'), ...Object.values(timelapses)]
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
        // Clear selected bulk items if we're navigating folders.
        this.selected = []
      } else {
        if (
          e.type === 'click' && item.type === 'file' &&
          (
            this.$store.state.config.uiSettings.editor.autoEditExtensions.includes(`.${item.extension}`) ||
            this.timelapseBrowser
          )
        ) {
          // Open the file editor
          this.handleFileOpenDialog(item)
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
  }

  /**
   * ===========================================================================
   * Dialog handling.
   * ===========================================================================
  */
  handleRenameDialog (item: FileBrowserEntry | AppFileWithMeta) {
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
    if (this.timelapseBrowser && file.extension === 'zip') {
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
    this.cancelTokenSource = Axios.CancelToken.source()
    this.getFile(
      file.filename,
      this.currentPath,
      file.size,
      {
        responseType: this.timelapseBrowser ? 'arraybuffer' : 'text',
        transformResponse: [v => v],
        cancelToken: this.cancelTokenSource.token
      }
    )
      .then((response: AxiosResponse) => {
        if (this.timelapseBrowser) {
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
            readonly: this.rootProperties.readonly
          }
        }
      })
      .finally(() => this.$store.dispatch('files/removeFileDownload'))
      .catch(e => e)
  }

  handleClosePreview () {
    this.filePreviewState.open = false
    URL.revokeObjectURL(this.filePreviewState.src)
  }

  handleCancelDownload () {
    if (this.cancelTokenSource) this.cancelTokenSource.cancel('User cancelled.')
    this.$store.dispatch('files/removeFileDownload')
  }

  async handlePreviewGcode (file: AppFile | AppFileWithMeta) {
    this.getGcode(file)
      .then(response => response?.data)
      .then((gcode) => {
        // If we aren't on the dashboard, push the user back there.
        if (this.$router.currentRoute.path !== '/') {
          this.$router.push({ path: '/' })
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

  handleMove (source: FileBrowserEntry | AppFileWithMeta | (FileBrowserEntry | AppFileWithMeta)[], destination: AppDirectory) {
    let destinationPath = `${this.currentPath}/${destination.dirname}`
    if (destination.dirname === '..') {
      const arr = this.currentPath.split('/')
      arr.pop()
      destinationPath = arr.join('/')
    }

    const items = (Array.isArray(source)) ? source.filter(item => (item.name !== '..')) : [source]

    items.forEach((item) => {
      if (item.type === 'file') {
        const src = `${this.currentPath}/${item.filename}`
        const dest = (destinationPath)
          ? `${destinationPath}/${item.filename}`
          : `${item.filename}`
        SocketActions.serverFilesMove(src, dest)

        if (this.timelapseBrowser && item.extension !== 'jpg') {
          // Move thumbnail
          const name = item.filename.slice(0, -(item.extension.length + 1))
          const thumbnails = this.getAllFiles().filter(file => file.type === 'file' && file.extension === 'jpg' && file.filename.startsWith(name))
          if (thumbnails.length) {
            this.handleMove(thumbnails, destination)
          }
        }
      } else {
        const src = `${this.currentPath}/${item.dirname}`
        const dest = (destinationPath)
          ? `${destinationPath}/${item.dirname}`
          : `${item.dirname}`
        SocketActions.serverFilesMove(src, dest)
      }
    })
  }

  handleRename (name: string) {
    const src = `${this.currentPath}/${this.fileNameDialogState.value}`
    const dest = `${this.currentPath}/${name}`
    SocketActions.serverFilesMove(src, dest)
  }

  handleRemove (file: FileBrowserEntry | AppFileWithMeta | (FileBrowserEntry | AppFileWithMeta)[], callback?: () => void) {
    if (this.disabled) return

    const items = (Array.isArray(file)) ? file.filter(item => (item.name !== '..')) : [file]

    if (this.timelapseBrowser) {
      // Override thumbnails for timelapse browser
      const thumbnails = []

      const allFiles = this.getAllFiles()
      for (const item of items) {
        if (item.type === 'file') {
          const name = item.filename.slice(0, -(item.extension.length + 1))

          for (const file of allFiles) {
            if (file.type === 'file' && file.extension === 'jpg' && file.filename.startsWith(name)) {
              thumbnails.push(file)
            }
          }
        }
      }

      items.push(...thumbnails)
    }

    const text = this.$tc('app.file_system.msg.confirm')
    this.$confirm(
      text,
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )
      .then(res => {
        items.forEach((item) => {
          if (res) {
            if (item.type === 'directory') SocketActions.serverFilesDeleteDirectory(`${this.currentPath}/${item.name}`, true)
            if (item.type === 'file') SocketActions.serverFilesDeleteFile(`${this.currentPath}/${item.name}`)
          }
        })

        if (callback) {
          callback()
        }
      })
  }

  async handleUpload (files: FileList | File[], print: boolean) {
    this.$store.dispatch('wait/addWait', Waits.onFileSystem)
    this.uploadFiles(files, this.visiblePath, this.currentRoot, print)
    this.$store.dispatch('wait/removeWait', Waits.onFileSystem)
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
        if (this.cancelTokenSource) this.cancelTokenSource.cancel('User cancelled.')
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
