<template>
  <collapsable-card
    :title="$t('app.general.title.bedmesh')"
    :lazy="false"
    icon="$bedMesh"
    :draggable="!fullScreen"
    :collapsable="!fullScreen"
    layout-path="dashboard.bed-mesh-card"
  >
    <template
      v-if="!fullScreen"
      #menu
    >
      <app-btn
        color=""
        fab
        x-small
        text
        @click="$filters.routeTo($router, '/tune')"
      >
        <v-icon>$fullScreen</v-icon>
      </app-btn>
    </template>

    <v-card-text>
      <e-charts-bed-mesh
        v-if="mesh && mesh[matrix] && mesh[matrix].coordinates && mesh[matrix].coordinates.length > 0"
        ref="chart"
        :options="options"
        :data="series"
        :graphics="graphics"
        :height="(isMobile) ? '225px' : '525px'"
      />

      <span v-else>{{ $t('app.bedmesh.msg.not_loaded') }}</span>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import EChartsBedMesh from './BedMeshChart.vue'
import StateMixin from '@/mixins/state'
import ToolheadMixin from '@/mixins/toolhead'

@Component({
  components: {
    EChartsBedMesh
  }
})
export default class BedMeshCard extends Mixins(StateMixin, ToolheadMixin) {
  @Prop({ type: Boolean, default: false })
  readonly fullScreen!: boolean

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

  get graphics () {
    const variance = this.mesh[this.matrix].variance

    return [{
      type: 'text',
      right: 10,
      top: 0,
      z: 100,
      silent: true,
      style: {
        text: `Variance: ${variance.toFixed(4)}`
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
      data: this.mesh[matrix].coordinates
    }
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
  get mesh () {
    return this.$store.getters['mesh/getCurrentMeshData']
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }
}
</script>
