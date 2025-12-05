<template>
  <collapsable-card
    v-if="afcEnabled"
    :title="$t('app.afc.Headline')"
    icon="$afcIcon"
    draggable
    layout-path="dashboard.afc-card"
  >
    <template #menu>
      <afc-card-buttons />
      <afc-card-settings />
    </template>
    <v-card-text class="pt-1">
      <afc-card-message />
      <afc-card-bypass />
      <afc-card-extruder
        v-for="extruder in filteredExtruders"
        :key="extruder"
        :name="extruder"
        class="mt-3"
      />
      <afc-card-unit
        v-for="unit in filteredUnits"
        :key="unit"
        :name="unit"
        class="mt-3"
      />
    </v-card-text>
  </collapsable-card>
</template>
<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'
import AfcCardMessage from '@/components/widgets/afc/AfcCardMessage.vue'
import AfcCardBypass from '@/components/widgets/afc/AfcCardBypass.vue'
import AfcCardExtruder from '@/components/widgets/afc/AfcCardExtruder.vue'
import AfcCardUnit from '@/components/widgets/afc/AfcCardUnit.vue'
import AfcCardButtons from '@/components/widgets/afc/AfcCardButtons.vue'
import AfcCardSettings from '@/components/widgets/afc/AfcCardSettings.vue'

@Component({
  components: {
    AfcCardMessage,
    AfcCardBypass,
    AfcCardExtruder,
    AfcCardUnit,
    AfcCardButtons,
    AfcCardSettings
  }
})
export default class AfcCard extends Mixins(StateMixin, AfcMixin) {
  @Prop({ type: Boolean })
  readonly fullscreen?: boolean

  get filteredExtruders (): string[] {
    return this.afcExtruders
      .filter(extruder => !this.afcHiddenExtruders.includes(extruder))
  }

  get filteredUnits (): string[] {
    return this.afcUnits
      .filter(unit => !this.afcHiddenUnits.includes(unit))
  }

  get afcEnabled (): boolean {
    return this.$typedGetters['printer/getSupportsAfc']
  }
}
</script>
