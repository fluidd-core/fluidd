<template>
  <section
    class="jt"
    :class="`jt--${view}`"
    data-tid="jobs-table"
  >
    <div class="jt__head">
      <div class="jt__title">
        <h2>On the printer</h2>
        <div class="jt__where">
          <nav
            class="jt__crumbs"
            aria-label="Folder"
          >
            <button
              type="button"
              :disabled="!path"
              @click="openFolder('')"
            >
              gcodes/
            </button>
            <button
              v-for="crumb in crumbs"
              :key="crumb.path"
              type="button"
              :disabled="crumb.path === path"
              @click="openFolder(crumb.path)"
            >
              {{ crumb.name }}/
            </button>
          </nav>
          <span class="jt__summary">{{ summary }}</span>
        </div>
      </div>
      <span class="jt__grow" />
      <seg-picker
        :options="filterOptions"
        :value="filter"
        label="Print history"
        @input="filter = $event"
      />
      <label class="jt__filter">
        <frame-icon
          name="search"
          small
        />
        <input
          ref="filter"
          v-model="query"
          type="search"
          placeholder="Filter"
          aria-label="Filter the files"
          data-tid="jobs-filter"
          @keydown.esc="query = ''; focusTable()"
          @keydown.down.prevent="focusTable()"
        >
        <kbd>/</kbd>
      </label>
      <button
        type="button"
        class="cbtn"
        data-tid="jobs-new-folder"
        :disabled="!controlReady"
        @click="folderDialog = true"
      >
        <frame-icon
          name="folderPlus"
          small
        />
        Folder
      </button>
      <button
        type="button"
        class="cbtn cbtn--primary"
        data-tid="jobs-upload"
        :disabled="!controlReady"
        @click="pickUpload"
      >
        <frame-icon
          name="upload"
          small
        />
        Upload
      </button>
    </div>

    <div
      v-if="selected.length"
      class="jt__bar"
      data-tid="jobs-selection"
    >
      <b>{{ selected.length }} selected</b>
      <button
        v-if="canQueue && selectedFiles.length === selected.length"
        type="button"
        :disabled="!controlReady"
        @click="queueSelected"
      >
        {{ queueText }}
      </button>
      <button
        v-if="changeable.length"
        type="button"
        data-tid="jobs-move"
        :disabled="!controlReady"
        @click="openMove"
      >
        Move to…
      </button>
      <button
        v-if="selected.length === 1 && changeable.length === 1"
        type="button"
        :disabled="!controlReady"
        @click="openRename"
      >
        Rename
      </button>
      <button
        v-if="selectedFiles.length"
        type="button"
        @click="downloadSelected"
      >
        Download
      </button>
      <button
        v-if="changeable.length"
        type="button"
        class="jt__danger"
        data-tid="jobs-delete"
        :disabled="!controlReady"
        @click="deleteRows(selectedRows)"
      >
        Delete
      </button>
      <span
        v-if="changeable.length < selected.length"
        class="jt__locked"
      >{{ lockedName }} is printing, so it stays where it is</span>
      <span class="jt__grow" />
      <button
        type="button"
        class="jt__clear"
        aria-label="Clear the selection"
        @click="clearSelection"
      >
        <frame-icon
          name="x"
          small
        />
      </button>
    </div>

    <div
      ref="table"
      class="jt__table"
      role="grid"
      tabindex="0"
      aria-label="Files on the printer"
      aria-describedby="jobs-table-hint"
      :aria-multiselectable="true"
      :aria-rowcount="rows.length + 1 + (path ? 1 : 0)"
      aria-colcount="9"
      :aria-activedescendant="cursor ? rowId(cursor) : undefined"
      data-tid="jobs-table-grid"
      @keydown="onKey"
    >
      <div
        class="jt__row jt__row--head"
        role="row"
        aria-rowindex="1"
      >
        <span
          class="jt__check"
          role="columnheader"
          aria-colindex="1"
        >
          <input
            type="checkbox"
            class="jt__box"
            :class="{ 'jt__box--on': allSelected, 'jt__box--some': selected.length && !allSelected }"
            :checked="allSelected"
            :aria-checked="allSelected ? 'true' : selected.length ? 'mixed' : 'false'"
            aria-label="Select every row"
            @click.stop="toggleAll"
          >
        </span>
        <span
          role="columnheader"
          aria-colindex="2"
          aria-hidden="true"
        />
        <button
          v-for="(column, columnIndex) in columns"
          :key="column.key"
          type="button"
          role="columnheader"
          :aria-colindex="columnIndex + 3"
          class="jt__col"
          :class="[`jt__c-${column.key}`, { 'jt__col--on': sort.column === column.key }]"
          :aria-sort="sort.column === column.key ? (sort.desc ? 'descending' : 'ascending') : 'none'"
          @click="sortBy(column.key)"
        >
          {{ column.label }}
          <span
            v-if="sort.column === column.key"
            aria-hidden="true"
          >{{ sort.desc ? '↓' : '↑' }}</span>
        </button>
      </div>

      <div
        v-if="path"
        class="jt__row jt__row--up"
        role="row"
        aria-rowindex="2"
        @click="openFolder(parent)"
      >
        <span
          role="gridcell"
          aria-colindex="1"
        />
        <span
          class="jt__thumb jt__thumb--folder"
          role="gridcell"
          aria-colindex="2"
        >
          <frame-icon
            name="folderUp"
            small
          />
        </span>
        <span
          class="jt__name"
          role="gridcell"
          aria-colindex="3"
        >Up to {{ parent ? `${parent}/` : 'gcodes/' }}</span>
        <span
          v-for="column in 6"
          :key="column"
          role="gridcell"
          :aria-colindex="column + 3"
        />
      </div>

      <div
        v-for="(row, rowIndex) in rows"
        :id="rowId(row.key)"
        :key="row.key"
        :ref="`row-${row.key}`"
        role="row"
        :aria-rowindex="rowIndex + 2 + (path ? 1 : 0)"
        class="jt__row"
        :class="{
          'jt__row--sel': selected.includes(row.key),
          'jt__row--cursor': cursor === row.key,
          'jt__row--folder': row.kind === 'folder'
        }"
        :aria-selected="selected.includes(row.key) ? 'true' : 'false'"
        :data-key="row.key"
        @click="onRowClick(row, $event)"
        @dblclick="openRow(row)"
      >
        <span
          class="jt__check"
          role="gridcell"
          aria-colindex="1"
        >
          <input
            type="checkbox"
            class="jt__box"
            :class="{ 'jt__box--on': selected.includes(row.key) }"
            :checked="selected.includes(row.key)"
            :aria-checked="selected.includes(row.key) ? 'true' : 'false'"
            :aria-label="`Select ${row.name}`"
            @click.stop="onCheck(row, $event)"
          >
        </span>
        <span
          class="jt__thumb"
          :class="{ 'jt__thumb--folder': row.kind === 'folder' }"
          role="gridcell"
          aria-colindex="2"
        >
          <frame-icon
            v-if="row.kind === 'folder'"
            name="files"
            small
          />
          <img
            v-else-if="row.job && row.job.thumbnail"
            :src="row.job.thumbnail"
            alt=""
            loading="lazy"
          >
        </span>
        <span
          class="jt__name"
          role="gridcell"
          aria-colindex="3"
          :title="row.name"
        >
          <span class="jt__name-text">{{ row.name }}</span>
          <span
            v-if="row.job && row.job.printing"
            class="jt__printing"
          >printing</span>
        </span>
        <span
          class="jt__c-time"
          role="gridcell"
          aria-colindex="4"
        >{{ row.kind === 'folder' ? '—' : time(row.time) }}</span>
        <span
          class="jt__c-filament"
          role="gridcell"
          aria-colindex="5"
        >{{ row.filament ? `${row.filament.toFixed(1)} g` : '—' }}</span>
        <span
          class="jt__c-layer"
          role="gridcell"
          aria-colindex="6"
        >{{ row.layer ? row.layer.toFixed(2) : '—' }}</span>
        <span
          class="jt__c-height"
          role="gridcell"
          aria-colindex="7"
        >{{ row.height ? row.height.toFixed(1) : '—' }}</span>
        <span
          class="jt__c-modified"
          role="gridcell"
          aria-colindex="8"
        >{{ date(row.modified) }}</span>
        <span
          class="jt__c-size"
          role="gridcell"
          aria-colindex="9"
        >{{ row.kind === 'folder' ? folderSize(row.key) : size(row.size) }}</span>
      </div>

      <p
        v-if="!loaded"
        class="jt__note"
      >
        Reading the printer's files…
      </p>
      <p
        v-else-if="!rows.length"
        class="jt__note"
      >
        {{ query ? `Nothing here matches "${query}".` : path ? 'This folder is empty. Drop G-code here, or upload it.' : 'No G-code on the printer yet. Upload a file, or slice one in Slice.' }}
      </p>
    </div>

    <p
      id="jobs-table-hint"
      class="jt__hint"
    >
      Arrow keys move · Space selects · Shift+Arrow selects a range · Del deletes · Enter opens · Backspace goes up
      <template v-if="others">
        · {{ others }} other {{ others === 1 ? 'file' : 'files' }} here, in Files
      </template>
    </p>

    <input
      ref="upload"
      type="file"
      multiple
      :accept="gcodeAccept"
      class="jt__upload"
      @change="onPicked"
    >

    <file-name-dialog
      v-if="folderDialog"
      v-model="folderDialog"
      title="New folder"
      :label="`In ${path ? `${path}/` : 'gcodes/'}`"
      name=""
      @save="makeFolder"
    />
    <file-name-dialog
      v-if="renameOpen && changeable.length === 1"
      v-model="renameOpen"
      :title="changeable[0].kind === 'folder' ? 'Rename the folder' : 'Rename the file'"
      label="Name"
      :name="changeable[0].name"
      @save="rename"
    />

    <v-dialog
      v-model="moveOpen"
      max-width="420"
    >
      <div
        class="jt__move"
        data-tid="jobs-move-dialog"
      >
        <h3>Move {{ changeable.length === 1 ? changeable[0].name : `${changeable.length} items` }} to</h3>
        <button
          v-for="folder in moveTargets"
          :key="folder"
          type="button"
          class="jt__move-to"
          @click="moveInto(folder)"
        >
          <frame-icon
            name="files"
            small
          />
          {{ folder ? `gcodes/${folder}/` : 'gcodes/' }}
        </button>
        <p
          v-if="!moveTargets.length"
          class="jt__note"
        >
          No other folder yet. Make one with Folder first.
        </p>
        <div class="jt__move-actions">
          <button
            type="button"
            class="cbtn"
            @click="moveOpen = false"
          >
            Cancel
          </button>
        </div>
      </div>
    </v-dialog>
  </section>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import JobsMixin, { type JobFile } from '@/mixins/jobs'
