<template>
  <v-card
    class="filesystem-wrapper"
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
      :headers="configurableHeaders"
      @root-change="handleRootChange"
      @refresh="handleRefresh"
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
      :selected="selected"
      @remove="handleRemove"
      @create-zip="handleCreateZip"
      @refresh-metadata="handleRefreshMetadata"
      @perform-time-analysis="handlePerformTimeAnalysis"
      @enqueue="handleEnqueue"
    />

    <file-system-browser
      v-if="headers"
      v-model="selected"
      :headers="headers"
      :root="currentRoot"
      :dense="dense"
      :loading="filesLoading"
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
      @perform-time-analysis="handlePerformTimeAnalysis"
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
import type { AppDirectory, AppFile, AppFileWithMeta, FileFilterType, FileBrowserEntry, RootProperties, MoonrakerPathContent } from '@/store/files/types'
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'
import ServicesMixin from '@/mixins/services'
import FileSystemToolbar from './FileSystemToolbar.vue'
import FileSystemBulkActions from './FileSystemBulkActions.vue'
import FileSystemBrowser from './FileSystemBrowser.vue'
import FileSystemContextMenu from './FileSystemContextMenu.vue'
import FileEditorDialog from './FileEditorDialog.vue'
import FileNameDialog from './FileNameDialog.vue'
import FileSystemGoToFileDialog from './FileSystemGoToFileDialog.vue'
import FilePreviewDialog from './FilePreviewDialog.vue'
import type { AppDataTableHeader, FileWithPath } from '@/types'
import { getFilesFromDataTransfer, hasFilesInDataTransfer } from '@/util/file-system-entry'
import { getFileDataTransferDataFromDataTransfer, hasFileDataTransferTypeInDataTransfer, setFileDataTransferDataInDataTransfer } from '@/util/file-data-transfer'
import { consola } from 'consola'
import type { DataTableHeader } from 'vuetify'
import type { KlipperSaveAndRestartAction } from '@/store/config/types'

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

  // Allow bulk-actions
  @Prop({ type: Boolean })
  readonly bulkActions?: boolean

  // Maintains the path and root.
  currentRoot = ''

  // Maintains search state.
  search = ''

  // Maintains filter state.
  get filters (): FileFilterType[] {
    return this.$typedState.config.uiSettings.fileSystem.activeFilters[this.currentRoot] ?? []
  }

  set filters (value: FileFilterType[]) {
    this.$typedDispatch('config/updateFileSystemActiveFilters', { root: this.currentRoot, value })
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
    return this.$typedGetters['files/getRootProperties'](this.currentRoot)
  }

  // If this root is available or not.
  get disabled (): boolean {
    return !this.$typedGetters['files/isRootAvailable'](this.currentRoot)
  }

  @Watch('disabled')
  onDisabledChange (val: boolean) {
    // We know this always fires on mount, so we rely on it for our initial
    // load too.
    if (!val) {
      this.loadFiles(this.currentPath)
    }
  }

  get configurableHeaders (): AppDataTableHeader[] {
    const isNotDashboard = this.name !== 'dashboard'

    const gcodeHeaders: AppDataTableHeader[] = this.currentRoot === 'gcodes'
      ? [
          {
            text: this.$tc('app.general.table.header.status'),
            value: 'history.status',
            visible: isNotDashboard,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.height'),
            value: 'object_height',
            visible: isNotDashboard,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.first_layer_height'),
            value: 'first_layer_height',
            visible: false,
            cellClass: 'text-no-wrap',
          },
          {
            text: this.$tc('app.general.table.header.layer_height'),
            value: 'layer_height',
            visible: isNotDashboard,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.filament_name'),
            value: 'filament_name',
            visible: isNotDashboard,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.filament_colors'),
            value: 'filament_colors',
            visible: isNotDashboard,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.extruder_colors'),
            value: 'extruder_colors',
            visible: false,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.filament_temps'),
            value: 'filament_temps',
            visible: false,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.filament_type'),
            value: 'filament_type',
            visible: isNotDashboard,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.filament'),
            value: 'filament_total',
            visible: isNotDashboard,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.filament_change_count'),
            value: 'filament_change_count',
            visible: false,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.filament_weight_total'),
            value: 'filament_weight_total',
            visible: isNotDashboard,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.filament_weights'),
            value: 'filament_weights',
            visible: isNotDashboard,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.mmu_print'),
            value: 'mmu_print',
            visible: false,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.referenced_tools'),
            value: 'referenced_tools',
            visible: false,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.filament_used'),
            value: 'history.filament_used',
            visible: false,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.nozzle_diameter'),
            value: 'nozzle_diameter',
            visible: isNotDashboard,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.slicer'),
            value: 'slicer',
            visible: isNotDashboard,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.slicer_version'),
            value: 'slicer_version',
            visible: false,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.estimated_time'),
            value: 'estimated_time',
            visible: isNotDashboard,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.print_duration'),
            value: 'history.print_duration',
            visible: false,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.total_duration'),
            value: 'history.total_duration',
            visible: isNotDashboard,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.first_layer_bed_temp'),
            value: 'first_layer_bed_temp',
            visible: false,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.first_layer_extr_temp'),
            value: 'first_layer_extr_temp',
            visible: false,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.chamber_temp'),
            value: 'chamber_temp',
            visible: false,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.file_processors'),
            value: 'file_processors',
            visible: isNotDashboard,
            cellClass: 'text-no-wrap'
          },
          {
            text: this.$tc('app.general.table.header.last_printed'),
            value: 'print_start_time',
            cellClass: 'text-no-wrap'
          }
        ]
      : []

    const headers: AppDataTableHeader[] = [
      ...gcodeHeaders,
      {
        text: this.$tc('app.general.table.header.modified'),
        value: 'modified',
        cellClass: 'text-no-wrap',
        width: '1%'
      },
      {
        text: this.$tc('app.general.table.header.size'),
        value: 'size',
        cellClass: 'text-no-wrap',
        width: '1%'
      }
    ]

    const key = `${this.currentRoot}_${this.name}`
    const mergedTableHeaders: AppDataTableHeader[] = this.$typedGetters['config/getMergedTableHeaders'](headers, key)

    return mergedTableHeaders
  }

  // The available headers, based on the current root and system configuration.
  get headers (): DataTableHeader[] {
    return [
      {
        text: '',
        value: 'data-table-icons',
        sortable: false,
        width: this.dense ? 28 : 56
      },
      {
        text: this.$tc('app.general.table.header.name'),
        value: 'name'
      },
      ...this.configurableHeaders
        .filter(header => header.visible !== false)
    ]
  }

  // The current path for the given root.
  get currentPath () {
    const pathWithRoot: string = this.$typedGetters['files/getCurrentPathByRoot'](this.currentRoot)

    return pathWithRoot || this.currentRoot
  }

  set currentPath (path: string) {
    this.$typedDispatch('files/updateCurrentPathByRoot', { root: this.currentRoot, path })
  }

  // Returns the current path with no root.
  get visiblePath (): string {
    if (
      this.currentPath &&
      this.currentPath.startsWith(this.currentRoot)
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
      if (this.currentRoot === 'timelapse' && file.type === 'file' && file.extension === '.jpg') {
        return false
      }

      return !this.filters
        .some(filter => {
          if (filter === 'hidden_files') {
            return /^\.(?!\.$)/.test(file.name)
          }

          if (file.type !== 'file') {
            return false
          }

          switch (filter) {
            case 'moonraker_backup_files':
              return file.filename === '.moonraker.conf.bkp'

            case 'moonraker_temporary_upload_files':
              return file.extension === '.mru'

            case 'klipper_backup_files':
              return /^printer-\d{8}_\d{6}\.cfg$/.test(file.filename)

            case 'print_start_time':
              return 'print_start_time' in file && file.print_start_time !== null

            case 'rolled_log_files':
              return (
                /\.\d{4}-\d{2}-\d{2}(?:_\d{2}-\d{2}-\d{2})?$/.test(file.filename) ||
                /\.log\.\d+$/.test(file.filename)
              )

            case 'crowsnest_backup_files':
              return /^crowsnest\.conf\.\d{4}-\d{2}-\d{2}-\d{4}$/.test(file.filename)
          }

          return false
        })
    })

    return filteredFiles
  }

  getAllFiles () {
    const items: FileBrowserEntry[] | undefined = this.$typedGetters['files/getDirectory'](this.currentPath)

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

  get fileDropRoot () {
    return this.$route.meta?.fileDropRoot
  }

  includeTimelapseThumbnailFiles (items: FileBrowserEntry[]) {
    const thumbnailFilenames = new Set(items
      .filter((item): item is AppFileWithMeta => item.type === 'file' && item.extension !== '.jpg' && 'thumbnails' in item)
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

      const pathContent: MoonrakerPathContent | undefined = this.$typedState.files.pathContent[path]

      if (pathContent == null || pathContent.partial === true) {
        this.handleRefresh()
      }
    }
  }

  // Refreshes a path by loading the directory.
  handleRefresh () {
    if (!this.disabled) {
      SocketActions.serverFilesGetDirectory(this.currentPath)
    }
  }

  // Handles a user filtering the data.
  handleFilter (filters: FileFilterType[]) {
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
      if (this.$typedState.config.uiSettings.editor.autoEditExtensions.includes(item.extension)) {
        this.handleFileOpenDialog(item, 'edit')

        return
      } else if (this.rootProperties.canView.includes(item.extension)) {
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
        : this.rootProperties.canView.includes(file.extension)

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

      if (
        this.$route.name !== 'home' ||
        !this.$typedGetters['layout/isEnabledInCurrentLayout']('gcode-preview-card')
      ) {
        this.$router.push({ name: 'gcode_preview' })
      }

      this.$typedDispatch('gcodePreview/loadGcode', {
        file,
        gcode
      })
    } catch (error: unknown) {
      consola.error('[FileSystem] preview gcode', error)
    }
  }

  handleRefreshMetadata (file: FileBrowserEntry | FileBrowserEntry[]) {
    if (this.disabled) return

    const files = Array.isArray(file)
      ? file
      : [file]
    const filenames = files
      .filter((item): item is AppFileWithMeta => item.type === 'file' && this.rootProperties.accepts.includes(item.extension))
      .map(file => file.path ? `${file.path}/${file.filename}` : file.filename)

    for (const filename of filenames) {
      SocketActions.serverFilesMetascan(filename)
    }
  }

  handlePerformTimeAnalysis (file: FileBrowserEntry | FileBrowserEntry[]) {
    const items = Array.isArray(file)
      ? file
      : [file]
    const filenames = items
      .filter((item): item is AppFileWithMeta => item.type === 'file' && this.rootProperties.accepts.includes(item.extension))
      .map(file => file.path ? `${file.path}/${file.filename}` : file.filename)

    for (const filename of filenames) {
      SocketActions.serverAnalysisProcess(filename, undefined, true)
    }
  }

  async handleViewThumbnail (file: AppFile) {
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
  handlePrint (file: AppFile | AppFileWithMeta) {
    if (this.disabled) return

    const filename = file.path ? `${file.path}/${file.filename}` : file.filename

    if (this.$typedState.printer.printer.mmu?.enabled === true) {
      if ('referenced_tools' in file) {
        const mmuPrint = (file.referenced_tools?.length ?? 1) > 1 || this.$typedState.printer.printer.mmu?.gate !== -2
        if (mmuPrint) {
          this.$typedCommit('mmu/setDialogState', {
            show: true,
            filename
          })

          return
        }
      }
    }

    const spoolmanSupported: boolean = this.$typedGetters['spoolman/getAvailable']
    const autoSpoolSelectionDialog: boolean = this.$typedState.config.uiSettings.spoolman.autoSpoolSelectionDialog
    if (spoolmanSupported && autoSpoolSelectionDialog) {
      this.$typedCommit('spoolman/setDialogState', {
        show: true,
        filename
      })

      return
    }

    SocketActions.printerPrintStart(filename)

    // If we aren't on the dashboard, push the user back there.
    if (this.$route.name !== 'home') {
      this.$router.push({ name: 'home' })
    }
  }

  async handleSaveFileChanges (contents: string, serviceToRestart?: string) {
    const file = new File([contents], this.fileEditorDialogState.filename)

    if (this.fileEditorDialogState.open) {
      this.fileEditorDialogState.loading = true
    }

    await this.uploadFile(file, this.visiblePath, this.currentRoot, false)

    this.fileEditorDialogState.loading = false

    switch (serviceToRestart) {
      case 'moonraker':
        this.serviceRestartMoonraker()
        break

      case 'klipper': {
        const klipperSaveAndRestartAction: KlipperSaveAndRestartAction = this.$typedState.config.uiSettings.editor.klipperSaveAndRestartAction

        switch (klipperSaveAndRestartAction) {
          case 'auto': {
            const isSimulavrMcu: boolean = this.$typedGetters['printer/getIsSimulavrMcu']

            if (isSimulavrMcu) {
              this.serviceRestartKlipper()
            } else {
              this.firmwareRestartKlippy()
            }
            break
          }

          case 'host-restart':
            this.restartKlippy()
            break

          case 'service-restart':
            this.serviceRestartKlipper()
            break

          default:
            this.firmwareRestartKlippy()
        }
        break
      }

      default:
        if (serviceToRestart) {
          this.serviceRestartByName(serviceToRestart)
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

    for (const item of items) {
      const src = `${this.currentPath}/${item.name}`
      const dest = destinationPath
        ? `${destinationPath}/${item.name}`
        : `${item.name}`
      SocketActions.serverFilesMove(src, dest)
    }
  }

  handleDragStart (item: FileBrowserEntry, items: FileBrowserEntry[], dataTransfer: DataTransfer) {
    if (item.type === 'file') {
      const url = this.createFileUrl(item.name, this.currentPath)

      dataTransfer.setData('text/html', `<A HREF="${url}">${item.filename}</A>`)
      dataTransfer.setData('text/plain', url)
      dataTransfer.setData('text/uri-list', url)
    }

    setFileDataTransferDataInDataTransfer(dataTransfer, 'files', {
      path: this.currentPath,
      items: items.map(file => file.name)
    })

    if (this.currentRoot === 'gcodes') {
      const files = items
        .filter((item): item is AppFile => item.type === 'file' && this.rootProperties.accepts.includes(item.extension))

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

      for (const item of items) {
        if (item.type === 'file') {
          SocketActions.serverFilesDeleteFile(`${this.currentPath}/${item.filename}`)
        } else {
          SocketActions.serverFilesDeleteDirectory(`${this.currentPath}/${item.dirname}`, true)
        }
      }
    }
  }

  async handleUpload (files: FileList | File[] | FileWithPath[], print: boolean) {
    const wait = `${this.$waits.onFileSystem}/${this.currentPath}/`

    this.$typedDispatch('wait/addWait', wait)

    await this.uploadFiles(files, this.visiblePath, this.currentRoot, print)

    this.$typedDispatch('wait/removeWait', wait)
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
      .filter((item): item is AppFile => item.type === 'file' && this.rootProperties.accepts.includes(item.extension))
      .map(file => file.path ? `${file.path}/${file.filename}` : file.filename)

    if (filenames.length > 0) {
      SocketActions.serverJobQueuePostJob(filenames)
    }
  }

  handleCreateZip (file: FileBrowserEntry | FileBrowserEntry[]) {
    const timestamp = this.$filters.formatTimestamp(Date.now())

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
