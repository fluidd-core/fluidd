<template>
  <collapsable-card
    :title="$t('printer.macros.title')"
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
import StateMixin from '@/mixins/state'

@Component({
  components: {
    MacrosWidget
  }
})
export default class CameraCard extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>
