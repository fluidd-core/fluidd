<template>
  <div
    class="library"
    data-tid="print-handoff"
  >
    <header class="library__head">
      <div class="library__titles">
        <h1>Print from Library</h1><p>Check the file and printer before sending it.</p>
      </div>
    </header>
    <section
      v-if="!signedIn"
      class="lib-empty lib-surface"
    >
      <h2>Sign in to continue</h2><p>Your Library and printers belong to your Muon3D account.</p>
      <button
        class="lib-btn lib-btn--pri"
        @click="accountDialog = true"
      >
        Sign in
      </button>
    </section>
    <section
      v-else-if="error"
      class="lib-empty lib-surface"
    >
      <h2>That print couldn't be opened</h2><p role="alert">
        {{ error }}
      </p>
    </section>
    <section
      v-else-if="!item"
      class="lib-empty lib-surface"
    >
      <p>Reading the print and its version…</p>
    </section>
    <section
      v-else-if="!setup"
      class="lib-empty lib-surface"
      data-tid="handoff-needs-slicing"
    >
      <h2>This print needs slicing first</h2>
      <a
        class="lib-btn lib-btn--pri"
        :href="sliceUrl"
      >Open in Slice</a>
    </section>
    <section
      v-else
      class="lib-surface handoff"
    >
      <h2>{{ fileName }}</h2>
      <p v-if="facts">
        {{ facts }}
      </p>
      <label class="handoff__label">
        <span>Printer</span>
        <span class="lib-field">
          <select
            v-model="chosen"
            :disabled="busy"
            data-tid="handoff-printer"
          >
            <option
              value=""
              disabled
            >Choose a printer</option>
            <option
              v-for="row in rows"
              :key="row.id"
              :value="row.id"
            >{{ row.name }} — {{ row.status || row.detail }}</option>
          </select>
        </span>
      </label>
      <p
        v-for="warning in warnings"
        :key="warning"
        class="library__warn"
      >
        {{ warning }}
      </p>
      <p
        v-if="step"
        role="status"
      >
        {{ step }}
      </p><p
        v-if="actionError"
        role="alert"
        class="m3-dlg__error"
      >
        {{ actionError }}
      </p>
      <button
        v-if="selected && !selected.active"
        class="lib-btn lib-btn--pri"
        data-tid="handoff-open-printer"
        :disabled="busy"
        @click="openSelected"
      >
        Open {{ selected.name }}
      </button>
      <button
        v-else-if="!uploadedPath"
        class="lib-btn lib-btn--pri"
        :disabled="!canUpload || busy"
        @click="upload"
      >
        Confirm and upload
      </button>
      <template v-else>
        <p>{{ fileName }} is on {{ selected && selected.name }}. It has not started.</p>
        <p
          v-if="selected && !selected.active"
          class="library__warn"
          data-tid="handoff-not-here"
        >
          This page is on another printer. Open {{ selected.name }} to start the print there.
        </p>
        <button
          class="lib-btn lib-btn--pri"
          :disabled="busy || !canStart"
          data-tid="handoff-start"
          @click="start"
        >
          Start print
        </button>
      </template>
    </section>
    <cloud-account-dialog
      v-if="accountDialog"
      v-model="accountDialog"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import PrinterRowsMixin from '@/mixins/printer-rows'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'
import { cloudState } from '@/services/muon-cloud/state'
import { describeLibraryError, type ItemSetup, type LibraryItem } from '@/services/library/api'
import { libraryClient } from '@/services/library/store'
import { defaultPrintTarget, handoffWarnings } from '@/services/library/handoff'
import { fetchGcode, downloadSharedGcode, gcodeFileName, uploadGcode, activePrinterFacts, printingNow, START_ANSWER_MS, type StoredFileFacts } from '@/services/library/print-on'
import { fitText, setupFit } from '@/services/library/fit'
import { httpClientActions } from '@/api/httpClientActions'
import { rememberLibraryFile } from '@/services/library/runs'
import { printerPath } from '@/services/printer-pages'
import '@/scss/muon3d-library.scss'

