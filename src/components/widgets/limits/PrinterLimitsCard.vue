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
import { Component, Vue } from 'vue-property-decorator'
import PrinterLimits from '@/components/widgets/limits/PrinterLimits.vue'

@Component({
  components: {
    PrinterLimits
  }
})
export default class PrinterLimitsCard extends Vue {
}
</script>
