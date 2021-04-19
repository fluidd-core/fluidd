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
      <template
        v-for="item in items"
      >
        <v-list-item
          v-if="item.visible"
           :key="item.name"
          :to="`/settings${item.hash}`"
          :exact="false"
          link
        >
          <v-list-item-icon>
            <v-icon class="grey--text">{{ item.icon }}</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title class="grey--text">{{ item.name }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class AppSettingsNav extends Vue {
  get items () {
    return [
      { name: this.$t('app.setting.title.general'), icon: '$printer', hash: '#general', visible: true },
      { name: this.$t('app.version.title'), icon: '$refresh', hash: '#versions', visible: this.supportsVersions },
      { name: this.$t('app.setting.title.macros'), icon: '$fileCode', hash: '#macros', visible: true },
      { name: this.$tc('app.setting.title.camera', 2), icon: '$camera', hash: '#camera', visible: true },
      { name: this.$t('app.setting.title.theme'), icon: '$cogs', hash: '#theme', visible: true },
      { name: this.$t('app.setting.title.tool'), icon: '$printer3dNozzle', hash: '#toolhead', visible: true },
      { name: this.$t('app.setting.title.thermal_presets'), icon: '$fire', hash: '#presets', visible: true },
      { name: this.$t('app.setting.title.gcode_preview'), icon: '$cubeScan', hash: '#gcodePreview', visible: true }
    ]
  }

  get supportsVersions () {
    return this.$store.getters['server/componentSupport']('update_manager')
  }
}
</script>
