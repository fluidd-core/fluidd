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
      class="lib-surface"
      style="padding:24px"
    >
      <h2>{{ fileName }}</h2>
      <p v-if="facts">
        {{ facts }}
      </p>
      <label>Printer
        <select
          v-model="chosen"
          class="lib-field"
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
        v-if="!uploadedPath"
        class="lib-btn lib-btn--pri"
        :disabled="!canUpload || busy"
        @click="upload"
      >
        Confirm and upload
      </button>
      <template v-else>
        <p>{{ fileName }} is on {{ selected && selected.name }}. It has not started.</p>
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
import { downloadGcode, gcodeFileName, openPrinter, uploadGcode, activePrinterFacts, printingNow, START_ANSWER_MS } from '@/services/library/print-on'
import { fitText, setupFit } from '@/services/library/fit'
import { httpClientActions } from '@/api/httpClientActions'
import { rememberLibraryFile } from '@/services/library/runs'
import { printerPath } from '@/services/printer-pages'
import '@/scss/muon3d-library.scss'

@Component({ components: { CloudAccountDialog } })
export default class PrintHandoff extends Mixins(PrinterRowsMixin) {
  item: LibraryItem | null = null
  setup: ItemSetup | null = null
  chosen = ''
  uploadedPath = ''
  bytes: Uint8Array | null = null
  accountDialog = false
  busy = false
  error = ''
  actionError = ''
  step = ''

  get signedIn () { return cloudState.account !== null }
  get itemId () { return typeof this.$route.query.library === 'string' ? this.$route.query.library : '' }
  get version () { const n = Number(this.$route.query.version); return Number.isInteger(n) && n > 0 ? n : null }
  get selected () { return this.rows.find(row => row.id === this.chosen) ?? null }
  get fileName () { return this.item ? gcodeFileName(this.item) : '' }
  get warnings () { return handoffWarnings(this.selected, this.setup) }
  get canUpload () { return !!this.selected && this.selected.fit.kind === 'ready' && this.selected.action === 'print' }
  get canStart () { return !!this.selected && !printingNow(this.$store) }
  get facts () { return this.setup ? [this.setup.print_seconds ? `${Math.round(this.setup.print_seconds / 60)} min` : '', this.setup.filament_g ? `${this.setup.filament_g} g` : ''].filter(Boolean).join(' · ') : '' }
  get sliceUrl () { return `https://slicer.muon3d.com/?library=${encodeURIComponent(this.itemId)}&version=${this.version ?? ''}` }

  @Watch('signedIn', { immediate: true })
  async load () {
    if (!this.signedIn || !this.itemId || !this.version) return
    try {
      const client = libraryClient()
      const [item, answer] = await Promise.all([client.item(this.itemId), client.versions(this.itemId)])
      const version = answer.versions.find(v => v.number === this.version)
      if (!version) throw new Error('That version is no longer in your Library.')
      const requested = typeof this.$route.query.file === 'string' ? this.$route.query.file : null
      const file = version.files.find(f => f.role === 'gcode' && (!requested || f.id === requested))
      this.item = { ...item, version: version.number, setups: file?.setup ? [{ ...file.setup, file_id: file.id, print_seconds: file.print_seconds ?? null, filament_g: file.filament_g ?? null }] : [] }
      this.setup = this.item.setups?.[0] ?? null
      this.uploadedPath = typeof this.$route.query.uploaded === 'string' ? this.$route.query.uploaded : ''
      await this.$nextTick()
      const requestedPrinter = typeof this.$route.query.printer === 'string' ? this.$route.query.printer : ''
      this.chosen = this.rows.find(row => row.id === requestedPrinter)?.id ?? defaultPrintTarget(this.rows)?.id ?? ''
    } catch (error) { this.error = describeLibraryError(error) }
  }

  async upload () {
    if (!this.item || !this.setup || !this.selected || !this.canUpload) return
    this.busy = true; this.actionError = ''
    try {
      this.step = 'Downloading the G-code…'; this.bytes = await downloadGcode(this.item, this.setup)
      this.step = `Opening ${this.selected.name}…`; await openPrinter(this.$router, this.$store, this.selected)
      const fit = setupFit(this.setup, activePrinterFacts(this.$store, this.modelOf(this.selected.id)))
      if (fit.kind !== 'ready') throw new Error(fitText(fit).label)
      if (printingNow(this.$store)) throw new Error(`${this.selected.name} is busy.`)
      this.step = 'Uploading to the printer…'; this.uploadedPath = await uploadGcode(this.$store, this.fileName, this.bytes)
      rememberLibraryFile(this.uploadedPath, { bytes: this.bytes, item_id: this.item.id, version: this.version ?? undefined })
      await this.$router.push({ path: printerPath(this.selected.slug, 'print'), query: { ...this.$route.query, printer: this.selected.id, uploaded: this.uploadedPath } }).catch(() => {})
    } catch (error) { this.actionError = error instanceof Error ? error.message : String(error) } finally { this.busy = false; this.step = '' }
  }

  async start () {
    if (!this.uploadedPath || !this.selected || !this.item || !this.canStart) return
    this.busy = true; this.actionError = ''
    try {
      rememberLibraryFile(this.uploadedPath, { ...(this.bytes ? { bytes: this.bytes } : {}), item_id: this.item.id, version: this.version ?? undefined })
      await httpClientActions.post('/printer/print/start', { filename: this.uploadedPath }, { timeout: START_ANSWER_MS })
      this.$router.push('/' + this.selected.slug).catch(() => {})
    } catch (error) { this.actionError = error instanceof Error ? error.message : String(error) } finally { this.busy = false }
  }
}
</script>
