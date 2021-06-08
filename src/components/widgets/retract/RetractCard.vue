<template>
  <collapsable-card
    :title="$t('app.general.title.retract')"
    icon="$retract"
    :draggable="true"
    layout-path="dashboard.retract-card">
    <retract></retract>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import Retract from '@/components/widgets/retract/Retract.vue'
import StateMixin from '@/mixins/state'

@Component({
  components: {
    Retract
  }
})
export default class RetractCard extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: true })
  enabled!: boolean

  get inLayout (): boolean {
    return (this.$store.state.config.layoutMode)
  }
}
</script>
