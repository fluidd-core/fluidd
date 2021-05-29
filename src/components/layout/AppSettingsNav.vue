<template>
  <v-navigation-drawer
    :value="isVisible"
    floating
    stateless
    fixed
    clipped
    width="180"
    color="transparent"
    class=""
    style="margin-left: 56px; margin-top: 52px;"
  >

    <v-list
      dense
      width="180"
      class="grow"
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
  get isVisible () {
    return !this.$vuetify.breakpoint.mobile
  }

  get items () {
    return [
      { name: this.$t('app.setting.title.general'), hash: '#general', visible: true },
      { name: this.$t('app.setting.title.theme'), hash: '#theme', visible: true },
      { name: this.$t('app.setting.title.authentication'), hash: '#auth', visible: true },
      { name: this.$t('app.setting.title.macros'), hash: '#macros', visible: true },
      { name: this.$tc('app.setting.title.camera', 2), hash: '#camera', visible: true },
      { name: this.$t('app.setting.title.tool'), hash: '#toolhead', visible: true },
      { name: this.$t('app.setting.title.thermal_presets'), hash: '#presets', visible: true },
      { name: this.$t('app.version.title'), hash: '#versions', visible: this.supportsVersions }
      // { name: this.$t('app.setting.title.gcode_preview'), icon: '$cubeScan', hash: '#gcodePreview', visible: true }
    ]
  }

  get supportsVersions () {
    return this.$store.getters['server/componentSupport']('update_manager')
  }
}
</script>
