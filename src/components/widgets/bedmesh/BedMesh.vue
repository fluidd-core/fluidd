<template>
  <collapsable-card
    :title="$t('app.general.title.bedmesh')"
    :lazy="false"
    icon="$bedMesh">

    <v-card-text>

      <e-charts-bed-mesh
        v-if="mesh && mesh.coordinates && mesh.coordinates.length > 0"
        :options="options"
        :data="mesh.coordinates"
        :height="(isMobile) ? '225px' : '525px'">
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

@Component({
  components: {
    EChartsBedMesh
  }
})
export default class BedMesh extends Mixins(StateMixin, ToolheadMixin) {
  get options () {
    let zMin = -0.1
    let zMax = 0.1
    if (this.scale) {
      zMin = this.mesh.min
      zMax = this.mesh.max
      // If the zmin and zmax don't exceed -1 and 1 respectively - then
      // set the min and maxes to -1 and 1 - effectively ensuring we don't
      // have a min max smaller than -1 and larger than 1.
      if (zMin < -0.1) zMin = -0.1
      if (zMax > 0.1) zMax = 0.1
    }

    const opts = {
      visualMap: {
        min: zMin,
        max: zMax
      },
      series: [{
        wireframe: {
          show: this.wireframe
        }
      }]
    }
    return opts
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

  // The current processed mesh data, if any.
  get mesh () {
    return this.$store.getters['mesh/getCurrentMeshData'][this.matrix]
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }
}
</script>
