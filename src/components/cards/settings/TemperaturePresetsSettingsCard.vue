<template>
  <collapsable-card
    title="Temperature Presets"
    subTitle="Temperature presets can be easily applied on the main dashboard.">
    <v-card-text>
      <v-row>
        <v-col>
          <v-text-field
            label="Name">
          </v-text-field>
        </v-col>
        <v-col></v-col>
        <v-col></v-col>
        <v-col></v-col>
      </v-row>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {}
})
export default class TemperaturePresetsSettingsCard extends Mixins(UtilsMixin) {
}
</script>
