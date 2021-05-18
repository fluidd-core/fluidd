<template>
  <v-navigation-drawer
    :value="value"
    @input="emitChange"
    app right clipped temporary
    dense>

    <v-list dense>
      <v-subheader>{{ instanceName }}</v-subheader>
      <v-divider></v-divider>

      <v-list-item to="/" class="d-sm-flex d-md-none">
        <v-list-item-icon>
          <v-icon>$home</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.general.title.home') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item to="/jobs" class="d-sm-flex d-md-none">
        <v-list-item-icon>
          <v-icon>$files</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.general.title.jobs') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item to="/history" class="d-sm-flex d-md-none" v-if="supportsHistory">
        <v-list-item-icon>
          <v-icon>$history</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.general.title.history') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item to="/tune" class="d-sm-flex d-md-none">
        <v-list-item-icon>
          <v-icon>$tune</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.general.title.tune') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item to="/configure" class="d-sm-flex d-md-none">
        <v-list-item-icon>
          <v-icon>$cogs</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{ $t('app.general.title.configure') }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-list-item to="/settings" class="d-sm-flex d-md-none">
        <v-list-item-icon>
          <v-icon>$cog</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>
            {{ $t('app.general.title.settings') }}
          </v-list-item-title>
        </v-list-item-content>
      </v-list-item>

      <v-divider class="d-sm-flex d-md-none"></v-divider>

      <system-commands @click="this.close"></system-commands>
    </v-list>

    <system-printers @click="this.close"></system-printers>

    <system-layout @click="this.close"></system-layout>

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
