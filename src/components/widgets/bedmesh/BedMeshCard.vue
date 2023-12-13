<template>
  <collapsable-card
    :title="$t('app.general.title.bedmesh')"
    :lazy="false"
    icon="$bedMesh"
    :draggable="!fullscreen"
    :collapsable="!fullscreen"
    layout-path="dashboard.bed-mesh-card"
  >
    <template #menu>
      <app-btn
        v-if="!fullscreen"
        small
        class="ms-1 my-1"
        :loading="hasWait($waits.onMeshCalibrate)"
        :disabled="printerBusy || !allHomed"
        @click="calibrate()"
      >
        {{ $t('app.general.btn.calibrate') }}
      </app-btn>

      <v-tooltip
        v-if="canCopyImage"
        bottom
      >
        <template #activator="{ on, attrs }">
          <app-btn
            v-bind="attrs"
            color=""
            fab
            x-small
            text
            class="ms-1 my-1"
            :disabled="!hasMeshLoaded"
            v-on="on"
            @click="copyImage()"
          >
            <v-icon>$screenshot</v-icon>
          </app-btn>
        </template>
        <span>{{ $t('app.bedmesh.tooltip.copy_image') }}</span>
      </v-tooltip>

      <app-btn
        v-if="!fullscreen"
        color=""
        fab
        x-small
        text
        class="ms-1 my-1"
        @click="$filters.routeTo($router, '/tune')"
      >
        <v-icon>$fullScreen</v-icon>
      </app-btn>
    </template>

    <v-card-text>
      <bed-mesh-chart
        v-if="hasMeshLoaded"
        ref="chart"
        :options="options"
        :data="series"
        :graphics="graphics"
        :height="(isMobileViewport) ? '225px' : '525px'"
      />

      <span v-else>{{ $t('app.bedmesh.msg.not_loaded') }}</span>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop, Ref } from 'vue-property-decorator'
import BedMeshChart from './BedMeshChart.vue'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'
import BrowserMixin from '@/mixins/browser'
import type { AppMeshes } from '@/store/mesh/types'

@Component({
  components: {
    BedMeshChart
  }
})
export default class BedMeshCard extends Mixins(StateMixin, ToolheadMixin, BrowserMixin) {
  @Prop({ type: Boolean })
  readonly fullscreen?: boolean

  @Ref('chart')
  readonly bedMeshChart!: BedMeshChart

  get hasMeshLoaded () {
    const mesh = this.mesh
    const matrix = this.matrix

    return mesh && mesh[matrix] && mesh[matrix].coordinates && mesh[matrix].coordinates.length > 0
  }

  get options () {
    const map_scale = this.scale / 2
    const box_scale = this.boxScale / 2

    // These define the visualMap scaling.
    let zMin = -Math.abs(map_scale - this.mesh[this.matrix].min)
    let zMax = map_scale + this.mesh[this.matrix].max
    if (this.scale === 0) {
      // Applies the scale based on the min and max of the mesh.
      zMin = this.mesh[this.matrix].min
      zMax = this.mesh[this.matrix].max
    }

    // These define the 3d box scaling.
    const zBoxMin = -Math.abs(this.mesh[this.matrix].mid - box_scale)
    const zBoxMax = this.mesh[this.matrix].mid + box_scale

    const legends = this.series.reduce((obj, series) => {
      return Object.assign(
        obj,
        {
          [series.name]: (
            !series.name.endsWith('_flat') ||
            (
              this.flatSurface &&
              series.name.startsWith(this.matrix)
            )
          )
        }
      )
    }, Object.assign({}))

    const opts = {
      legend: {
        show: false,
        selected: legends
      },
      visualMap: {
        min: zMin,
        max: zMax,
        dimension: 2,
        seriesIndex: 0
      },
      zAxis3D: {
        min: zBoxMin,
        max: zBoxMax
      }
    }
    return opts
  }

  get series () {
    const matrix = this.matrix
    const wireframe = this.wireframe
    const series = [
      {
        type: 'surface',
        name: matrix,
        shading: 'color',
        wireframe: {
          show: wireframe
        },
        data: this.mesh[matrix].coordinates,
        dataShape: this.mesh[matrix].dimensions
      },
      this.createFlatSeries('probed_matrix_flat'),
      this.createFlatSeries('mesh_matrix_flat')
    ]
    return series
  }

  get graphics () {
    const { range } = this.mesh[this.matrix]

    return [{
      type: 'text',
      right: 10,
      top: 0,
      z: 100,
      silent: true,
      style: {
        text: `Range: ${range.toFixed(4)}`
      }
    }]
  }

  createFlatSeries (matrix: string) {
    const wireframe = this.wireframe
    return {
      type: 'surface',
      name: matrix,
      itemStyle: {
        color: [0.5, 0.5, 0.5, 0.25]
      },
      wireframe: {
        show: wireframe,
        lineStyle: {
          opacity: 0.25,
          width: 1,
          color: '#ffffff'
        }
      },
      data: this.mesh[matrix].coordinates,
      dataShape: this.mesh[matrix].dimensions
    }
  }

  calibrate () {
    this.sendGcode('BED_MESH_CALIBRATE', this.$waits.onMeshCalibrate)
  }

  get matrix () {
    return this.$store.state.mesh.matrix
  }

  get scale () {
    return this.$store.state.mesh.scale
  }

  get boxScale () {
    return this.$store.state.mesh.boxScale
  }

  get wireframe () {
    return this.$store.state.mesh.wireframe
  }

  get flatSurface () {
    return this.$store.state.mesh.flatSurface
  }

  // The current processed mesh data, if any.
  get mesh (): AppMeshes {
    return this.$store.getters['mesh/getCurrentMeshData'] as AppMeshes
  }

  get canCopyImage () {
    return (
      typeof navigator.clipboard === 'object' &&
      typeof navigator.clipboard.write === 'function' &&
      typeof ClipboardItem === 'function'
    )
  }

  copyImage () {
    this.bedMeshChart.copyImage()
  }
}
</script>
