<template>
  <main
    v-if="record"
    class="foreign-page"
  >
    <p class="foreign-muted">
      {{ record.model || brand.label }} · {{ record.host }}
    </p>
    <p
      v-if="mixedContentBlocked"
      class="foreign-muted"
    >
      Firefox and Safari block this HTTPS page from reaching a printer over plain HTTP or WebSocket: mixed content. Open Fluidd in Chrome on a computer or Android and allow local network access.
    </p>
    <foreign-camera
      :url="status.cameraUrl"
      @failed="cameraFailed = $event"
    />
    <section class="foreign-card">
      <h2>{{ stateLabel(status.state) }}</h2>
      <p v-if="status.message && status.message !== stateLabel(status.state)">
        {{ status.message }}
      </p>
      <p v-if="status.file">
        {{ status.file }}
      </p>
      <v-progress-linear
        v-if="status.progress !== null"
        :value="status.progress * 100"
      />
      <p v-if="status.timeLeft !== null">
        {{ duration(status.timeLeft) }} remaining
      </p>
      <div class="foreign-temps">
        <span
          v-for="reading in status.temps"
          :key="reading.id"
        >
          {{ temperatureName(reading.id) }} {{ Math.round(reading.actual) }}° / {{ reading.target === null ? '—' : `${Math.round(reading.target)}°` }}
        </span>
      </div>
      <div class="foreign-actions">
        <button
          v-if="directCapabilities?.pauseResume && status.state === 'printing'"
          class="cbtn"
          @click="pause"
        >
          Pause
        </button>
        <button
          v-if="directCapabilities?.pauseResume && status.state === 'paused'"
          class="cbtn"
          @click="resume"
        >
          Resume
        </button>
        <button
          v-if="directCapabilities?.stop && ['printing', 'paused'].includes(status.state)"
          class="cbtn cbtn--danger"
          @click="stop"
        >
          Stop
        </button>
        <button
          class="cbtn cbtn--ghost"
          @click="forgetPrinter"
        >
          Forget
        </button>
      </div>
    </section>
    <section class="foreign-card">
      <h2>With this printer, Fluidd can</h2>
      <ul>
        <li
          v-for="item in capabilities"
          :key="item.label"
          :class="{ unsupported: !item.supported }"
        >
          <frame-icon
            :name="item.supported ? 'check' : 'x'"
            small
          />
          {{ item.label }}
        </li>
      </ul>
    </section>
  </main>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { EventBus } from '@/eventBus'
import { foreignRecordForSlug } from '@/services/printer-pages'
import { adapterFor, connectAll, forget, liveForeign } from '@/services/foreign-printers/live'
import { foreignBrand } from '@/services/foreign-printers/brands'
import { emptyStatus } from '@/services/foreign-printers/adapters/base'
import { FOREIGN_STATE_LABELS, type DirectKind, type ForeignCapabilities, type ForeignStatus, type ForeignTemp } from '@/services/foreign-printers/types'
import { capabilitiesFor } from '@/services/foreign-printers/adapters'
import { shortDuration } from '@/util/short-duration'
import ForeignCamera from './ForeignCamera.vue'
import { blocksForeignHttp } from '@/util/browser-family'
import { pageBlocksPrinter } from '@/util/page-blocks-printer'

@Component({ components: { ForeignCamera } })
export default class ForeignPrinterOverview extends Mixins(StateMixin) {
  cameraFailed = false

  get record () { return foreignRecordForSlug(this.$route.params.printer) }
  get status (): ForeignStatus { return this.record ? liveForeign.status[this.record.id] ?? emptyStatus() : emptyStatus() }
  get adapter () { return this.record ? adapterFor(this.record.id) : undefined }
  get mixedContentBlocked () { return this.record?.via === 'direct' && blocksForeignHttp() && pageBlocksPrinter(`http://${this.record.host}`) }
  get brand () { return this.record ? foreignBrand(this.record.kind) : { label: '' } }
  get directCapabilities (): ForeignCapabilities | null {
    return this.record?.via === 'direct' ? capabilitiesFor(this.record.kind as DirectKind) : null
  }

  stateLabel (state: ForeignStatus['state']) {
    return FOREIGN_STATE_LABELS[state]
  }

  temperatureName (id: ForeignTemp['id']) {
    return id[0].toUpperCase() + id.slice(1)
  }

  duration (seconds: number) {
    return shortDuration(seconds)
  }

  get capabilities () {
    const c = this.directCapabilities
    return [
      { label: 'See status and progress', supported: true },
      { label: 'See temperatures', supported: true },
      { label: 'Pause and resume', supported: !!c?.pauseResume },
      { label: 'Stop a print', supported: !!c?.stop },
      { label: 'Get its camera URL', supported: !!this.status.cameraUrl },
      { label: 'Watch the camera', supported: /^https?:/i.test(this.status.cameraUrl ?? '') && !this.cameraFailed },
      { label: 'Start a print from its storage', supported: !!c?.printFromStorage },
      { label: 'Upload and print', supported: !!c?.upload },
      { label: 'Move the axes', supported: false },
      { label: 'Home', supported: false },
      { label: 'Calibrate', supported: false },
      { label: 'Update firmware', supported: false }
    ]
  }

  created () { connectAll().catch(() => {}) }

  async pause () { await this.runAction(() => this.adapter?.pause()) }
  async resume () { await this.runAction(() => this.adapter?.resume()) }

  async stop () {
    const adapter = this.adapter
    if (await this.$confirm('This cancels the current print.', { title: 'Stop this print?', buttonTrueText: 'Stop', danger: true })) {
      await this.runAction(() => adapter?.stop())
    }
  }

  private async runAction (action: () => Promise<void> | undefined) {
    try {
      const result = action()
      if (!result) throw new Error('Not connected')
      await result
    } catch (error) {
      EventBus.$emit(error instanceof Error ? error.message : 'The printer command failed.', { type: 'error' })
    }
  }

  async forgetPrinter () {
    const record = this.record
    const slug = this.$route.params.printer
    if (!record) return
    if (await this.$confirm('Fluidd forgets this printer in this browser.', { title: `Forget ${record.name}?`, buttonTrueText: 'Forget', danger: true })) {
      await forget(record.id)
      if (this.$route.params.printer === slug) this.$router.push('/').catch(() => {})
    }
  }
}
</script>

<style scoped>
.foreign-page { display: flex; flex-direction: column; gap: 18px; max-width: 1000px; margin: auto; }
.foreign-page h1, .foreign-page h2 { margin: 0; }
.foreign-page h2 { font-size: 18px; }
.foreign-muted { color: var(--m3d-text-muted); }
.foreign-card { padding: 20px; border-radius: 18px; background: var(--m3d-surface); }
.foreign-temps, .foreign-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 16px; }
.foreign-card ul { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 10px; padding: 14px 0 0; list-style: none; }
.foreign-card li { display: flex; align-items: center; gap: 9px; }
.foreign-card li .frame-icon { color: var(--m3d-success); }
.foreign-card li.unsupported { color: var(--m3d-text-muted); }
.foreign-card li.unsupported .frame-icon { color: var(--m3d-danger); }
</style>
