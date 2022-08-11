<template>
  <collapsable-card
    :title="$t('app.general.title.limits')"
    icon="$limits"
    :draggable="true"
    layout-path="dashboard.printer-limits-card"
  >
    <printer-limits />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import PrinterLimits from '@/components/widgets/limits/PrinterLimits.vue'
import StateMixin from '@/mixins/state'

@Component({
  components: {
    PrinterLimits
  }
})
export default class PrinterLimitsCard extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: true })
  readonly enabled!: boolean

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>
