<template>
  <collapsable-card
    :title="$t('app.sensors.title.sensors')"
    icon="$sensors"
    draggable
    layout-path="dashboard.sensors-card"
  >
    <sensors />
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Sensors from './Sensors.vue'

@Component({
  components: {
    Sensors
  }
})
export default class SensorsCard extends Vue {
}
</script>
