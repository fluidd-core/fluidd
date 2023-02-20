<template>
  <collapsable-card
    :title="$t('app.general.title.macros')"
    icon="$fileCode"
    draggable
    layout-path="dashboard.macros-card"
  >
    <macros />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Macros from '@/components/widgets/macros/Macros.vue'

@Component({
  components: {
    Macros
  }
})
export default class MacrosCard extends Vue {
}
</script>
