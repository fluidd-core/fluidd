<template>
  <collapsable-card
    title="Printer Limits"
    icon="$limits"
    :collapsed="true">
    <printer-limits-widget></printer-limits-widget>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import PrinterLimitsWidget from '@/components/widgets/PrinterLimitsWidget.vue'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {
    PrinterLimitsWidget
  }
})
export default class PrinterLimitsCard extends Mixins(UtilsMixin) {

}
</script>
