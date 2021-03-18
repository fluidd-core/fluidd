<template>
  <collapsable-card
    :title="$t('printer.misc.title')"
    cardKey="MiscSettings"
    icon="$cogs">
    <v-card-text>
      <v-text-field
        filled
        hide-details="auto"
        :rules="instanceNameRules"
        :label="$t('printer.misc.name')"
        :value="instanceName"
        @change="setInstanceName"
      ></v-text-field>
    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({
  components: {}
})
export default class GeneralSettingsCard extends Mixins(StateMixin) {
  get instanceName () {
    return this.$store.state.config.uiSettings.general.instanceName
  }

  setInstanceName (value: string) {
    this.$store.dispatch('config/updateInstance', value)
  }

  instanceNameRules = [
    (v: string) => !!v || 'Required'
  ]
}
</script>
