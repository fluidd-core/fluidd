<template>
  <v-row class="flex-grow-0">
    <v-col class="px-6 pt-6 pb-3 py-4">
      <v-btn
        dense
        small
        class="flex elevation-0"
        @click="showDialog = true"
      >
        {{ name }} > {{ mappedTool }}
      </v-btn>
      <afc-unit-lane-mapping-tool-dialog
        v-model="showDialog"
        :name="name"
        @cancel="showDialog = false"
        @close="showDialog = false"
      />
    </v-col>
  </v-row>
</template>
<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import AfcUnitLaneMappingToolDialog from '@/components/widgets/afc/dialogs/AfcUnitLaneMappingToolDialog.vue'

@Component({
  components: {
    AfcUnitLaneMappingToolDialog
  }
})
export default class AfcCardUnitLaneHeader extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: String, required: true })
  readonly name!: string

  showDialog = false

  get lane () {
    return this.getAfcLaneObject(this.name)
  }

  get mappedTool (): string {
    return this.lane?.map ?? '--'
  }
}
</script>
