<template>
  <div
    class="files-page"
    :class="{ 'files-page--phone': isMobileViewport, 'files-page--editing': !!current }"
    data-tid="files-page"
  >
    <aside class="fp__list">
      <div class="fp__list-head">
        <span>{{ printerName }}'s files</span>
        <router-link
          v-if="devMode !== null"
          :to="developerTo"
          class="fp__dev"
          :class="{ 'fp__dev--on': devMode }"
          :title="devMode ? 'Developer mode is on: the config folder is yours to change' : 'Developer mode is off: the printer\'s config is read only'"
          data-tid="files-dev-mode"
        >
          {{ devMode ? 'Developer mode on' : 'Developer mode off' }}
        </router-link>
      </div>
      <files-tree
        ref="tree"
        :roots="roots"
        :selected="current ? current.key : null"
        :dirty="dirty && current ? [current.key] : []"
        @open="open"
        @created="open({ ...$event, key: `${$event.root}/${$event.name}`, folder: false, depth: 0, size: 0, readonly: false })"
      />
    </aside>

    <section
      class="fp__editor"
      data-tid="files-editor"
    >
      <template v-if="current">
        <header class="fp__head">
          <button
            v-if="isMobileViewport"
            type="button"
            class="fp__back"
            aria-label="Back to the files"
            @click="close"
          >
            <frame-icon
              name="chevronLeft"
              small
            />
          </button>
          <div class="fp__titles">
            <h2>{{ current.name }}</h2>
            <p>
              {{ group.title }}<template v-if="current.dir">
                · {{ current.dir }}/
              </template>
              <template v-if="readonly">
                · read only
              </template>
              <template v-if="dirty">
                · <b class="fp__unsaved">{{ changed }} {{ changed === 1 ? 'line' : 'lines' }} unsaved</b>
              </template>
            </p>
          </div>
          <span class="fp__grow" />
          <button
            v-if="dirty"
            type="button"
            class="fp__link"
            @click="undo"
          >
            Undo changes
          </button>
          <button
            type="button"
            class="fp__icon"
            aria-label="Download"
            title="Download"
            @click="download(current)"
          >
            <frame-icon
              name="download"
              small
            />
          </button>
          <template v-if="!readonly">
            <button
              type="button"
              class="fp__icon"
              aria-label="Rename"
              title="Rename"
              @click="renaming = true"
            >
              <frame-icon
                name="pencil"
                small
              />
            </button>
            <button
              type="button"
              class="fp__icon fp__icon--danger"
              aria-label="Delete"
              title="Delete"
              data-tid="files-delete"
              @click="remove"
            >
              <frame-icon
                name="trash"
                small
              />
            </button>
            <button
              type="button"
              class="cbtn"
              :disabled="!dirty || saving"
              data-tid="files-save"
              @click="save(false)"
            >
              Save
            </button>
            <button
              v-if="service"
              type="button"
              class="cbtn cbtn--primary"
              :disabled="saving"
              data-tid="files-save-restart"
              @click="save(true)"
            >
              Save and restart {{ serviceName }}
            </button>
          </template>
        </header>

        <div class="fp__body">
          <p
            v-if="loading"
            class="fp__note"
          >
            Opening {{ current.name }}…
          </p>
          <p
            v-else-if="error"
            class="fp__note fp__note--error"
          >
            {{ error }}
          </p>
          <template v-else-if="content !== null">
            <file-editor
              v-if="!textOnly"
              :key="`${current.key}:${openLine}`"
              v-model="content"
              class="fp__monaco"
              :path="`${current.root}${current.dir ? `/${current.dir}` : ''}`"
              :filename="current.name"
              :readonly="readonly"
              :code-lens="codeLens"
              :line="openLine"
              @save="save(false)"
              @emergency-stop="emergencyStop"
            />
            <file-editor-text-only
              v-else
              :key="current.key"
              v-model="content"
              class="fp__monaco"
              :filename="current.name"
              :readonly="readonly"
            />
          </template>
        </div>

        <p
          v-if="note && !readonly"
          class="fp__foot"
        >
          {{ note }}
        </p>
      </template>

      <div
        v-else
        class="fp__empty"
      >
        <frame-icon name="files" />
        <p>Pick a file to read or change it. Logs download.</p>
      </div>
    </section>

    <file-name-dialog
      v-if="renaming && current"
      v-model="renaming"
      title="Rename"
      label="Name"
      :name="current.name"
      @save="rename"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import type { NavigationGuardNext, Route } from 'vue-router'
import OverviewMixin from '@/mixins/overview'
import ServicesMixin from '@/mixins/services'
import BrowserMixin from '@/mixins/browser'
import { SocketActions } from '@/api/socketActions'
import { changedLines, opensInEditor, orderRoots, restartNote, rootGroup, validName } from '@/services/files/model'
import isWebAssemblySupported from '@/util/is-web-assembly-supported'
import FilesTree, { type FileRow } from '@/components/files/FilesTree.vue'
import FileEditor from '@/components/widgets/filesystem/FileEditor.vue'
import FileEditorTextOnly from '@/components/widgets/filesystem/FileEditorTextOnly.vue'
import FileNameDialog from '@/components/widgets/filesystem/FileNameDialog.vue'
import { devModeState, refreshDevMode } from '@/services/dev-mode/state'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'

