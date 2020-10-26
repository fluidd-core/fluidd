<template>
  <v-card color="tertiary" class="mb-4">
    <v-card-title class="quaternary font-weight-light"><v-icon left>$cogs</v-icon> Misc</v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-text-field
        filled
        label="Printer Name"
        v-model="instanceName"
      ></v-text-field>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {}
})
export default class GeneralSettingsWidget extends Mixins(UtilsMixin) {
  get instanceName () {
    return this.$store.state.config.fileConfig.general.instanceName
  }

  set instanceName (value: string) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.general.instanceName', value })
  }
}
</script>
