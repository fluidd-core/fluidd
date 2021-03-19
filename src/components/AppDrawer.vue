<template>
  <v-navigation-drawer
    :value="value"
    @input="emitChange"
    app right clipped temporary
    dense>

    <v-list dense>
      <v-subheader>{{ instanceName }}</v-subheader>

      <system-localization-widget></system-localization-widget>

      <v-list-item to="/" class="d-flex d-md-none">
        <v-list-item-icon>
          <v-icon>$home</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{$t("app.bar.dashboard")}}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item to="/jobs" class="d-flex d-md-none" v-if="klippyReady">
        <v-list-item-icon>
          <v-icon>$files</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{$t("app.bar.jobs")}}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item to="/configuration" class="d-flex d-md-none">
        <v-list-item-icon>
          <v-icon>$tune</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{$t("app.drawer.pconfig")}}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item to="/settings">
        <v-list-item-icon>
          <v-icon>$cog</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>{{$t("app.drawer.uiSettings")}}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-divider></v-divider>

      <system-commands-widget @click="this.close"></system-commands-widget>
      <system-versions-widget @click="this.close" v-if="versionsSupported"></system-versions-widget>
    </v-list>
    <v-divider></v-divider>

    <system-printers-widget @click="this.close"></system-printers-widget>
    <v-divider></v-divider>

    <system-layout-widget @click="this.close"></system-layout-widget>

  </v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import SystemCommandsWidget from '@/components/widgets/SystemCommandsWidget.vue'
import SystemVersionsWidget from '@/components/widgets/SystemVersionsWidget.vue'
import SystemPrintersWidget from '@/components/widgets/SystemPrintersWidget.vue'
import SystemLayoutWidget from '@/components/widgets/SystemLayoutWidget.vue'
import SystemLocalizationWidget from '@/components/widgets/SystemLocalizationWidget.vue'

import StateMixin from '@/mixins/state'

@Component({
  components: {
    SystemCommandsWidget,
    SystemVersionsWidget,
    SystemPrintersWidget,
    SystemLayoutWidget,
    SystemLocalizationWidget
  }
})
export default class AppDrawer extends Mixins(StateMixin) {
  @Prop({ type: Boolean, default: false })
  value!: boolean

  get instanceName () {
    return this.$store.state.config.uiSettings.general.instanceName
  }

  get serverInfo () {
    return this.$store.getters['server/getInfo']
  }

  get versionsSupported () {
    return (
      this.serverInfo &&
      this.serverInfo.plugins
    )
      ? this.serverInfo.plugins.includes('update_manager')
      : false
  }

  close () {
    this.$emit('input', false)
  }

  emitChange (e: boolean) {
    this.$emit('input', e)
  }
}
</script>
