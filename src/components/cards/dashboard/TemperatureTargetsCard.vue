<template>
  <collapsable-card
    title="Targets"
    icon="$fire"
    :draggable="true"
    :inLayout="inLayout"
    :enabled="enabled"
    @enabled="$emit('enabled', $event)">
    <temperature-targets-widget></temperature-targets-widget>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import TemperatureTargetsWidget from '@/components/widgets/TemperatureTargetsWidget.vue'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {
    TemperatureTargetsWidget
  }
})
export default class TemperatureTargetsCard extends Mixins(UtilsMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>
