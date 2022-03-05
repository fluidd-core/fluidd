<template>
  <v-navigation-drawer
    :value="value"
    @input="emitChange"
    app
    right
    clipped
    temporary
    width="300"
    dense
  >
    <v-list
      dense
      v-if="authenticated"
    >
      <v-subheader>{{ instanceName }}</v-subheader>
      <v-divider />
      <system-commands @click="this.close" />
    </v-list>

    <system-printers @click="this.close" />

    <system-layout
      @click="this.close"
      v-if="authenticated"
    />
  </v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'

import StateMixin from '@/mixins/state'

@Component({})
export default class AppToolsDrawer extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: false })
  value!: boolean

  get supportsHistory () {
    return this.$store.getters['server/componentSupport']('history')
  }

  get instanceName () {
    return this.$store.state.config.uiSettings.general.instanceName
  }

  get serverInfo () {
    return this.$store.getters['server/getInfo']
  }

  get hasUpdates () {
    return this.$store.getters['version/hasUpdates']
  }

  close () {
    this.$emit('input', false)
  }

  emitChange (e: boolean) {
    this.$emit('input', e)
  }
}
</script>
