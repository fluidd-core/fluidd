<template>
  <control-card
    title="Surface"
    data-tid="bed-surface"
  >
    <template #aside>
      <span v-if="loaded">{{ profileName }} · {{ range.toFixed(3) }} mm high to low</span>
    </template>

    <bed-mesh-chart
      v-if="loaded"
      class="bsurf__chart"
      :options="options"
      :data="series"
      :height="isMobileViewport ? '300px' : '480px'"
    />
    <div
      v-else
      class="bsurf__none"
    >
      <frame-icon name="mesh" />
      <p>No mesh loaded. Measure the bed, or load a saved profile.</p>
    </div>

    <div
      v-if="loaded"
      class="bsurf__chips"
      role="group"
      aria-label="Show"
    >
      <seg-picker
        :options="matrixOptions"
        :value="matrix"
        label="Heights"
        @input="setMatrix"
      />
      <button
        type="button"
        class="bsurf__chip"
        :class="{ 'bsurf__chip--on': flatSurface }"
        :aria-pressed="flatSurface ? 'true' : 'false'"
        @click="$store.dispatch('mesh/onFlatSurface', !flatSurface)"
      >
        Flat plane
      </button>
      <button
        type="button"
        class="bsurf__chip"
        :class="{ 'bsurf__chip--on': wireframe }"
        :aria-pressed="wireframe ? 'true' : 'false'"
        @click="$store.dispatch('mesh/onWireframe', !wireframe)"
      >
        Wireframe
      </button>
      <button
        type="button"
        class="bsurf__chip"
        :class="{ 'bsurf__chip--on': scale === 0 }"
        :aria-pressed="scale === 0 ? 'true' : 'false'"
        title="Heights and colours stretched over this mesh's own range, so small differences show"
        @click="$store.dispatch('mesh/onScale', scale === 0 ? 0.2 : 0)"
      >
        Exaggerate
      </button>
    </div>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import BrowserMixin from '@/mixins/browser'
import type { AppMeshes, MatrixType } from '@/store/mesh/types'
import ControlCard from '@/components/control/ControlCard.vue'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import BedMeshChart from '@/components/widgets/bedmesh/BedMeshChart.vue'

/**
 * The bed as a 3D surface: the probed points or the smoothed mesh
 * Klipper moves by, with a flat plane to judge it against. The chart is
 * Fluidd's; its scaling follows the same settings as its own panel.
 */
@Component({ components: { ControlCard, SegPicker, BedMeshChart } })
export default class BedSurface extends Mixins(StateMixin, BrowserMixin) {
  get mesh (): AppMeshes {
    return this.$store.getters['mesh/getCurrentMeshData'] as AppMeshes
  }

  get matrix (): MatrixType {
    return this.$store.state.mesh.matrix
  }

  setMatrix (value: MatrixType) {
    this.$store.dispatch('mesh/onMatrix', value)
  }

  get matrixOptions (): SegOption[] {
    return [{ value: 'probed_matrix', label: 'Probed' }, { value: 'mesh_matrix', label: 'Smoothed' }]
  }

  get scale (): number {
    return this.$store.state.mesh.scale
  }

  get boxScale (): number {
    return this.$store.state.mesh.boxScale
  }

  get wireframe (): boolean {
    return this.$store.state.mesh.wireframe
  }

  get flatSurface (): boolean {
    return this.$store.state.mesh.flatSurface
  }

  get loaded (): boolean {
    return !!this.mesh?.[this.matrix]?.coordinates?.length
  }

  get profileName (): string {
    return this.$store.state.printer.printer.bed_mesh?.profile_name ?? ''
  }

  get range (): number {
    return this.mesh?.[this.matrix]?.range ?? 0
  }

  // The chart's settings, as Fluidd's own bed mesh panel builds them.
  get options () {
    const current = this.mesh[this.matrix]
    const mapScale = this.scale / 2
    const zMin = this.scale === 0 ? current.min : -Math.abs(mapScale - current.min)
    const zMax = this.scale === 0 ? current.max : mapScale + current.max
    const half = this.boxScale / 2
    const pad = Math.max(0.01, (current.max - current.min) * 0.1)
    const selected = Object.fromEntries(this.series.map(s => [s.name, !s.name.endsWith('_flat') || (this.flatSurface && s.name.startsWith(this.matrix))]))
    return {
      legend: { show: false, selected },
      visualMap: { min: zMin, max: zMax, dimension: 2, seriesIndex: 0 },
      // Exaggerated, the height axis spans this mesh alone, so a bed within a tenth of a millimetre still shows its shape.
      zAxis3D: this.scale === 0
        ? { min: Math.floor((current.min - pad) * 1000) / 1000, max: Math.ceil((current.max + pad) * 1000) / 1000 }
        : { min: -Math.abs(current.mid - half), max: current.mid + half }
    }
  }

  get series () {
    return [
      {
        type: 'surface',
        name: this.matrix,
        shading: 'color',
        wireframe: { show: this.wireframe },
        data: this.mesh[this.matrix].coordinates,
        dataShape: this.mesh[this.matrix].dimensions
      },
      this.flat('probed_matrix_flat'),
      this.flat('mesh_matrix_flat')
    ]
  }

  flat (name: string) {
    return {
      type: 'surface',
      name,
      itemStyle: { color: [0.5, 0.5, 0.5, 0.25] },
      wireframe: { show: this.wireframe, lineStyle: { opacity: 0.25, width: 1, color: '#ffffff' } },
      data: this.mesh[name].coordinates,
      dataShape: this.mesh[name].dimensions
    }
  }
}
</script>

<style lang="scss" scoped>
  .bsurf__chart {
    min-width: 0;
  }

  .bsurf__none {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 260px;
    border-radius: 16px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
    font-size: 14px;
    text-align: center;

    p {
      margin: 0;
    }
  }

  .bsurf__chips {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .bsurf__chip {
    height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    box-shadow: inset 0 0 0 1px var(--m3d-border-strong);
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .bsurf__chip--on {
    background: rgba(128, 214, 209, 0.14);
    box-shadow: inset 0 0 0 1px rgba(128, 214, 209, 0.5);
    color: var(--m3d-accent);
  }
</style>
