<template>
  <v-navigation-drawer
    :value="value"
    app
    right
    clipped
    temporary
    width="300"
    dense
    @input="emitChange"
  >
    <v-list
      v-if="authenticated"
      dense
    >
      <v-subheader>{{ instanceName }}</v-subheader>
      <v-divider />
      <system-commands @click="close" />
    </v-list>

    <system-printers @click="close" />

    <system-layout
      v-if="authenticated"
      @click="close"
    />
  </v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'

import StateMixin from '@/mixins/state'

@Component({})
export default class AppToolsDrawer extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: false })
  public value!: boolean

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
