<template>
  <div
    class="grey flex-grow-1 afc-unit-lane d-flex flex-column"
    :class="laneStatusClass"
  >
    <afc-card-unit-lane-header :name="name" />
    <template v-if="laneReady">
      <afc-card-unit-lane-body :name="name" />
      <afc-card-unit-lane-actions :name="name" />
    </template>
    <afc-card-unit-lane-empty
      v-else
      :name="name"
    />
  </div>
</template>
<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import AfcCardUnitLaneEmpty from '@/components/widgets/afc/AfcCardUnitLaneEmpty.vue'
import AfcCardUnitLaneHeader from '@/components/widgets/afc/AfcCardUnitLaneHeader.vue'
import AfcCardUnitLaneBody from '@/components/widgets/afc/AfcCardUnitLaneBody.vue'
import AfcCardUnitLaneActions from '@/components/widgets/afc/AfcCardUnitLaneActions.vue'

@Component({
  components: {
    AfcCardUnitLaneEmpty,
    AfcCardUnitLaneHeader,
    AfcCardUnitLaneBody,
    AfcCardUnitLaneActions
  }
})
export default class AfcCardUnitLane extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true }) readonly name!: string

  get lane () {
    return this.getAfcLaneObject(this.name)
  }

  get laneActive (): boolean {
    return this.name === this.afcCurrentLane?.name
  }

  get laneStatusClass () {
    return {
      'darken-3': this.$vuetify.theme.dark,
      'lighten-2': !this.$vuetify.theme.dark,
      'border-error': this.laneActive && this.afcErrorState,
      'border-success': this.laneActive && !this.afcErrorState,
    }
  }

  get laneReady (): boolean {
    return (
      this.lane?.load &&
      this.lane?.prep
    )
  }
}
</script>

<style scoped>
.afc-unit-lane {
  border-radius: 8px;
  box-sizing: border-box !important;
  border-width: 1px;
  border-style: solid;
  flex-basis: 0;
}

.v-application .border-error {
  border-color: var(--v-error-base) !important;
}

.v-application .border-success {
  border-color: var(--v-primary-base) !important;
}
</style>