import { SocketActions } from '@/api/socketActions'
import { EventBus } from '@/eventBus'
import type { AppDirectory, AppFileWithMeta, FileBrowserEntry } from '@/store/files/types'
import {
  fileSize, filterJobs, filterRows, isGcodeFile, nextSort, parentFolder, queueLabel, rangeSelect, shortDate, sortRows, tableTime, toggleKey,
  type JobFilter, type TableColumn, type TableRow, type TableSort
} from '@/services/jobs/model'
import FileNameDialog from '@/components/widgets/filesystem/FileNameDialog.vue'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'

type Row = TableRow & { job?: JobFile }

const SORT_KEY = 'muon3d.jobs.sort'

function readSort (): TableSort {
  try {
    const saved = JSON.parse(localStorage.getItem(SORT_KEY) ?? 'null')
    if (saved && typeof saved.column === 'string' && typeof saved.desc === 'boolean') return saved
  } catch {
    // The default below.
  }
  return { column: 'modified', desc: true }
}

/**
 * The G-code on the printer with its folders, sorted by
 * any column, filtered, and selected in ones or ranges for queueing,
 * moving, downloading or deleting together. The row with the cursor is
 * the one the viewer beside it shows; Enter or a double-click opens it.
 */
@Component({ components: { FileNameDialog, SegPicker } })
export default class JobsTable extends Mixins(JobsMixin) {
  @Prop({ type: String, default: 'table' }) readonly view!: 'pictures' | 'list' | 'table'
  /** The job the viewer shows, from outside: the table's cursor follows it. */
  @Prop({ type: String, default: null })
  readonly current!: string | null

