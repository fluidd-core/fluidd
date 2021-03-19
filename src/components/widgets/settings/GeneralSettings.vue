<template>
  <div>
    <v-subheader id="general">General</v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4">
      <v-list
        color="transparent"
      >
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>Printer name</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-text-field
              filled
              dense
              single-line
              hide-details="auto"
              ref="instanceName"
              :rules="instanceNameRules"
              :value="instanceName"
              @change="setInstanceName"
            ></v-text-field>
          </v-list-item-action>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>
              Time estimates
              <inline-help bottom small class="ml-2">
                Duration only<br />
                Similar to a klipper LCD, this only shows duration with no estimates.<br /><br />

                Slicer<br />
                Uses the slicer estimates for display. You must enable this in your slicer.<br /><br />

                File<br />
                Takes progress percent, and duration to estimate total duration.<br />
                More accurate over time.<br /><br />

                Filament<br />
                Takes used filament vs estimated filament to estimate total duration.<br />
                More accurate over time.
              </inline-help>
            </v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-select
              filled
              dense
              hide-details="auto"
              :items="estimateTypes"
              item-text="name"
              item-value="value"
              v-model="printTimeEstimateType">
            </v-select>
          </v-list-item-action>
        </v-list-item>
      </v-list>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({
  components: {}
})
export default class GeneralSettingsCard extends Mixins(StateMixin) {
  @Ref('instanceName') readonly instanceNameElement!: any

  instanceNameRules = [
    (v: string) => !!v || 'Required'
  ]

  estimateTypes = [
    { name: 'Duration only', value: 'totals' },
    { name: 'Slicer', value: 'slicer' },
    { name: 'File Estimation', value: 'file' },
    { name: 'Filament Estimation', value: 'filament' }
  ]

  get instanceName () {
    return this.$store.state.config.uiSettings.general.instanceName
  }

  setInstanceName (value: string) {
    if (this.instanceNameElement.valid) this.$store.dispatch('config/updateInstance', value)
  }

  get printTimeEstimateType () {
    return this.$store.state.config.uiSettings.general.printTimeEstimationsType
  }

  set printTimeEstimateType (value: string) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.printTimeEstimationsType',
      value,
      server: true
    })
  }
}
</script>