/**
 * Files (Pro): the printer's folders on the left (its own settings, the
 * Muon3D defaults, logs and the rest) and the file open on the right, in
 * the editor, with Save, and Save and restart for files a service reads.
 * Developer mode, which makes the config folder yours, is in Settings; the
 * head of the list says whether it's on and goes there. `?open=config/
 * macros/filament.cfg&line=49` opens a file at a line (a macro's Edit).
 */
@Component({ components: { FilesTree, FileEditor, FileEditorTextOnly, FileNameDialog } })
export default class Configure extends Mixins(OverviewMixin, ServicesMixin, BrowserMixin) {
  current: FileRow | null = null
  openLine = 0
  content: string | null = null
  saved = ''
  loading = false
  saving = false
  error = ''
  renaming = false

  get roots (): string[] {
    const registered = (this.$store.state.server.info.registered_directories as string[] | undefined) ?? []
    const skip = ['gcodes', 'timelapse', 'timelapse_frames', ...(this.devMode ? [] : ['config'])]
    const roots = new Set(['calibration', 'defaults', 'logs', 'docs', ...registered].filter(r => !skip.includes(r)))
    if (this.devMode) roots.add('config')
    return orderRoots([...roots])
  }

  /** Whether developer mode is on, or null until the printer says. */
  get devMode (): boolean | null {
    return devModeState.enabled
  }

  get developerTo (): string {
    return `${scopedPath('/settings', activeSlug())}#developer`
  }

  @Watch('devMode')
  onDevMode () {
    this.refresh()
  }

  /** `?open=root/dir/name.cfg&line=N`: opens that file, at that line. */
  @Watch('$route.query', { immediate: true })
  async onOpenQuery () {
    const open = String(this.$route.query.open ?? '')
    const match = /^([^/]+)\/(?:(.*)\/)?([^/]+)$/.exec(open)
    if (!match) return
    const [, root, dir = '', name] = match
    const readonly = !!(this.$store.getters['files/getRootProperties'](root) as { readonly?: boolean } | undefined)?.readonly ||
      (root === 'config' && this.devMode === false)
    this.openLine = Number(this.$route.query.line) || 0
    await this.open({ key: open, root, dir, name, folder: false, depth: 0, size: 0, readonly })
  }

  refresh () {
    (this.$refs.tree as FilesTree | undefined)?.refresh()
  }

  get group () {
    return rootGroup(this.current?.root ?? '')
  }

  get readonly (): boolean {
    return !!this.current?.readonly
  }

  get dirty (): boolean {
    return this.content !== null && this.content !== this.saved
  }

  get changed (): number {
    return this.content === null ? 0 : changedLines(this.saved, this.content)
  }

  get textOnly (): boolean {
    return this.isMobileUserAgent || !isWebAssemblySupported()
  }

  get codeLens (): boolean {
    return this.$store.state.config.uiSettings.editor.codeLens
  }

  get configMap (): { service?: string, serviceSupported?: boolean } {
    return this.current ? this.$store.getters['server/getConfigMapByFilename'](this.current.name) ?? {} : {}
  }

  get service (): string | null {
    return this.configMap.serviceSupported && this.configMap.service ? this.configMap.service : null
  }

  get serviceName (): string {
    if (this.service === 'klipper') return 'Klipper'
    if (this.service === 'moonraker') return 'Moonraker'
    return this.service ?? ''
  }

  get note (): string {
    return restartNote(this.service, this.printerName, this.printerPrinting || this.printerPaused)
  }

  dirOf (row: Pick<FileRow, 'root' | 'dir'>): string {
    return row.dir ? `${row.root}/${row.dir}` : row.root
  }

  /** Unsaved changes are asked about before they're dropped. */
  async leaveOk (): Promise<boolean> {
    if (!this.dirty) return true
    return !!(await this.$confirm("Your changes to it aren't saved. If you go on, they're lost.", { title: `Drop your changes to ${this.current?.name}?`, buttonTrueText: 'Drop changes', buttonFalseText: 'Keep editing', danger: true }))
  }

  async open (row: FileRow) {
    if (row.key === this.current?.key) return
    if (rootGroup(row.root).download || !opensInEditor(row.name, row.size)) {
      this.download(row)
      return
    }
    if (!(await this.leaveOk())) return
    this.current = row
    this.content = null
    this.error = ''
    this.loading = true
    try {
      const response = await this.getFile<string>(row.name, this.dirOf(row), row.size, { responseType: 'text', transformResponse: [v => v] })
      if (this.current?.key !== row.key) return
      this.saved = response.data ?? ''
      this.content = this.saved
    } catch {
      if (this.current?.key === row.key) this.error = `${this.printerName} didn't send ${row.name}. Try again in a moment.`
    } finally {
      if (this.current?.key === row.key) this.loading = false
    }
  }