  path = ''
  query = ''
  filter: JobFilter = 'all'
  sort: TableSort = readSort()
  selected: string[] = []
  anchor: string | null = null
  cursor: string | null = null
  folderDialog = false
  renameOpen = false
  moveOpen = false
  dialogTarget: string | null = null

  @Watch('commandTarget')
  onCommandTarget () {
    this.selected = []
    this.anchor = null
    this.cursor = null
    this.renameOpen = false
    this.moveOpen = false
    this.folderDialog = false
    this.dialogTarget = null
  }

  get columns (): Array<{ key: TableColumn, label: string }> {
    return [
      { key: 'name', label: 'Name' },
      { key: 'time', label: 'Time' },
      { key: 'filament', label: 'Filament' },
      { key: 'layer', label: 'Layer' },
      { key: 'height', label: 'Height' },
      { key: 'modified', label: 'Modified' },
      { key: 'size', label: 'Size' }
    ]
  }

  get filterOptions (): SegOption[] {
    return [
      { value: 'all', label: `All ${this.fileRows.length}` },
      { value: 'never', label: 'Never printed' },
      { value: 'before', label: 'Printed before' }
    ]
  }

  // -- the folder that's open -------------------------------------------------

  get dir (): string {
    return this.path ? `${this.root}/${this.path}` : this.root
  }

