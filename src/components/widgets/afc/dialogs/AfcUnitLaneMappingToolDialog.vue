<template>
  <app-dialog
    v-model="open"
    :title="$t('app.afc.LaneMapping')"
    width="400"
    no-actions
  >
    <v-card-text>
      <v-row>
        <v-col class="pb-0">
          <p>{{ $t('app.afc.LaneMappingToCommand', { name: $filters.prettyCase(name) }) }}</p>
        </v-col>
      </v-row>
      <v-row>
        <v-col class="pt-0 text-center">
          <v-btn
            v-for="tool in mapList"
            :key="tool"
            :disabled="tool.toLowerCase() === mappedTool.toLowerCase()"
            color="primary"
            class="ma-2"
            @click="mapTool(tool)"
          >
            {{ tool.toUpperCase() }}
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
export default class AfcUnitLaneMappingToolDialog extends Mixins(StateMixin, AfcMixin) {
  @VModel({ type: Boolean })
  open?: boolean

  @Prop({ type: String, required: true })
  readonly name!: string

  get lane () {
    return this.getAfcLaneObject(this.name)
  }

  get mappedTool (): string {
    return this.lane?.map ?? '--'
  }

  get mapList (): string[] {
    const mapList: string[] = []

    for (const laneName of this.afcLanes) {
      const lane = this.getAfcLaneObject(laneName)

      if (lane?.map != null) {
        mapList.push(lane.map)
      }
    }

    return mapList
      .sort((a, b) => a.localeCompare(b))
  }

  mapTool (newTool: string) {
    this.sendGcode(`SET_MAP LANE=${encodeGcodeParamValue(this.name)} MAP=${encodeGcodeParamValue(newTool)}`)

    this.open = false
  }
}
</script>
