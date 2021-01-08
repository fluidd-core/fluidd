<template>
  <v-navigation-drawer
    :value="value"
    @input="emitChange"
    app right clipped temporary
    dense>

    <v-list dense>
      <v-subheader>{{ instanceName }}</v-subheader>

      <v-list-item to="/" class="d-flex d-md-none">
        <v-list-item-icon>
          <v-icon>$home</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Dashboard</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item to="/jobs" class="d-flex d-md-none" v-if="klippyConnected">
        <v-list-item-icon>
          <v-icon>$files</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Jobs</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item to="/configuration" class="d-flex d-md-none">
        <v-list-item-icon>
          <v-icon>$tune</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Printer Configuration</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item to="/settings">
        <v-list-item-icon>
          <v-icon>$cog</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>UI Settings</v-list-item-title>
        </v-list-item-content>
      </v-list-item>

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

import UtilsMixin from '@/mixins/utils'

@Component({
  components: {
    SystemCommandsWidget,
    SystemVersionsWidget,
    SystemPrintersWidget,
    SystemLayoutWidget
  }
})
export default class AppDrawer extends Mixins(UtilsMixin) {
  @Prop({ type: Boolean, default: false })
  value!: boolean

  get instanceName () {
    return this.$store.state.config.fileConfig.general.instanceName
  }

  get versionsSupported () {
    return this.$store.state.socket.plugins.includes('update_manager')
  }

  close () {
    this.$emit('input', false)
  }

  emitChange (e: boolean) {
    this.$emit('input', e)
  }
}
</script>
