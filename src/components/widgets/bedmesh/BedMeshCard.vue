<template>
  <collapsable-card
    :title="$t('app.general.title.bedmesh')"
    :lazy="false"
    icon="$bedMesh">
    <bed-mesh></bed-mesh>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import BedMesh from './BedMesh.vue'

@Component({
  components: {
    BedMesh
  }
})
export default class BedMeshCard extends Vue {
}
</script>
