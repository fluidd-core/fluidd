<template>
  <collapsable-card
    :title="$t('printer.timeEstimate.title')"
    cardKey="PrintTimeSettings"
    icon="$clock">
    <v-card-text>
      <v-radio-group
        class="mt-0 mb-0"
        v-model="printTimeEstimationsType"
        :mandatory="true">
        <v-radio v-for="type in printTimeTypes" :key="'print-time-type-'+type" :value="item">
          <template v-slot:label>
            {{ $t('printer.timeEstimate.types.'+type+'.text')}}
            <inline-help bottom small class="ml-2" :tooltip="$t('printer.timeEstimate.types.'+type+'.tooltip')"/>
          </template>
        </v-radio>
      </v-radio-group>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({
  components: {}
})
export default class PrintTimeEstimateSettingsCard extends Mixins(StateMixin) {
  get printTimeTypes () {
    return ['totals', 'slicer', 'file', 'filament']
  }

  get printTimeEstimationsType () {
    return this.$store.state.config.uiSettings.general.printTimeEstimationsType
  }

  set printTimeEstimationsType (value: string) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.printTimeEstimationsType',
      value,
      server: true
    })
  }
}
</script>
