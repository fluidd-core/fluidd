<template>
  <div
    class="maintenance-page"
    :class="{ 'maintenance-page--phone': isMobileViewport }"
    data-tid="maintenance-page"
  >
    <maintenance-checks />
    <maintenance-mesh v-if="supportsBedMesh" />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import MaintenanceChecks from '@/components/maintenance/MaintenanceChecks.vue'
import MaintenanceMesh from '@/components/maintenance/MaintenanceMesh.vue'

/**
 * Maintenance (`/boxwood-367a/maintenance`): what keeps prints coming out
 * right. Each check says when it last ran and whether it's due, with the
 * bed as last measured beside them. Pro adds the mesh's numbers and a link
 * to the profiles and 3D view on Bed mesh.
 */
@Component({ components: { MaintenanceChecks, MaintenanceMesh } })
export default class Maintenance extends Mixins(BrowserMixin) {
  get supportsBedMesh (): boolean {
    return this.$store.getters['mesh/getSupportsBedMesh'] as boolean
  }
}
</script>

<style lang="scss" scoped>
  .maintenance-page {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    gap: 16px;
    align-items: start;
  }

  .maintenance-page--phone {
    grid-template-columns: minmax(0, 1fr);
  }
</style>