  get dirEntries (): FileBrowserEntry[] {
    return (this.$store.getters['files/getDirectory'](this.dir) as FileBrowserEntry[] | undefined) ?? []
  }

  get dirLoaded (): boolean {
    return !!this.$store.getters['files/getDirectory'](this.dir)
  }

  get crumbs (): Array<{ name: string, path: string }> {
    const parts = this.path ? this.path.split('/') : []
    return parts.map((name, i) => ({ name, path: parts.slice(0, i + 1).join('/') }))
  }

  get parent (): string {
    return parentFolder(this.path)
  }

  get folderRows (): Row[] {
    return this.dirEntries
      .filter((e): e is AppDirectory => e.type === 'directory' && e.name !== '..')
      .map(d => ({
        key: this.path ? `${this.path}/${d.dirname}` : d.dirname,
        kind: 'folder' as const,
        name: d.dirname,
        modified: d.modified,
        size: d.size
      }))
  }

  get fileRows (): Row[] {
    return this.dirEntries
      .filter((e): e is AppFileWithMeta => e.type === 'file' && isGcodeFile(e.filename))
      .map(f => {
        const job = this.toJobFile(f)
        return {
          key: job.path,
          kind: 'file' as const,
          name: f.filename,
          time: f.estimated_time,
          filament: f.filament_weight_total,
          layer: f.layer_height,
          height: f.object_height,
          modified: f.modified,
          size: f.size,
          job
        }
      })
  }

  /** Files in the folder that aren't G-code: the Files page shows them. */
  get others (): number {
    return this.dirEntries.filter(e => e.type === 'file' && !isGcodeFile(e.filename)).length
  }

  get rows (): Row[] {
    const visible = new Set(filterJobs(this.fileRows.flatMap(row => row.job ? [row.job] : []), this.filter).map(job => job.key))
    const files = this.fileRows.filter(row => visible.has(row.key))
    return sortRows(filterRows([...this.folderRows, ...files], this.query), this.sort)
  }

  get order (): string[] {
    return this.rows.map(r => r.key)
  }

  get summary (): string {
    const files = this.fileRows.length
    const parts = [`${files} ${files === 1 ? 'file' : 'files'}`]
    if (this.freeSpace) parts.push(this.freeSpace)
    return `· ${parts.join(' · ')}`
  }

  mounted () {
    const saved = (this.$store.getters['files/getCurrentPathByRoot'](this.root) as string | undefined) ?? ''
    this.openFolder(saved.startsWith(`${this.root}/`) ? saved.slice(this.root.length + 1) : '')
    window.addEventListener('keydown', this.onWindowKey)
  }

  beforeDestroy () {
    window.removeEventListener('keydown', this.onWindowKey)
  }

  openFolder (path: string) {
    if (path !== this.path) {
      this.selected = []
      this.anchor = null
      this.cursor = null
      this.query = ''
    }
    this.path = path
    // A file dropped anywhere on the page lands in the folder that's open.
    this.$store.dispatch('files/updateCurrentPathByRoot', { root: this.root, path: this.dir })
    SocketActions.serverFilesGetDirectory(this.root, this.dir)
  }

  // -- the cursor and the viewer ----------------------------------------------

  get cursorRow (): Row | undefined {
    return this.rows.find(r => r.key === this.cursor)
  }

  get cursorJob (): JobFile | null {
    return this.cursorRow?.job ?? null
  }

  get files (): JobFile[] {
    return this.rows.flatMap(r => (r.job ? [r.job] : []))
  }

  /** The viewer follows the cursor, and the file's facts as the printer updates them. */
  @Watch('cursorJob')
  onCursorJob (job: JobFile | null) {
    // On a folder, the viewer keeps the last file.
    if (job) this.$emit('view', job)
  }

