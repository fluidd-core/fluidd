<template>
  <collapsable-card
    :loading="loading"
    :title="$t('Bed Mesh')"
    :lazy="false"
    icon="$bedMesh">
    <bed-mesh-widget @hook:mounted="componentMounted"></bed-mesh-widget>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
const BedMeshWidget = () => import(/* webpackChunkName: "bedmesh", webpackPrefetch: true */ '@/components/widgets/configuration/BedMeshWidget.vue')

@Component({
  components: {
    BedMeshWidget
  }
})
export default class BedMeshCard extends Mixins(UtilsMixin) {
  loading = true

  componentMounted () {
    this.loading = false
  }
}
</script>
