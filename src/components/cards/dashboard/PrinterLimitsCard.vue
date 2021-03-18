<template>
  <collapsable-card
    :title="$t('printer.limits.title')"
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
import StateMixin from '@/mixins/state'

@Component({
  components: {
    PrinterLimitsWidget
  }
})
export default class PrinterLimitsCard extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>