  async close () {
    if (!(await this.leaveOk())) return
    this.current = null
    this.content = null
  }

  undo () {
    this.content = this.saved
  }

  download (row: Pick<FileRow, 'root' | 'dir' | 'name'>) {
    this.downloadFile(row.name, this.dirOf(row))
  }

  async save (restart: boolean) {
    const row = this.current
    if (!row || this.content === null || this.readonly || this.saving) return
    const text = this.content
    this.saving = true
    try {
      await this.uploadFile(new File([text], row.name), row.dir, row.root, false)
      this.saved = text
    } finally {
      this.saving = false
    }
    if (!restart || !this.service) return
    if (this.service === 'moonraker') this.serviceRestartMoonraker()
    else if (this.service === 'klipper') this.firmwareRestartKlippy()
    else this.serviceRestartByName(this.service)
  }

  async rename (name: string) {
    const row = this.current
    if (!row || !validName(name) || name.trim() === row.name) return
    const to = name.trim()
    SocketActions.serverFilesMove(`${this.dirOf(row)}/${row.name}`, `${this.dirOf(row)}/${to}`)
    this.current = { ...row, name: to, key: `${this.dirOf(row)}/${to}` }
  }

  async remove () {
    const row = this.current
    if (!row) return
    const ok = await this.$confirm(`It's removed from ${this.printerName}. This can't be undone.`, { title: `Delete ${row.name}?`, buttonTrueText: 'Delete', danger: true })
    if (!ok) return
    SocketActions.serverFilesDeleteFile(`${this.dirOf(row)}/${row.name}`)
    this.current = null
    this.content = null
  }

  // Leaving the page or the site with unsaved changes asks first.
  mounted () {
    window.addEventListener('beforeunload', this.onBeforeUnload)
    refreshDevMode()
  }

  beforeDestroy () {
    window.removeEventListener('beforeunload', this.onBeforeUnload)
  }

  onBeforeUnload (event: BeforeUnloadEvent) {
    if (!this.dirty) return
    event.preventDefault()
    event.returnValue = true
  }

  async beforeRouteLeave (_to: Route, _from: Route, next: NavigationGuardNext) {
    if (await this.leaveOk()) next()
    else next(false)
  }
}
</script>

<style lang="scss" scoped>
  .files-page {
    display: grid;
    grid-template-columns: minmax(240px, 300px) minmax(0, 1fr);
    gap: 16px;
    height: calc(100vh - 250px);
    height: calc(100svh - 250px);
    min-height: 480px;
  }

  .fp__list {
    min-width: 0;
    overflow-y: auto;
    padding: 14px 8px;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .fp__list-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 0 4px 12px 12px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .fp__dev {
    padding: 3px 10px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted) !important;
    font-size: 12px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;
  }

  .fp__dev--on {
    background: rgb(232 150 60 / 18%);
    color: var(--m3d-warning, #e8963c) !important;
  }

  .fp__editor {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .fp__head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
    padding: 14px 16px 12px 20px;
    border-bottom: 1px solid var(--m3d-border);
  }

  .fp__titles {
    min-width: 0;

    h2 {
      margin: 0;
      overflow: hidden;
      font-family: var(--m3d-font-mono, monospace);
      font-size: 16px;
      font-weight: 600;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    p {
      margin: 2px 0 0;
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .fp__unsaved {
    color: var(--m3d-warning, #ff9f0a);
    font-weight: 600;
  }

  .fp__grow {
    flex: 1 1 auto;
  }

  .fp__link {
    color: var(--m3d-accent);
    font-size: 13px;
    font-weight: 600;
  }

  .fp__icon,
  .fp__back {
    display: inline-flex;
    padding: 8px;
    border-radius: 10px;
    color: var(--m3d-text-muted);

    &:hover {
      background: var(--m3d-surface-2);
      color: var(--m3d-text);
    }
  }

  .fp__icon--danger:hover {
    color: var(--m3d-danger);
  }

  .fp__body {
    position: relative;
    flex: 1 1 0;
    min-height: 0;
  }

  // Fluidd's editor sizes itself for its dialog's toolbar; here it fills the pane.
  .fp__body :deep(.fp__monaco) {
    height: 100% !important;
  }

  .fp__note {
    margin: 0;
    padding: 20px;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .fp__note--error {
    color: var(--m3d-danger);
  }

  .fp__foot {
    margin: 0;
    padding: 10px 20px;
    border-top: 1px solid var(--m3d-border);
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .fp__empty {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: var(--m3d-text-muted);
    font-size: 14px;

    p {
      margin: 0;
    }
  }

  // A phone shows the list, or the file open, not both.
  .files-page--phone {
    grid-template-columns: minmax(0, 1fr);
    height: calc(100svh - 230px);

    .fp__editor {
      display: none;
    }

    &.files-page--editing {
      .fp__list {
        display: none;
      }

      .fp__editor {
        display: flex;
      }
    }
  }
</style>
