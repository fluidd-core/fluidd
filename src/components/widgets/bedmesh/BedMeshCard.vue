<template>
  <collapsable-card
    :title="$t('app.general.title.bedmesh')"
    :lazy="false"
    icon="$bedMesh">
    <bed-mesh></bed-mesh>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import BedMesh from './BedMesh.vue'

@Component({
  components: {
    BedMesh
  }
})
export default class BedMeshCard extends Mixins(StateMixin) {
}
</script>
