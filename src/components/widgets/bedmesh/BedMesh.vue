<template>
  <collapsable-card
    :title="$t('app.general.title.bedmesh')"
    :lazy="false"
    icon="$bedMesh">

    <v-card-text>

      <e-charts-bed-mesh
        v-if="mesh && mesh[matrix] && mesh[matrix].coordinates && mesh[matrix].coordinates.length > 0"
        :options="options"
        :data="series"
        :height="(isMobile) ? '225px' : '525px'"
        ref="chart">
      </e-charts-bed-mesh>

      <span v-else>{{ $t('app.bedmesh.msg.not_loaded') }}</span>

    </v-card-text>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import EChartsBedMesh from './BedMeshChart.vue'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'

const DEFAULT_SCALE = 0.05

@Component({
  components: {
    EChartsBedMesh
  }
})
export default class BedMesh extends Mixins(StateMixin, ToolheadMixin) {
  get options () {
    let zMin = -Math.abs(DEFAULT_SCALE)
    let zMax = DEFAULT_SCALE
    if (this.scale) {
      zMin = this.mesh[this.matrix].min
      zMax = this.mesh[this.matrix].max
      // If the zmin and zmax don't exceed -1 and 1 respectively - then
      // set the min and maxes to -1 and 1 - effectively ensuring we don't
      // have a min max smaller than -1 and larger than 1.
      if (zMin < -0.1) zMin = -Math.abs(DEFAULT_SCALE)
      if (zMax > 0.1) zMax = DEFAULT_SCALE
    }

    const legends = this.series.reduce((obj, series: any) => {
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
      }
    }
    return opts
  }

  get series () {
    const matrix = this.matrix
    const wireframe = this.wireframe
    const series: any[] = [
      {
        type: 'surface',
        name: matrix,
        shading: 'color',
        wireframe: {
          show: wireframe
        },
        data: this.mesh[matrix].coordinates
      },
      this.createFlatSeries('probed_matrix_flat'),
      this.createFlatSeries('mesh_matrix_flat')
    ]
    return series
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
      data: this.mesh[matrix].coordinates
    }
  }

  get matrix () {
    return this.$store.state.mesh.matrix
  }

  get scale () {
    return this.$store.state.mesh.scale
  }

  get wireframe () {
    return this.$store.state.mesh.wireframe
  }

  get flatSurface () {
    return this.$store.state.mesh.flatSurface
  }

  // The current processed mesh data, if any.
  get mesh () {
    return this.$store.getters['mesh/getCurrentMeshData']
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }
}
</script>
