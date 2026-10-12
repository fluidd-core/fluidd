<template>
  <main
    v-if="record"
    class="foreign-page"
  >
    <h1>{{ record.name }}</h1>
    <p class="foreign-muted">
      {{ record.model || brand.label }} · {{ record.host }}
    </p>
    <foreign-camera :url="status.cameraUrl" />
    <section class="foreign-card">
      <h2>{{ status.state === 'printing' ? 'Printing' : status.state === 'paused' ? 'Paused' : status.state }}</h2>
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
          {{ reading.id }} {{ Math.round(reading.actual) }}° / {{ reading.target === null ? '—' : `${Math.round(reading.target)}°` }}
        </span>
      </div>
      <div class="foreign-actions">
        <button
          v-if="adapter?.capabilities.pauseResume && status.state === 'printing'"
          class="btn"
          @click="adapter.pause()"
        >
          Pause
        </button>
        <button
          v-if="adapter?.capabilities.pauseResume && status.state === 'paused'"
          class="btn"
          @click="adapter.resume()"
        >
          Resume
        </button>
        <button
          v-if="adapter?.capabilities.stop && ['printing', 'paused'].includes(status.state)"
          class="btn btn--danger"
          @click="stop"
        >
          Stop
        </button>
        <button
          class="btn btn--ghost"
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
          <span>{{ item.supported ? '✓' : '×' }}</span>{{ item.label }}
        </li>
      </ul>
    </section>
    <p class="foreign-muted">
      The printer's own screen does the rest.
    </p>
  </main>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { foreignRecordForSlug } from '@/services/printer-pages'
import { adapterFor, connectAll, forget, liveForeign } from '@/services/foreign-printers/live'
import { foreignBrand } from '@/services/foreign-printers/brands'
import { emptyStatus } from '@/services/foreign-printers/adapters/base'
import type { ForeignStatus } from '@/services/foreign-printers/types'
import ForeignCamera from './ForeignCamera.vue'

@Component({ components: { ForeignCamera } })
export default class ForeignPrinterOverview extends Mixins(StateMixin) {
  get record () { return foreignRecordForSlug(this.$route.params.printer) }
  get status (): ForeignStatus { return this.record ? liveForeign.status[this.record.id] ?? emptyStatus() : emptyStatus() }
  get adapter () { return this.record ? adapterFor(this.record.id) : undefined }
  get brand () { return this.record ? foreignBrand(this.record.kind) : { label: '' } }

  get capabilities () {
    const c = this.adapter?.capabilities
    return [
      { label: 'See status and progress', supported: true },
      { label: 'See temperatures', supported: true },
      { label: 'Pause and resume', supported: !!c?.pauseResume },
      { label: 'Stop a print', supported: !!c?.stop },
      { label: 'Watch the camera', supported: !!c?.camera },
      { label: 'Start a print from its storage', supported: !!c?.printFromStorage },
      { label: 'Upload and print', supported: !!c?.upload },
      { label: 'Move the axes', supported: false },
      { label: 'Home', supported: false },
      { label: 'Calibrate', supported: false },
      { label: 'Update firmware', supported: false }
    ]
  }

  created () { connectAll().catch(() => {}) }
  duration (seconds: number) {
    const minutes = Math.floor(seconds / 60)
    return minutes ? `${minutes} min` : `${Math.ceil(seconds)} sec`
  }

  async stop () {
    if (await this.$confirm('This cancels the current print.', { title: 'Stop this print?', buttonTrueText: 'Stop', danger: true })) {
      await this.adapter?.stop()
    }
  }

  async forgetPrinter () {
    if (await this.$confirm('Fluidd forgets this printer in this browser.', { title: `Forget ${this.record?.name}?`, buttonTrueText: 'Forget', danger: true })) {
      if (this.record) await forget(this.record.id)
      this.$router.push('/').catch(() => {})
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
.foreign-card li span { margin-right: 9px; color: var(--m3d-success); }
.foreign-card li.unsupported { color: var(--m3d-text-muted); }
.foreign-card li.unsupported span { color: var(--m3d-danger); }
</style>
