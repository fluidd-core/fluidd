<template>
  <collapsable-card
    :title="$t('app.general.title.macros')"
    icon="$fileCode"
    :draggable="true"
    :inLayout="inLayout"
    :enabled="enabled"
    @enabled="$emit('enabled', $event)">
    <macros></macros>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import Macros from '@/components/widgets/macros/Macros.vue'
import StateMixin from '@/mixins/state'

@Component({
  components: {
    Macros
  }
})
export default class MacrosCard extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>
