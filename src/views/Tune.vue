<template>
  <div
    :key="commandTarget"
    class="bedmesh-page"
    :class="{ 'bedmesh-page--phone': isMobileViewport }"
    data-tid="bedmesh-page"
  >
    <template v-if="supportsBedMesh">
      <div class="bedmesh-page__main">
        <bed-surface />
        <maintenance-mesh :linked="false" />
      </div>
      <div class="bedmesh-page__side">
        <mesh-profiles />
        <probe-card v-if="hasProbe" />
      </div>
    </template>
    <template v-else>
      <probe-card v-if="hasProbe" />
      <p class="bedmesh-page__none">
        This printer has no bed mesh in its printer.cfg.
      </p>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import TypedCommandsMixin from '@/mixins/typed-commands'
import BrowserMixin from '@/mixins/browser'
import BedSurface from '@/components/maintenance/BedSurface.vue'
import MaintenanceMesh from '@/components/maintenance/MaintenanceMesh.vue'
import MeshProfiles from '@/components/maintenance/MeshProfiles.vue'
import ProbeCard from '@/components/maintenance/ProbeCard.vue'

/**
 * Bed: the surface, measured heights, saved profiles and probe tools.
 * Switch and filament diagnosis lives in Maintenance Health.
 */
@Component({ components: { BedSurface, MaintenanceMesh, MeshProfiles, ProbeCard } })
export default class Tune extends Mixins(TypedCommandsMixin, BrowserMixin) {
  get supportsBedMesh (): boolean {
    return this.$store.getters['mesh/getSupportsBedMesh'] as boolean
  }

  get hasProbe (): boolean {
    return !!this.$store.getters['printer/getProbe']
  }
}
</script>

<style lang="scss" scoped>
  .bedmesh-page {
    display: grid;
    grid-template-columns: minmax(0, 7fr) minmax(0, 5fr);
    gap: 16px;
    align-items: start;
  }

  .bedmesh-page__main,
  .bedmesh-page__side {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
  }

  .bedmesh-page__none {
    margin: 0;
    color: var(--m3d-text-muted);
  }

  @media (max-width: 1263px) {
    .bedmesh-page {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .bedmesh-page--phone {
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
</style>
