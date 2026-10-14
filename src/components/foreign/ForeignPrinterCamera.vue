<template>
  <main
    v-if="record"
    class="foreign-page"
  >
    <h1>{{ record.name }} · Camera</h1>
    <foreign-camera :url="status.cameraUrl" />
  </main>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { foreignRecordForSlug } from '@/services/printer-pages'
import { connectAll, liveForeign } from '@/services/foreign-printers/live'
import ForeignCamera from './ForeignCamera.vue'
import { emptyStatus } from '@/services/foreign-printers/adapters/base'
import type { ForeignStatus } from '@/services/foreign-printers/types'

@Component({ components: { ForeignCamera } })
export default class ForeignPrinterCamera extends Mixins(StateMixin) {
  get record () { return foreignRecordForSlug(this.$route.params.printer) }
  get status (): ForeignStatus { return this.record ? liveForeign.status[this.record.id] ?? emptyStatus() : emptyStatus() }
  created () { connectAll().catch(() => {}) }
}
</script>

<style scoped>
.foreign-page { max-width: 1200px; margin: auto; }
</style>
