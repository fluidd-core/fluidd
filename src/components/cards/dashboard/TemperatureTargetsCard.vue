<template>
  <collapsable-card
    title="Targets"
    icon="$fire">
    <temperature-targets-widget></temperature-targets-widget>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import TemperatureTargetsWidget from '@/components/widgets/TemperatureTargetsWidget.vue'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {
    TemperatureTargetsWidget
  }
})
export default class TemperatureTargetsCard extends Mixins(UtilsMixin) {}
</script>
