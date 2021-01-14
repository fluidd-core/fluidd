<template>
  <collapsable-card
    title="Fans / Outputs"
    icon="$printer3dNozzle"
    :draggable="true"
    :inLayout="inLayout"
    :enabled="enabled"
    menu-breakpoint="lg"
    @enabled="$emit('enabled', $event)">

    <v-card-text>
      <v-row justify="space-between">
        <v-col cols="6">
          <fans-widget
            getter="getToolHeadFans">
          </fans-widget>
        </v-col>

        <v-col cols="6">
          <fans-widget
            getter="getOtherFans"
            force-divider>
          </fans-widget>
          <output-pins-widget></output-pins-widget>
        </v-col>
      </v-row>
    </v-card-text>

  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import FansWidget from '@/components/widgets/FansWidget.vue'
import OutputPinsWidget from '@/components/widgets/OutputPinsWidget.vue'

@Component({
  components: {
    FansWidget,
    OutputPinsWidget
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
