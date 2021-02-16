<template>
  <collapsable-card
    title="Misc"
    cardKey="MiscSettings"
    icon="$cogs">
    <v-card-text>
      <v-text-field
        filled
        hide-details="auto"
        :rules="instanceNameRules"
        label="Printer Name"
        v-model="instanceName"
      ></v-text-field>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {}
})
export default class GeneralSettingsCard extends Mixins(UtilsMixin) {
  get instanceName () {
    return this.$store.state.config.uiSettings.general.instanceName
  }

  set instanceName (value: string) {
    this.$store.dispatch('config/saveGeneric', { key: 'uiSettings.general.instanceName', value })
  }

  instanceNameRules = [
    (v: string) => !!v || 'Required'
  ]
}
</script>
