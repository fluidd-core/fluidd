<template>
  <div>
    <v-subheader>Time estimates</v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4">
      <v-list
        color="transparent"
      >
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>Time estimates</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>

            <v-radio-group
              class="mt-0 mb-0"
              v-model="printTimeEstimationsType"
              :mandatory="true">
              <v-radio value="totals">
                <template v-slot:label>
                  Duration Only
                  <inline-help bottom small class="ml-2">
                    Similar to a klipper LCD, this only shows duration with no estimates.
                  </inline-help>
                </template>
              </v-radio>
              <v-radio value="slicer">
                <template v-slot:label>
                  Slicer
                  <inline-help bottom small class="ml-2">
                    Uses the slicer estimates for display. You must enable this in your slicer.
                  </inline-help>
                </template>
              </v-radio>
              <v-radio value="file">
                <template v-slot:label>
                  File Estimation
                  <inline-help bottom small class="ml-2">
                    Takes progress percent, and duration to estimate total duration.<br />
                    More accurate over time.
                  </inline-help>
                </template>
              </v-radio>
              <v-radio value="filament">
                <template v-slot:label>
                  Filament
                  <inline-help bottom small class="ml-2">
                    Takes used filament vs estimated filament to estimate total duration.<br />
                    More accurate over time.
                  </inline-help>
                </template>
              </v-radio>
            </v-radio-group>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({
  components: {}
})
export default class PrintTimeEstimateSettingsCard extends Mixins(StateMixin) {
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
