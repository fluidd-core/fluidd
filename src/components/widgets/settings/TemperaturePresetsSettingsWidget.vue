<template>
  <v-card>
    <v-card-title class="font-weight-light">Temperature Presets</v-card-title>
    <v-card-subtitle>Temperature presets can be easily applied on the main dashboard.</v-card-subtitle>
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
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {}
})
export default class TemperaturePresetsSettingsWidget extends Mixins(UtilsMixin) {
}
</script>