@Component({ components: { CloudAccountDialog } })
export default class PrintHandoff extends Mixins(PrinterRowsMixin) {
  item: Pick<LibraryItem, 'id' | 'name' | 'setups' | 'version'> | null = null
  setup: ItemSetup | null = null
  /** The file's listed size, SHA-256 and encoding (of the stored bytes), which the downloaded bytes must match. */
  expected: StoredFileFacts | null = null
  chosen = ''
  uploadedPath = ''
  uploadedPrinterId = ''
  bytes: Uint8Array | null = null
  /** SHA-256 of the downloaded G-code as stored, which run reporting sends. */
  storedSha256 = ''
  accountDialog = false
  busy = false
  error = ''
  actionError = ''
  step = ''

  get signedIn () { return cloudState.account !== null }
  get itemId () { return typeof this.$route.query.library === 'string' ? this.$route.query.library : '' }
  get publicationId () { return typeof this.$route.query.publication === 'string' ? this.$route.query.publication : '' }
  get isPublic () { return !!this.publicationId }
  get version () { const n = Number(this.$route.query.version); return Number.isInteger(n) && n > 0 ? n : null }
  get selected () { return this.rows.find(row => row.id === this.chosen) ?? null }
  get fileName () { return this.item ? gcodeFileName(this.item) : '' }
  get warnings () { return handoffWarnings(this.selected, this.setup) }
  // The upload helper uses Fluidd's active HTTP client; it cannot address a row explicitly.
  get canUpload () { return !!this.selected && this.selected.active && this.selected.fit.kind === 'ready' && this.selected.action === 'print' }
  // Start goes to the printer Fluidd is on, so it must be the one chosen: never another printer's file.
  get canStart () { return !!this.selected && this.selected.active && this.uploadedPrinterId === this.selected.id && !!this.uploadedPath && !printingNow(this.$store) }
  get facts () { return this.setup ? [this.setup.print_seconds ? `${Math.round(this.setup.print_seconds / 60)} min` : '', this.setup.filament_g ? `${this.setup.filament_g} g` : ''].filter(Boolean).join(' · ') : '' }
  get sliceUrl () { return `https://slicer.muon3d.com/?library=${encodeURIComponent(this.itemId)}&version=${this.version ?? ''}` }

  @Watch('signedIn', { immediate: true })
  async load () {
    if (!this.signedIn || (!this.itemId && !this.publicationId) || !this.version) return
    try {
      const client = libraryClient()
      const requested = typeof this.$route.query.file === 'string' ? this.$route.query.file : null
      if (this.publicationId) {
        if (!requested) throw new Error('That public print does not identify a G-code file.')
        const publication = await client.publicPublication(this.publicationId)
        if (publication.version !== this.version) throw new Error('That public version is no longer available.')
        const file = publication.files.find(f => f.role === 'gcode' && f.id === requested)
        if (!file) throw new Error('That G-code file is not in this public print.')
        if (!file.sha256) throw new Error('That public print does not list a checksum for its G-code.')
        this.expected = { sha256: file.sha256, size_bytes: file.size_bytes, encoding: file.encoding }
        this.item = { id: this.publicationId, name: publication.title, setups: file.setup ? [{ ...file.setup, file_id: file.id, print_seconds: file.print_seconds ?? null, filament_g: file.filament_g ?? null }] : [] }
      } else {
        const [item, answer] = await Promise.all([client.item(this.itemId), client.versions(this.itemId)])
        const version = answer.versions.find(v => v.number === this.version)
        if (!version) throw new Error('That version is no longer in your Library.')
        const file = version.files.find(f => f.role === 'gcode' && (!requested || f.id === requested))
        if (requested && !file) throw new Error('That G-code file is not in this Library version.')
        this.expected = file ? { sha256: file.sha256, size_bytes: file.size_bytes, encoding: file.encoding } : null
        this.item = { id: item.id, name: item.name, version: version.number, setups: file?.setup ? [{ ...file.setup, file_id: file.id, print_seconds: file.print_seconds ?? null, filament_g: file.filament_g ?? null }] : [] }
      }
      this.setup = this.item?.setups?.[0] ?? null
      // Upload state is trusted only when produced by this component. URL values must never arm Start.
      this.uploadedPath = ''
      this.uploadedPrinterId = ''
      await this.$nextTick()
      const requestedPrinter = typeof this.$route.query.printer === 'string' ? this.$route.query.printer : ''
      this.chosen = this.rows.find(row => row.id === requestedPrinter)?.id ?? defaultPrintTarget(this.rows)?.id ?? ''
    } catch (error) { this.error = describeLibraryError(error) }
  }

