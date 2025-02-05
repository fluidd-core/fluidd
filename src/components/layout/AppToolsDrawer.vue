<template>
  <v-navigation-drawer
    v-model="open"
    app
    right
    clipped
    temporary
    width="300"
    dense
  >
    <v-list
      v-if="socketConnected && authenticated"
      dense
    >
      <v-subheader>{{ instanceName }}</v-subheader>
      <v-divider />
      <system-commands @click="open = false" />
    </v-list>

    <system-printers @click="open = false" />

    <system-layout
      v-if="socketConnected && authenticated"
      @click="open = false"
    />
  </v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Mixins, VModel } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class AppToolsDrawer extends Mixins(StateMixin) {
  @VModel({ type: Boolean })
  open?: boolean

  get instanceName (): string {
    return this.$store.state.config.uiSettings.general.instanceName
  }
}
</script>
