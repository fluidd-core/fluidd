<template>
  <collapsable-card
    :title="$t('Fans Outputs')"
    icon="$motion"
    :draggable="true"
    :inLayout="inLayout"
    :enabled="enabled"
    menu-breakpoint="lg"
    @enabled="$emit('enabled', $event)">

    <outputs-widget></outputs-widget>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import OutputsWidget from '@/components/widgets/OutputsWidget.vue'

@Component({
  components: {
    OutputsWidget
  }
})
export default class OutputsCard extends Mixins(UtilsMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>
