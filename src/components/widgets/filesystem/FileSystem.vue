<template>
  <v-card
    class="filesystem-wrapper"
    :height="height"
    :max-height="maxHeight"
    :class="{ 'no-pointer-events': dragState.overlay }"
    flat
    @dragover="handleDragOver"
    @dragenter.self.prevent
    @dragleave.self.prevent="handleDragLeave"
    @drop.self.prevent="handleDrop"
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
      v-model="selected"
      :headers="visibleHeaders"
      :root="currentRoot"
      :dense="dense"
      :loading="filesLoading"
      :disabled="disabled"
      :search="search"
      :files="files"
      :drag-state.sync="dragState.browserState"
      :bulk-actions="bulkActions"
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
      @view="handleFileOpenDialog($event, 'view')"
      @edit="handleFileOpenDialog($event, 'edit')"
      @rename="handleRenameDialog"
      @duplicate="handleDuplicateDialog"
      @remove="handleRemove"
      @download="handleDownload"
      @preheat="handlePreheat"
      @preview-gcode="handlePreviewGcode"
      @refresh-metadata="handleRefreshMetadata"
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
      :path="currentPath"
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
      absolute
    />

    <file-system-upload-dialog
      v-if="currentUploads.length > 0"
      :value="currentUploads.length > 0"
      :files="currentUploads"
      @cancel="handleCancelUpload"
    />

    <file-preview-dialog
      v-if="filePreviewState.open"
      v-model="filePreviewState.open"
      :file="filePreviewState.file"
      :filename="filePreviewState.filename"
      :extension="filePreviewState.extension"
      :src="filePreviewState.src"
      :type="filePreviewState.type"
      :width="filePreviewState.width"
      :readonly="filePreviewState.readonly"
      :path="currentPath"
      @remove="handleRemove"
      @download="handleDownload"
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
import type { AppDirectory, AppFile, AppFileWithMeta, FilesUpload, FileFilterType, FileBrowserEntry, RootProperties } from '@/store/files/types'
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
import type { AppTableHeader, FileWithPath } from '@/types'
import { getFilesFromDataTransfer, hasFilesInDataTransfer } from '@/util/file-system-entry'
import { getFileDataTransferDataFromDataTransfer, hasFileDataTransferTypeInDataTransfer, setFileDataTransferDataInDataTransfer } from '@/util/file-data-transfer'
import consola from 'consola'

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

  @Prop({ type: String, required: true })
  readonly name!: string

  // If dense, hide the meta and reduce the overall size.
  @Prop({ type: Boolean })
  readonly dense?: boolean

  // Constrain height
  @Prop({ type: [Number, String] })
  readonly height!: number | string

  // Constrain height
  @Prop({ type: [Number, String] })
  readonly maxHeight!: number | string

  // Allow bulk-actions
  @Prop({ type: Boolean })
  readonly bulkActions?: boolean

  // Maintains the path and root.
  currentRoot = ''

  // Maintains search state.
  search = ''

  // Maintains filter state.
  get filters (): FileFilterType[] {
    return this.$store.state.config.uiSettings.fileSystem.activeFilters[this.currentRoot] ?? []
  }

  set filters (value: FileFilterType[]) {
    this.$store.dispatch('config/updateFileSystemActiveFilters', { root: this.currentRoot, value })
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

  filePreviewState: any = {
    open: false,
    filename: '',
    src: '',
    type: ''
  }

  goToFileDialogOpen = false

  @Watch('filePreviewState.open')
  onFilePreviewStateChanged (value: boolean) {
    if (!value && this.filePreviewState.src.startsWith('blob:')) {
      URL.revokeObjectURL(this.filePreviewState.src)
    }
  }

  // Gets available roots.
  get availableRoots (): string[] {
    const roots = !Array.isArray(this.roots)
      ? [this.roots]
      : this.roots

    if (
      roots.length > 0 &&
      !roots.includes(this.currentRoot)
    ) {
      this.currentRoot = roots[0]
    }

    return roots
  }

  // Properties of the current root.
  get rootProperties (): RootProperties {
    return this.$store.getters['files/getRootProperties'](this.currentRoot) as RootProperties
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

          case 'moonraker_backup_files':
            if (file.type === 'file' && file.filename === '.moonraker.conf.bkp') {
              return false
            }
            break

          case 'moonraker_temporary_upload_files':
            if (file.name.endsWith('.mru')) {
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
            if (file.type === 'file' && (
              file.filename.match(/\.\d{4}-\d{2}-\d{2}(_\d{2}-\d{2}-\d{2})?$/) ||
              file.filename.match(/\.log\.\d+$/)
            )) {
              return false
            }
            break

          case 'crowsnest_backup_files':
            if (file.type === 'file' && file.filename.match(/^crowsnest\.conf\.\d{4}-\d{2}-\d{2}-\d{4}$/)) {
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

  get fileDropRoot () {
    return this.$route.meta?.fileDropRoot
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
  handleRowClick (item: FileBrowserEntry, event: MouseEvent) {
    if (this.disabled) {
      return
    }

    if (this.contextMenuState.open) {
      this.contextMenuState.open = false

      if (event.type !== 'contextmenu') {
        return
      }
    }

    if (item.type === 'directory') {
      if (event.type === 'click') {
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
      } else if (item.dirname === '..' || item.permissions === 'r' || this.rootProperties.readonly) {
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
      event.type === 'click'
    ) {
      if (this.$store.state.config.uiSettings.editor.autoEditExtensions.includes(`.${item.extension}`)) {
        this.handleFileOpenDialog(item, 'edit')

        return
      } else if (this.rootProperties.canView.includes(`.${item.extension}`)) {
        this.handleFileOpenDialog(item, 'view')

        return
      }
    }

    // Open the context menu
    this.contextMenuState.x = event.clientX
    this.contextMenuState.y = event.clientY
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

  async handleFileOpenDialog (file: AppFile, mode: 'edit' | 'view' | undefined = undefined) {
    try {
      const viewOnly = mode
        ? mode === 'view'
        : this.rootProperties.canView.includes(`.${file.extension}`)

      // Grab the file. This should provide a dialog.
      const response = await this.getFile(
        file.filename,
        this.currentPath,
        file.size,
        {
          responseType: viewOnly ? 'arraybuffer' : 'text',
          transformResponse: [v => v]
        }
      )

      if (viewOnly) {
        // Open the file preview dialog.
        const type = response.headers['content-type']
        const blob = new Blob([response.data], { type })
        this.filePreviewState = {
          open: true,
          file,
          filename: file.filename,
          extension: file.extension,
          src: URL.createObjectURL(blob),
          type,
          readonly: file.permissions === 'r' || this.rootProperties.readonly
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
    } catch (error: unknown) {
      consola.error('[FileSystem] open file', error)
    }
  }

  async handlePreviewGcode (file: AppFile | AppFileWithMeta) {
    try {
      const response = await this.getGcode(file)

      const gcode = response?.data

      if (!gcode) return

      if (this.$router.currentRoute.path !== '/' || !this.$store.getters['layout/isEnabledInCurrentLayout']('gcode-preview-card')) {
        this.$router.push({ path: '/preview' })
      }

      this.$store.dispatch('gcodePreview/loadGcode', {
        file,
        gcode
      })
    } catch (error: unknown) {
      consola.error('[FileSystem] preview gcode', error)
    }
  }

  handleRefreshMetadata (file: AppFileWithMeta) {
    const filename = file.path ? `${file.path}/${file.filename}` : file.filename

    SocketActions.serverFilesMetadata(filename)
  }

  async handleViewThumbnail (file: AppFileWithMeta) {
    const thumb = this.getThumb(file, this.currentRoot, file.path, true)

    if (thumb) {
      this.filePreviewState = {
        open: true,
        filename: file.filename,
        src: thumb.url,
        type: 'image/any',
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

    const filename = file.path ? `${file.path}/${file.filename}` : file.filename

    const spoolmanSupported = this.$store.getters['spoolman/getAvailable']
    const autoSpoolSelectionDialog = this.$store.state.config.uiSettings.spoolman.autoSpoolSelectionDialog
    if (spoolmanSupported && autoSpoolSelectionDialog) {
      this.$store.commit('spoolman/setDialogState', {
        show: true,
        filename
      })

      return
    }

    SocketActions.printerPrintStart(filename)

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

    const items = Array.isArray(source)
      ? source.filter(item => item.name !== '..')
      : [source]

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

  handleDragStart (item: FileBrowserEntry, items: FileBrowserEntry[], dataTransfer: DataTransfer) {
    if (item.type === 'file') {
      const url = this.createFileUrl(item.name, this.currentPath)

      dataTransfer.setData('text/html', `<A HREF="${encodeURI(url)}">${item.filename}</A>`)
      dataTransfer.setData('text/plain', url)
      dataTransfer.setData('text/uri-list', url)
    }

    setFileDataTransferDataInDataTransfer(dataTransfer, 'files', {
      path: this.currentPath,
      items: items.map(file => file.name)
    })

    if (this.currentRoot === 'gcodes') {
      const files = items
        .filter((item): item is AppFile => item.type === 'file' && this.rootProperties.accepts.includes(`.${item.extension}`))

      if (files.length > 0) {
        setFileDataTransferDataInDataTransfer(dataTransfer, 'jobs', {
          path: files[0].path,
          items: files.map(file => file.name)
        })
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

    const items = Array.isArray(file)
      ? file.filter(item => item.name !== '..')
      : [file]

    const result = await this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm_delete', items.length),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (result) {
      this.filePreviewState.open = false

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

    await this.uploadFiles(files, this.visiblePath, this.currentRoot, print)

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
        file.abortController.abort()
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
      .filter((item): item is AppFile => item.type === 'file' && this.rootProperties.accepts.includes(`.${item.extension}`))
      .map(file => file.path ? `${file.path}/${file.filename}` : file.filename)

    if (filenames.length > 0) {
      SocketActions.serverJobQueuePostJob(filenames)
    }
  }

  handleCreateZip (file: FileBrowserEntry | FileBrowserEntry[]) {
    const date = new Date()
    const year = date.getFullYear().toString()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    const timestamp = `${year}${month}${day}-${hours}${minutes}${seconds}`

    const dest = Array.isArray(file)
      ? `${this.currentPath}/${timestamp}.zip`
      : `${this.currentPath}/${file.name}-${timestamp}.zip`

    const items = (Array.isArray(file) ? file : [file])
      .map(item => `${this.currentPath}/${item.name}`)

    SocketActions.serverFilesZip(dest, items)
  }

  /**
   * ===========================================================================
   * Drag handling.
   * ===========================================================================
  */
  handleDragOver (event: DragEvent) {
    if (
      !this.fileDropRoot &&
      !this.rootProperties.readonly &&
      !this.dragState.browserState &&
      event.dataTransfer &&
      (
        hasFilesInDataTransfer(event.dataTransfer) ||
        hasFileDataTransferTypeInDataTransfer(event.dataTransfer, 'files')
      )
    ) {
      event.preventDefault()

      this.dragState.overlay = true

      event.dataTransfer.dropEffect = 'copy'
    }
  }

  handleDragLeave () {
    this.dragState.overlay = false
  }

  async handleDrop (event: DragEvent) {
    this.dragState.overlay = false

    if (
      !this.fileDropRoot &&
      !this.rootProperties.readonly &&
      event.dataTransfer
    ) {
      if (hasFileDataTransferTypeInDataTransfer(event.dataTransfer, 'files')) {
        const files = getFileDataTransferDataFromDataTransfer(event.dataTransfer, 'files')

        for (const file of files.items) {
          const src = `${files.path}/${file}`
          const dest = `${this.currentPath}/${file}`
          SocketActions.serverFilesCopy(src, dest)
        }
      } else if (hasFilesInDataTransfer(event.dataTransfer)) {
        const files = await getFilesFromDataTransfer(event.dataTransfer)

        if (files) {
          this.handleUpload(files, false)
        }
      }
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
