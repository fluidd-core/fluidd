<template>
  <section class="ov-card">
    <h2 class="ov-card__title">
      Objects on the plate
    </h2>
    <p>Skip one if it fails. The rest of the plate carries on.</p>
    <div
      v-for="object in objects"
      :key="object.name"
      class="overview-object"
    >
      <span>{{ object.name }}</span>
      <span v-if="excluded.includes(object.name)">Skipped</span>
      <button
        v-else
        type="button"
        class="cbtn"
        :disabled="!controlReady || !busy"
        @click="skip(object.name)"
      >
        Skip
      </button>
    </div>
  </section>
</template>
<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
@Component
export default class OverviewObjects extends Mixins(OverviewMixin) {
  get objects (): Array<{ name: string }> { return this.$store.state.printer.printer.exclude_object?.objects ?? [] }
  get excluded (): string[] { return this.$store.state.printer.printer.exclude_object?.excluded_objects ?? [] }
  async skip (name: string) {
    if (!this.controlReady || !(this.printerPrinting || this.printerPaused) || !this.objects.some(o => o.name === name) || this.excluded.includes(name) || !/^[a-z0-9_.-]+$/i.test(name)) return
    const target = this.panelTarget
    const file = this.jobFile
    const job = this.activePrintJob?.job_id
    const duration = this.printStats.total_duration ?? 0
    const ok = await this.$confirm('A skipped object cannot be added back to this print.', { title: `Stop printing ${name}?`, buttonTrueText: 'Skip it', danger: true })
    if (ok && job === this.activePrintJob?.job_id && (this.printStats.total_duration ?? 0) >= duration && target === this.panelTarget && file === this.jobFile && this.controlReady && (this.printerPrinting || this.printerPaused) && this.objects.some(o => o.name === name) && !this.excluded.includes(name)) await this.sendTypedGcode(`EXCLUDE_OBJECT NAME=${name}`)
  }
}
</script>
<style scoped>
.overview-object { display: flex; justify-content: space-between; align-items: center; gap: 8px; min-height: 44px; }
.overview-object > span:first-child { overflow-wrap: anywhere; }
</style>
