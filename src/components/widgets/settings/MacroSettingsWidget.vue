<template>
  <v-card>
    <v-card-title>Dashboard Macros</v-card-title>
    <v-card-subtitle>Configure which macros appear on the dashboard.</v-card-subtitle>
    <v-divider></v-divider>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="6" class="py-0" v-for="(macro) in macros" :key="macro.name">
          <v-switch
            :input-value="macro.visible"
            @change="changeMacro(macro, $event)"
            :label="macro.name"
            color="primary"
            hide-details
          ></v-switch>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { Macro } from '@/store/socket/types'

@Component({
  components: {}
})
export default class MacroSettingsWidget extends Mixins(UtilsMixin) {
  get macros () {
    return this.$store.state.socket.macros
  }

  changeMacro (macro: Macro, value: boolean) {
    const newMacro = { ...macro, visible: value }
    this.$store.dispatch('config/updateHiddenMacros', newMacro)
    this.$store.dispatch('socket/updateMacro', newMacro)
  }
}
</script>
