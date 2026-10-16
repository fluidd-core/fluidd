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
  selectedContext = ''
  activeProbeContext: string | null = null
  selectedContextWasInactive = false

  get recoveryContext (): string { return `${this.commandTarget}|${cloudState.account?.id ?? ''}` }

  get recoveryState (): string {
    return `${this.recoveryContext}|${this.isManualProbeActive}|${this.klippyReady}|${this.printerState}`
  }

  @Watch('recoveryState', { immediate: true })
  async recover () {
    const revision = ++this.revision
    const context = this.recoveryContext
    if (context !== this.selectedContext) {
      this.selectedContext = context
      this.selectedContextWasInactive = false
    }
    if (!this.isManualProbeActive) {
      this.selectedContextWasInactive = true
      if (this.activeProbeContext === context) this.activeProbeContext = null
    } else if (this.activeProbeContext === null || this.selectedContextWasInactive) {
      // A context may claim the probe only initially or after its own state
      // reported inactive. This prevents the previous target's stale `true`
      // from being rebound while Vuex changes printer/account sessions.
      this.activeProbeContext = context
      this.selectedContextWasInactive = false
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
