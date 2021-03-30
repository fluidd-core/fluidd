<template>
  <collapsable-card
    :title="$t('app.general.title.fans_outputs')"
    icon="$motion"
    :draggable="true"
    :inLayout="inLayout"
    :enabled="enabled"
    menu-breakpoint="lg"
    @enabled="$emit('enabled', $event)">

    <outputs></outputs>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import Outputs from '@/components/widgets/outputs/Outputs.vue'

@Component({
  components: {
    Outputs
  }
})
export default class OutputsCard extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>
