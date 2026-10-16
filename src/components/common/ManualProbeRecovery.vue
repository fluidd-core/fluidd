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
  selectedContext = ''
  contextFresh = false
  unsubscribeStatus: (() => void) | null = null

  get recoveryContext (): string { return `${this.commandTarget}|${cloudState.account?.id ?? ''}` }

  get recoveryEligibility (): string {
    return `${this.isManualProbeActive}|${this.klippyReady}|${this.printerState}`
  }

  created () {
    this.unsubscribeStatus = this.$store.subscribe((mutation) => {
      if (mutation.type !== 'printer/setSocketNotify' || mutation.payload?.key !== 'manual_probe' || this.contextFresh) return
      this.contextFresh = true
      this.recover()
    })
  }

  beforeDestroy () { this.unsubscribeStatus?.() }

  @Watch('recoveryContext', { immediate: true })
  onRecoveryContext () {
    const context = this.recoveryContext
    const initialContext = this.selectedContext === ''
    this.selectedContext = context
    this.contextFresh = initialContext
    this.shown = false
    if (initialContext) this.recover()
  }

  @Watch('recoveryEligibility')
  recover () {
    if (!this.shown && this.contextFresh && this.automatic && this.isManualProbeActive && this.klippyReady &&
      !this.printerPrinting && !this.printerPaused) this.shown = true
  }

  @Watch('value')
  onValue (value: boolean) { this.shown = value }

  @Watch('shown')
  onShown (value: boolean) { this.$emit('input', value) }
}
</script>
