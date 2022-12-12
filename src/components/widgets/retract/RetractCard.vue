<template>
  <collapsable-card
    :title="$t('app.general.title.retract')"
    icon="$retract"
    :draggable="true"
    layout-path="dashboard.retract-card"
  >
    <retract />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Retract from '@/components/widgets/retract/Retract.vue'

@Component({
  components: {
    Retract
  }
})
export default class RetractCard extends Vue {
}
</script>
