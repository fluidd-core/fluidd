<template>
  <collapsable-card
    title="Macros"
    icon="$fileCode"
    :draggable="true"
    :inLayout="inLayout"
    :enabled="enabled"
    @enabled="$emit('enabled', $event)">
    <macros-widget></macros-widget>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import MacrosWidget from '@/components/widgets/MacrosWidget.vue'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {
    MacrosWidget
  }
})
export default class CameraCard extends Mixins(UtilsMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>
