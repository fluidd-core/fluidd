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
          <p>{{ $t('app.afc.LaneMappingToCommand', { name }) }}</p>
        </v-col>
      </v-row>
      <v-row>
        <v-col class="pt-0 text-center">
          <v-btn
            v-for="tool in afcMapList"
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

@Component({})
export default class AfcUnitLaneMappingToolDialog extends Mixins(StateMixin, AfcMixin) {
  @VModel({ type: Boolean }) open?: boolean
  @Prop({ type: String, required: true }) readonly name!: string

  get lane () {
    return this.getAfcLaneObject(this.name)
  }

  get mappedTool () {
    return this.lane.map ?? '--'
  }

  mapTool (newTool: string) {
    this.sendGcode(`SET_MAP LANE=${this.name} MAP=${newTool}`)

    this.closeDialog()
  }

  closeDialog () {
    this.$emit('close')
  }
}
</script>
