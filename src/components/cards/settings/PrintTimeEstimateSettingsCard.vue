<template>
  <collapsable-card
    :title="$t('Print Times')"
    cardKey="PrintTimeSettings"
    icon="$clock">
    <v-card-text>
      <v-radio-group
        class="mt-0 mb-0"
        v-model="printTimeEstimationsType"
        :mandatory="true">
        <v-radio value="totals">
          <template v-slot:label>
            {{$t('Duration Only')}}
            <inline-help bottom small class="ml-2">
              {{$t('Similar to a klipper LCD, this only shows duration with no estimates.')}}
            </inline-help>
          </template>
        </v-radio>
        <v-radio value="slicer">
          <template v-slot:label>
            {{$t('Slicer')}}
            <inline-help bottom small class="ml-2">
              {{$t('Uses the slicer estimates for display. You must enable this in your slicer.')}}
            </inline-help>
          </template>
        </v-radio>
        <v-radio value="file">
          <template v-slot:label>
            {{$t('File Estimation')}}
            <inline-help bottom small class="ml-2">
              {{$t('Takes progress percent, and duration to estimate total duration.')}}<br />
              {{$t('More accurate over time.')}}
            </inline-help>
          </template>
        </v-radio>
        <v-radio value="filament">
          <template v-slot:label>
            {{$t('Filament')}}
            <inline-help bottom small class="ml-2">
              {{$t('Takes used filament vs estimated filament to estimate total duration.')}}<br />
              {{$t('More accurate over time.')}}
            </inline-help>
          </template>
        </v-radio>
      </v-radio-group>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {}
})
export default class PrintTimeEstimateSettingsCard extends Mixins(UtilsMixin) {
  get cameraUrl () {
    return this.$store.state.config.fileConfig.camera.url
  }

  set cameraUrl (value: string) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.camera.url', value })
  }

  get printTimeEstimationsType () {
    return this.$store.state.config.fileConfig.general.printTimeEstimationsType
  }

  set printTimeEstimationsType (value: string) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.general.printTimeEstimationsType', value })
  }
}
</script>
