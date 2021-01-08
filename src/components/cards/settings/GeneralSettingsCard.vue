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
      <v-switch
        label="Enable Jobs on Dashboard"
        hide-details
        v-model="jobsInDash">
      </v-switch>
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
    return this.$store.state.config.fileConfig.general.instanceName
  }

  set instanceName (value: string) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.general.instanceName', value })
  }

  get jobsInDash () {
    return this.$store.state.config.fileConfig.general.jobsInDash
  }

  set jobsInDash (value: boolean) {
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.general.jobsInDash', value })
  }

  instanceNameRules = [
    (v: string) => !!v || 'Required'
  ]
}
</script>