  @Watch('files')
  onFiles (files: JobFile[]) {
    this.$emit('files', files)
  }

  /** On a folder's first listing, the cursor starts on what's printing, or the first file. */
  @Watch('rows')
  onRows (rows: Row[]) {
    const keys = new Set(rows.map(r => r.key))
    const kept = this.selected.filter(k => keys.has(k))
    if (kept.length !== this.selected.length) this.selected = kept
    if (this.cursor && keys.has(this.cursor)) return
    const pick = rows.find(r => r.job?.key === this.current) ?? rows.find(r => r.job?.printing) ?? rows.find(r => r.kind === 'file')
    this.cursor = pick?.key ?? null
  }

  @Watch('current')
  onCurrent (key: string | null) {
    if (key && key !== this.cursor && this.order.includes(key)) this.cursor = key
  }

  moveCursor (to: string | undefined) {
    if (!to) return
    this.cursor = to
    this.$nextTick(() => {
      const el = this.$el.querySelector(`[data-key="${CSS.escape(to)}"]`)
      el?.scrollIntoView({ block: 'nearest' })
    })
  }

  rowId (key: string): string {
    return `jobs-row-${encodeURIComponent(key)}`
  }

  // -- clicking -----------------------------------------------------------------

  onRowClick (row: Row, event: MouseEvent) {
    if (event.shiftKey) {
      this.selected = rangeSelect(this.order, this.selected, this.anchor ?? this.cursor, row.key)
      this.moveCursor(row.key)
      return
    }
    if (event.ctrlKey || event.metaKey) {
      this.onCheck(row, event)
      return
    }
    if (row.kind === 'folder') {
      this.openFolder(row.key)
      return
    }
    this.anchor = row.key
    this.moveCursor(row.key)
    if (this.view !== 'table') this.openRow(row)
  }

  onCheck (row: Row, event: MouseEvent) {
    if (event.shiftKey) {
      this.selected = rangeSelect(this.order, this.selected, this.anchor, row.key)
    } else {
      this.selected = toggleKey(this.selected, row.key)
    }
    this.anchor = row.key
  }

  openRow (row: Row | undefined) {
    if (!row) return
    if (row.kind === 'folder') this.openFolder(row.key)
    else if (row.job) this.$emit('open', row.job)
  }

  get allSelected (): boolean {
    return this.rows.length > 0 && this.rows.every(r => this.selected.includes(r.key))
  }

  toggleAll () {
    this.selected = this.allSelected ? [] : [...this.order]
  }

  clearSelection () {
    this.selected = []
    this.anchor = null
  }

  sortBy (column: TableColumn) {
    this.sort = nextSort(this.sort, column)
    try {
      localStorage.setItem(SORT_KEY, JSON.stringify(this.sort))
    } catch {
      // The order holds for this visit.
    }
  }

  // -- keys -----------------------------------------------------------------------

  focusTable () {
    (this.$refs.table as HTMLElement | undefined)?.focus()
  }

