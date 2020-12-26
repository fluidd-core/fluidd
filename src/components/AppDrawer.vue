<template>
  <v-navigation-drawer
    :value="value"
    @input="emitChange"
    app right clipped temporary
    dense>

    <v-list dense>
      <!-- <v-subheader>{{ instanceName }}</v-subheader> -->

      <v-list-item to="/" class="d-flex d-md-none">
        <v-list-item-icon>
          <v-icon>$home</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>Dashboard</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
      <v-list-item to="/jobs" class="d-flex d-md-none" v-if="jobsInMenu">
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
    <v-list
      dense
      subheader
      two-line
      flat
      v-model="layoutMode">
      <v-list-item-group
        multiple
      >
        <v-list-item @click.prevent="layoutMode = !layoutMode">
          <v-list-item-action>
            <v-checkbox :input-value="layoutMode"></v-checkbox>
          </v-list-item-action>

          <v-list-item-content>
            <v-list-item-title>Adjust layout</v-list-item-title>
            <v-list-item-subtitle>Adjust dashboard layout</v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
      </v-list-item-group>
    </v-list>

  </v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import SystemCommandsWidget from '@/components/widgets/SystemCommandsWidget.vue'
import SystemVersionsWidget from '@/components/widgets/SystemVersionsWidget.vue'
import SystemPrintersWidget from '@/components/widgets/SystemPrintersWidget.vue'

import UtilsMixin from '@/mixins/utils'

@Component({
  components: {
    SystemCommandsWidget,
    SystemVersionsWidget,
    SystemPrintersWidget
  }
})
export default class AppDrawer extends Mixins(UtilsMixin) {
  @Prop({ type: Boolean, default: false })
  value!: boolean

  get layoutMode () {
    return this.$store.state.config.layoutMode
  }

  set layoutMode (val: boolean) {
    this.$store.commit('config/setLayoutMode', val)
    this.close()
  }

  get instanceName () {
    return this.$store.state.config.fileConfig.general.instanceName
  }

  get jobsInMenu () {
    return this.$store.state.config.fileConfig.general.jobsInMenu
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
