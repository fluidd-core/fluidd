<template>
  <app-dialog
    v-model="open"
    :title="$t('app.afc.InfiniteSpoolHeadline')"
    icon="$afcIcon"
    card-class="afc-unit-lane-infinite-spool-dialog"
    :margin-bottom="false"
    width="400"
    no-actions
  >
    <v-card-text>
      <v-row>
        <v-col class="pb-0">
          <p>{{ $t('app.afc.InfiniteSpoolDescription', { name }) }}</p>
        </v-col>
      </v-row>
      <v-row>
        <v-col class="pt-0 text-center">
          <v-btn
            v-for="lane in laneList"
            :key="lane"
            :disabled="runoutLane === lane"
            color="primary"
            class="ma-2"
            @click="setRunout(lane)"
          >
            {{ lane }}
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </app-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'

@Component({})
export default class AfcUnitLaneInfiniteDialog extends Mixins(StateMixin, AfcMixin) {
  @VModel({ type: Boolean }) open?: boolean
  @Prop({ type: String, required: true }) readonly name!: string

  get lane () {
    return this.getAfcLaneObject(this.name)
  }

  get runoutLane () {
    return this.lane.runout_lane ?? 'NONE'
  }

  get laneList () {
    const allLanes = this.afc.lanes ?? []
    let output = []

    for (const laneName of allLanes) {
      if (laneName === this.name) continue

      const lane = this.getAfcLaneObject(laneName)
      const prep = lane.prep ?? false
      const load = lane.load ?? false

      if (prep && load) output.push(lane.name)
    }

    output = output.sort((a, b) => a.localeCompare(b))
    output.unshift('NONE')

    return output
  }

  setRunout (newLane: string) {
    this.sendGcode(`SET_RUNOUT LANE=${this.name} RUNOUT=${newLane}`)

    this.closeDialog()
  }

  closeDialog () {
    this.$emit('close')
  }
}
</script>
