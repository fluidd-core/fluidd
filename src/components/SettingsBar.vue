<template>
  <v-navigation-drawer
    app
    clipped
    color="transparent"
    width="210"
  >
    <v-list
      dense
      nav
      color="transparent"
    >
      <v-list-item
        @click="$vuetify.goTo(item.ref)"
        v-for="item in items" :key="item.name"
        link
      >
        <v-list-item-icon>
          <v-icon class="grey--text">{{ item.icon }}</v-icon>
        </v-list-item-icon>

        <v-list-item-content>
          <v-list-item-title class="grey--text">{{ item.name }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import SystemCommandsWidget from '@/components/widgets/SystemCommandsWidget.vue'

@Component({
  components: {
    SystemCommandsWidget
  }
})
export default class SettingsBar extends Mixins(StateMixin) {
  items = [
    { name: 'General', icon: '$printer', ref: '#general' },
    { name: 'Camera', icon: '$camera', ref: '#camera' },
    { name: 'Theme', icon: '$cogs', ref: '#theme' },
    { name: 'Toolhead', icon: '$printer3dNozzle', ref: '#toolhead' },
    { name: 'Macros', icon: '$fileCode', ref: '#macros' },
    { name: 'Presets', icon: '$fire', ref: '#presets' }
  ]
}
</script>