  /** "/" anywhere on the page goes to the filter, unless something else is being typed in. */
  onWindowKey (event: KeyboardEvent) {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
    const target = event.target as HTMLElement | null
    if (target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))) return
    if (document.querySelector('.v-dialog--active')) return
    event.preventDefault();
    (this.$refs.filter as HTMLInputElement | undefined)?.focus()
  }

  onKey (event: KeyboardEvent) {
    // Keys on the column heads are theirs.
    if (event.target !== this.$refs.table) return
    const index = this.cursor ? this.order.indexOf(this.cursor) : -1
    const step = (by: number) => {
      const next = this.order[Math.max(0, Math.min(this.order.length - 1, index + by))]
      if (event.shiftKey && next) this.selected = rangeSelect(this.order, this.selected, this.anchor ?? this.cursor, next)
      else this.anchor = next ?? null
      this.moveCursor(next)
    }
    switch (event.key) {
      case 'ArrowDown': step(index < 0 ? 0 : 1); break
      case 'ArrowUp': step(index < 0 ? 0 : -1); break
      case 'Home': step(-this.order.length); break
      case 'End': step(this.order.length); break
      case 'Enter': this.openRow(this.cursorRow); break
      case ' ':
        if (this.cursor) {
          this.selected = toggleKey(this.selected, this.cursor)
          this.anchor = this.cursor
        }
        break
      case 'Delete':
        this.deleteRows(this.selected.length ? this.selectedRows : this.cursorRow ? [this.cursorRow] : [])
        break
      case 'Backspace':
        if (this.path) this.openFolder(this.parent)
        break
      case 'Escape':
        if (!this.selected.length) return
        this.clearSelection()
        break
      case 'a':
        if (!(event.ctrlKey || event.metaKey)) return
        this.selected = [...this.order]
        break
      default:
        return
    }
    event.preventDefault()
    event.stopPropagation()
  }

  // -- the selection's actions ------------------------------------------------------

  get selectedRows (): Row[] {
    return this.rows.filter(r => this.selected.includes(r.key))
  }

  get selectedFiles (): JobFile[] {
    return this.selectedRows.flatMap(r => (r.job ? [r.job] : []))
  }

  /** What can be moved, renamed or deleted: not the file printing, which the printer holds open. */
  get changeable (): Row[] {
    return this.selectedRows.filter(r => !r.job?.printing)
  }

  get lockedName (): string {
    return this.selectedRows.find(r => r.job?.printing)?.job?.title ?? ''
  }

  get queueText (): string {
    return queueLabel(this.selectedFiles.length)
  }

  async queueSelected () {
    if (!this.controlReady) return
    await SocketActions.serverJobQueuePostJob(this.selectedFiles.map(f => f.path))
    this.clearSelection()
  }

  downloadSelected () {
    for (const job of this.selectedFiles) this.downloadJob(job)
  }

  async deleteRows (all: Row[]) {
    if (!this.controlReady) return
    const rows = all.filter(r => !r.job?.printing)
    if (!rows.length) return
    const files = rows.filter(r => r.kind === 'file').length
    const folders = rows.length - files
    const what = [
      files ? `${files} ${files === 1 ? 'file' : 'files'}` : '',
      folders ? `${folders} ${folders === 1 ? 'folder' : 'folders'}` : ''
    ].filter(Boolean).join(' and ')
    const name = rows.length === 1 ? rows[0].name : what
    const note = folders ? ' A folder goes with everything in it.' : ''
    const target = this.commandTarget
    const ok = await this.$confirm(`It's removed from ${this.printerName}.${note} This can't be undone.`, { title: `Delete ${name}?`, buttonTrueText: 'Delete', danger: true })
    if (!ok || target !== this.commandTarget || !this.controlReady) return
    for (const row of rows) {
      if (target !== this.commandTarget || !this.controlReady) return
      if (row.kind === 'folder') SocketActions.serverFilesDeleteDirectory(`${this.root}/${row.key}`, true)
      else SocketActions.serverFilesDeleteFile(`${this.root}/${row.key}`)
    }
    this.clearSelection()
  }

  /** Where the selection can go: every folder Fluidd has listed, less where it is and the folders being moved. */
  get moveTargets (): string[] {
    const known = Object.keys(this.$store.state.files.pathFiles as Record<string, unknown>)
      .filter(p => p === this.root || p.startsWith(`${this.root}/`))
      .map(p => p === this.root ? '' : p.slice(this.root.length + 1))
    const here = this.folderRows.map(r => r.key)
    const moving = this.changeable.filter(r => r.kind === 'folder').map(r => r.key)
    return [...new Set([...known, ...here, this.parent])]
      .filter(f => f !== this.path && !moving.some(m => f === m || f.startsWith(`${m}/`)))
      .sort((a, b) => a.localeCompare(b))
  }

  openMove () {
    this.dialogTarget = this.commandTarget
    this.moveOpen = true
  }

  openRename () {
    this.dialogTarget = this.commandTarget
    this.renameOpen = true
  }

  moveInto (folder: string) {
    if (!this.controlReady || this.dialogTarget !== this.commandTarget) return
    for (const row of this.changeable) {
      if (!this.controlReady || this.dialogTarget !== this.commandTarget) return
      SocketActions.serverFilesMove(`${this.root}/${row.key}`, `${this.root}/${folder ? `${folder}/` : ''}${row.name}`)
    }
    this.moveOpen = false
    this.clearSelection()
  }

  rename (name: string) {
    if (!this.controlReady || this.dialogTarget !== this.commandTarget) return
    const row = this.changeable[0]
    const clean = name.trim()
    if (!row || !clean || clean === row.name) return
    SocketActions.serverFilesMove(`${this.root}/${row.key}`, `${this.dir}/${clean}`)
    this.clearSelection()
  }

  makeFolder (name: string) {
    if (!this.controlReady) return
    const clean = name.trim()
    if (clean) SocketActions.serverFilesPostDirectory(`${this.dir}/${clean}`)
  }

  // -- upload ---------------------------------------------------------------------

  get gcodeAccept (): string {
    const root = this.$store.getters['files/getRootProperties'](this.root) as { accepts?: string[] } | undefined
    return (root?.accepts ?? []).join(',')
  }

  pickUpload () {
    if (!this.controlReady) return
    (this.$refs.upload as HTMLInputElement).click()
  }

  /** Uploads go into the folder that's open; one G-code file on its own is offered to print. */
  async onPicked (event: Event) {
    const input = event.target as HTMLInputElement
    const files = [...(input.files ?? [])]
    input.value = ''
    if (!this.controlReady) return
    if (!files.length) return
    await this.uploadFiles(files, this.path, this.root, false)
    if (files.length === 1 && isGcodeFile(files[0].name)) {
      EventBus.bus.$emit('job-ready', this.path ? `${this.path}/${files[0].name}` : files[0].name)
    }
  }

  // -- cells ----------------------------------------------------------------------

  time (seconds?: number): string {
    return tableTime(seconds)
  }

  date (seconds: number): string {
    return shortDate(seconds)
  }

  size (bytes: number): string {
    return fileSize(bytes)
  }

  /** A folder's G-code count, once Fluidd has listed it. */
  folderSize (key: string): string {
    const listing = (this.$store.state.files.pathFiles as Record<string, { files: Array<{ filename: string }> }>)[`${this.root}/${key}`]
    if (!listing) return 'folder'
    const n = listing.files.filter(f => isGcodeFile(f.filename)).length
    return `${n} ${n === 1 ? 'file' : 'files'}`
  }
}
</script>

