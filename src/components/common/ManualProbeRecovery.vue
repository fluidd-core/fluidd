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

  get recoveryContext (): string { return `${this.commandTarget}|${cloudState.account?.id ?? ''}` }

  get recoveryState (): string {
    return `${this.recoveryContext}|${this.isManualProbeActive}|${this.klippyReady}|${this.printerState}`
  }

  @Watch('recoveryState', { immediate: true })
  async recover () {
    const revision = ++this.revision
    this.shown = false
    // Destroy the old dialog before capturing the newly selected context.
    await this.$nextTick()
    if (revision === this.revision && this.automatic && this.isManualProbeActive && this.klippyReady && !this.printerPrinting && !this.printerPaused) this.shown = true
  }

  @Watch('value')
  onValue (value: boolean) { this.shown = value }

  @Watch('shown')
  onShown (value: boolean) { this.$emit('input', value) }
}
</script>