  @Watch('chosen')
  chosenChanged (next: string, previous: string) {
    if (previous && next !== previous) {
      this.uploadedPath = ''
      this.uploadedPrinterId = ''
      this.bytes = null
      this.storedSha256 = ''
    }
  }

  openSelected () {
    if (!this.selected || this.selected.active || this.busy) return
    this.$router.push({
      path: printerPath(this.selected.slug, 'print'),
      query: { ...(this.isPublic ? { publication: this.publicationId, file: this.setup?.file_id ?? '' } : { library: this.itemId, file: this.setup?.file_id ?? '' }), version: String(this.version ?? ''), printer: this.selected.id }
    }).catch(() => {})
  }

  /** What a run of this upload reports: the stored-bytes hash, and the print it came from (own item and version, or the share). */
  rememberRun () {
    if (!this.item) return
    rememberLibraryFile(this.uploadedPath, {
      ...(this.storedSha256 ? { gcode_sha256: this.storedSha256 } : {}),
      ...(this.isPublic ? { publication_id: this.publicationId } : this.version ? { item_id: this.item.id, version: this.version } : {})
    })
  }

  async upload () {
    if (!this.item || !this.setup || !this.selected || !this.canUpload) return
    this.busy = true; this.actionError = ''
    try {
      this.step = 'Downloading the G-code…'
      if (this.isPublic && !this.expected) throw new Error('That public print does not list its G-code, so it cannot be checked.')
      const downloaded = this.isPublic
        ? await downloadSharedGcode(this.publicationId, this.setup.file_id, this.expected as StoredFileFacts)
        : await fetchGcode(this.item, this.setup, this.expected ?? undefined)
      this.bytes = downloaded.bytes; this.storedSha256 = downloaded.stored_sha256
      const fit = setupFit(this.setup, activePrinterFacts(this.$store, this.modelOf(this.selected.id)))
      if (fit.kind !== 'ready') throw new Error(fitText(fit).label)
      if (printingNow(this.$store)) throw new Error(`${this.selected.name} is busy.`)
      const target = this.selected
      if (!target.active) return
      this.step = 'Uploading to the printer…'; this.uploadedPath = await uploadGcode(this.$store, this.fileName, this.bytes)
      this.uploadedPrinterId = target.id
      this.rememberRun()
    } catch (error) { this.actionError = error instanceof Error ? error.message : String(error) } finally { this.busy = false; this.step = '' }
  }

  async start () {
    if (!this.uploadedPath || !this.selected || !this.item || !this.canStart) return
    this.busy = true; this.actionError = ''
    try {
      this.rememberRun()
      await httpClientActions.post('/printer/print/start', { filename: this.uploadedPath }, { timeout: START_ANSWER_MS })
      this.$router.push('/' + this.selected.slug).catch(() => {})
    } catch (error) { this.actionError = error instanceof Error ? error.message : String(error) } finally { this.busy = false }
  }
}
</script>

<style lang="scss" scoped>
  .library {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 720px;
    margin: 0 auto;
    padding: 6px 12px 40px;
    color: var(--m3d-text);
  }

  .library__head {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 16px;
  }

  .library__titles {
    display: flex;
    flex-direction: column;
    gap: 6px;

    h1 {
      margin: 0;
      font-family: var(--m3d-font-display);
      font-size: 30px;
      font-weight: 400;
      letter-spacing: 0.01em;
      line-height: 1.1;
    }

    p {
      margin: 0;
      color: var(--m3d-text-muted);
      font-size: 14px;
    }
  }

  .handoff {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    padding: 24px;

    h2,
    p {
      margin: 0;
    }

    h2 {
      font-size: 20px;
      overflow-wrap: anywhere;
    }

    p {
      font-size: 14px;
      color: var(--m3d-text-muted);
    }

    .library__warn {
      color: var(--m3d-warning);
    }

    .m3-dlg__error {
      color: var(--m3d-danger);
    }
  }

  .handoff__label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    font-size: 13px;
    color: var(--m3d-text-muted);

    .lib-field {
      color: var(--m3d-text);
    }

    select {
      width: 100%;
      min-width: 0;
      color: var(--m3d-text);
      text-overflow: ellipsis;
    }

    option {
      color: initial;
    }
  }
</style>
