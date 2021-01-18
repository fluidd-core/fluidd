<template>
  <collapsable-card
    title="Printer Limits"
    icon="$limits"
    :draggable="true"
    :inLayout="inLayout"
    :enabled="enabled"
    @enabled="$emit('enabled', $event)">
    <printer-limits-widget></printer-limits-widget>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import PrinterLimitsWidget from '@/components/widgets/PrinterLimitsWidget.vue'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {
    PrinterLimitsWidget
  }
})
export default class PrinterLimitsCard extends Mixins(UtilsMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>