<style lang="scss" scoped>
  .jt {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    container-type: inline-size;
  }

  .jt__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 12px;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
    }
  }

  .jt__title {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .jt__where {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 8px;
  }

  .jt__locked {
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .jt__crumbs {
    display: flex;
    align-items: center;
    font-family: var(--m3d-font-mono, monospace);
    font-size: 13px;

    button {
      padding: 2px 1px;
      color: var(--m3d-accent);

      &:disabled {
        color: var(--m3d-text-muted);
        cursor: default;
      }
    }
  }

  .jt__summary {
    color: var(--m3d-text-subtle);
    font-family: var(--m3d-font-mono, monospace);
    font-size: 13px;
  }

  .jt__grow {
    flex: 1 1 auto;
  }

  .jt__filter {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: 200px;
    height: 40px;
    padding: 0 8px 0 12px;
    border-radius: 12px;
    background: var(--m3d-surface);
    color: var(--m3d-text-muted);

    input {
      flex: 1 1 0;
      min-width: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--m3d-text);
      font: inherit;
      font-size: 14px;
    }

    kbd {
      padding: 1px 7px;
      border-radius: 6px;
      background: var(--m3d-surface-2);
      box-shadow: none;
      color: var(--m3d-text-muted);
      font-family: var(--m3d-font-mono, monospace);
      font-size: 12px;
    }
  }

  // The ring goes round the well, not the text box in it.
  .jt__filter input:focus-visible {
    outline: none;
  }

  .jt__filter:focus-within {
    box-shadow: 0 0 0 2px var(--m3d-accent);
  }

  .jt__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 16px;
    min-height: 44px;
    padding: 6px 8px 6px 16px;
    border-radius: 14px;
    background: var(--m3d-accent-soft, rgba(128, 214, 209, 0.12));
    font-size: 14px;

    button {
      color: var(--m3d-accent);
      font-weight: 600;
    }
  }

  .jt__danger {
    color: var(--m3d-danger) !important;
  }

  .jt__clear {
    display: inline-flex;
    padding: 6px;
    border-radius: 8px;
    color: var(--m3d-text-muted) !important;
  }

  .jt__table {
    overflow: hidden;
    border-radius: 22px;
    background: var(--m3d-surface);
    outline: none;

    &:focus-visible {
      box-shadow: 0 0 0 2px var(--m3d-accent);
    }
  }

  .jt--list {
    .jt__row { grid-template-columns: 28px 36px minmax(0, 1fr); }
    .jt__row--head { display: none; }
    .jt__row > :not(.jt__check):not(.jt__thumb):not(.jt__name) { display: none; }
  }

  .jt--pictures {
    .jt__table { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 14px; overflow: visible; background: transparent; }
    .jt__row { position: relative; display: flex; flex-direction: column; justify-content: center; gap: 8px; height: 190px; padding: 16px; border: 0; border-radius: 20px; background: var(--m3d-surface); text-align: center; }
    .jt__row--head { display: none; }
    .jt__row > :not(.jt__check):not(.jt__thumb):not(.jt__name) { display: none; }
    .jt__check { position: absolute; align-self: flex-start; height: auto; }
    .jt__thumb { width: 92px; height: 92px; }
    .jt__name { width: 100%; }
  }

  .jt__row {
    display: grid;
    grid-template-columns: 28px 36px minmax(0, 2.4fr) 0.8fr 0.8fr 0.6fr 0.6fr 1fr 0.7fr;
    align-items: center;
    gap: 10px;
    height: 50px;
    padding: 0 14px;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    cursor: default;
    user-select: none;

    + .jt__row {
      border-top: 1px solid var(--m3d-border);
    }

    > span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .jt__row--head {
    height: 40px;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .jt__col {
    overflow: hidden;
    color: inherit;
    font: inherit;
    text-align: left;
    white-space: nowrap;
  }

  .jt__col--on {
    color: var(--m3d-text);
  }

  .jt__row--up,
  .jt__row--folder {
    cursor: pointer;
  }

  .jt__row:not(.jt__row--head):hover {
    background: var(--m3d-hover, rgba(255, 255, 255, 0.03));
  }

  .jt__row--sel {
    background: rgba(128, 214, 209, 0.07);
  }

  .jt__row--cursor {
    box-shadow: inset 3px 0 0 var(--m3d-accent);
    background: rgba(128, 214, 209, 0.1);
  }

  .jt__check {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    cursor: pointer;
  }

  .jt__box {
    appearance: none;
    display: block;
    flex: none;
    width: 16px;
    height: 16px;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 5px;
    background: transparent;
    box-shadow: inset 0 0 0 1.5px var(--m3d-border-strong);

    &:focus-visible {
      outline: 2px solid var(--m3d-accent);
      outline-offset: 2px;
    }

    &.jt__box--on {
      background: var(--m3d-accent);
      box-shadow: none;
    }

    &.jt__box--some {
      background: linear-gradient(var(--m3d-accent), var(--m3d-accent)) center / 8px 2px no-repeat;
    }
  }

  .jt__thumb {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 9px;
    background: radial-gradient(100% 100% at 50% 35%, #2f3133 0%, #1f2022 70%);

    img {
      width: 88%;
      height: 88%;
      object-fit: contain;
    }
  }

  .jt__thumb--folder {
    background: var(--m3d-surface-2);
    color: var(--m3d-accent);
  }

  .jt__name {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    color: var(--m3d-text);
    font-size: 14px;
  }

  .jt__name-text {
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .jt__row--folder .jt__name {
    font-weight: 600;
  }

  .jt__printing {
    flex: none;
    padding: 1px 8px;
    border-radius: 999px;
    background: rgba(128, 214, 209, 0.16);
    color: var(--m3d-accent);
    font-size: 11px;
    font-weight: 600;
  }

  .jt__note {
    margin: 0;
    padding: 18px 20px;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .jt__hint {
    margin: 0;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .jt__upload {
    display: none;
  }

  .jt__move {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 20px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);

    h3 {
      margin: 0 0 10px;
      overflow: hidden;
      font-size: 17px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .jt__move-to {
    display: flex;
    align-items: center;
    gap: 10px;
    height: 42px;
    padding: 0 12px;
    border-radius: 12px;
    color: var(--m3d-text);
    font-family: var(--m3d-font-mono, monospace);
    font-size: 13px;
    text-align: left;

    &:hover {
      background: var(--m3d-surface-2);
    }
  }

  .jt__move-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
  }

  // Narrower: the slicer's finer facts go first, then the filament and size.
  @container (max-width: 760px) {
    .jt__row {
      grid-template-columns: 28px 36px minmax(0, 2.4fr) 0.8fr 0.8fr 1fr 0.7fr;
    }

    .jt__c-layer,
    .jt__c-height {
      display: none;
    }
  }

  @container (max-width: 560px) {
    .jt__row {
      grid-template-columns: 28px 36px minmax(0, 2.4fr) 0.8fr 1fr;
    }

    .jt__c-filament,
    .jt__c-size {
      display: none;
    }
  }
</style>
