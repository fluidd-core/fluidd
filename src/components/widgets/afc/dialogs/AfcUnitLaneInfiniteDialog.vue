<template>
  <app-dialog
    v-model="open"
    :title="$t('app.afc.InfiniteSpoolHeadline')"
    width="400"
    no-actions
  >
    <v-card-text>
      <v-row>
        <v-col class="pb-0">
          <p>{{ $t('app.afc.InfiniteSpoolDescription', { name: $filters.prettyCase(name) }) }}</p>
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
import { encodeGcodeParamValue } from '@/util/gcode-helpers'

@Component({})
export default class AfcUnitLaneInfiniteDialog extends Mixins(StateMixin, AfcMixin) {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: String, required: true })
  readonly name!: string

  get lane (): Klipper.AfcLaneState | undefined {
    return this.getAfcLaneObject(this.name)
  }

  get runoutLane (): string {
    return this.lane?.runout_lane ?? 'NONE'
  }

  get laneList (): string[] {
    const laneList: string[] = []

    for (const laneName of this.afcLanes) {
      if (laneName === this.name) {
        continue
      }

      const lane = this.getAfcLaneObject(laneName)

      if (
        lane?.prep === true &&
        lane.load === true
      ) {
        laneList.push(lane.name)
      }
    }

    return [
      'NONE',
      ...laneList.sort((a, b) => a.localeCompare(b))
    ]
  }

  setRunout (newLane: string) {
    this.sendGcode(`SET_RUNOUT LANE=${encodeGcodeParamValue(this.name)} RUNOUT=${encodeGcodeParamValue(newLane)}`)

    this.open = false
  }
}
</script>
