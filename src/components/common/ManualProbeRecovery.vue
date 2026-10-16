<template>
  <manual-probe-dialog
    v-if="shown"
    v-model="shown"
  />
</template>
<script lang="ts">
import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import TypedCommandsMixin from '@/mixins/typed-commands'
import ToolheadMixin from '@/mixins/toolhead'
import { cloudState } from '@/services/muon-cloud/state'
import ManualProbeDialog from './ManualProbeDialog.vue'
@Component({ components: { ManualProbeDialog } })
export default class ManualProbeRecovery extends Mixins(TypedCommandsMixin, ToolheadMixin) {
  @Prop({ type: Boolean }) readonly value?: boolean
  @Prop({ type: Boolean, default: true }) readonly automatic!: boolean
  shown = false
  revision = 0
  statusRevision = 0
  selectedContextStatusRevision = 0
  selectedContext = ''
  activeProbeContext: string | null = null

  get recoveryContext (): string { return `${this.commandTarget}|${cloudState.account?.id ?? ''}` }

  get recoveryState (): string {
    return `${this.recoveryContext}|${this.isManualProbeActive}|${this.klippyReady}|${this.printerState}`
  }

  get manualProbeStatus () { return this.$store.state.printer.printer.manual_probe }

  @Watch('manualProbeStatus', { deep: true })
  onManualProbeStatus () {
    this.statusRevision++
    this.recover()
  }

  @Watch('recoveryState', { immediate: true })
  async recover () {
    const revision = ++this.revision
    const context = this.recoveryContext
    if (context !== this.selectedContext) {
      const initialContext = this.selectedContext === ''
      this.selectedContext = context
      this.selectedContextStatusRevision = this.statusRevision + (initialContext ? 0 : 1)
      this.shown = false
      // On a later context, the Vuex object still contains the previous
      // printer's in-place status until Moonraker sends this printer's status.
      if (!initialContext) return
    }
    if (this.statusRevision < this.selectedContextStatusRevision) return
    if (!this.isManualProbeActive) {
      if (this.activeProbeContext === context) this.activeProbeContext = null
    } else {
      // Only the initial context or a fresh status update may claim the probe.
      this.activeProbeContext = context
    }
    this.shown = false
    // Destroy the old dialog before opening one for the verified context.
    await this.$nextTick()
    if (revision === this.revision && context === this.recoveryContext && context === this.activeProbeContext &&
      this.automatic && this.isManualProbeActive && this.klippyReady && !this.printerPrinting && !this.printerPaused) this.shown = true
  }

  @Watch('value')
  onValue (value: boolean) { this.shown = value }

  @Watch('shown')
  onShown (value: boolean) { this.$emit('input', value) }
}
</script>
