<template>
  <collapsable-card
    :title="$t('app.general.title.fans_outputs')"
    icon="$motion"
    draggable
    layout-path="dashboard.outputs-card"
    menu-breakpoint="lg"
  >
    <outputs />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Outputs from '@/components/widgets/outputs/Outputs.vue'

@Component({
  components: {
    Outputs
  }
})
export default class OutputsCard extends Vue {
}
</script>
