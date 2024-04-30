<template>
  <v-list
    dense
    width="180"
    class="grow pt-0"
    :color="($vuetify.theme.dark) ? '#1E1E20' : '#FFFFFF'"
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
          <v-list-item-title>{{ item.name }}</v-list-item-title>
        </v-list-item-content>
      </v-list-item>
    </template>
  </v-list>
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
      { name: this.$t('app.setting.title.console'), hash: '#console', visible: true },
      { name: this.$t('app.setting.title.file_browser'), hash: '#browser', visible: true },
      { name: this.$t('app.setting.title.file_editor'), hash: '#editor', visible: true },
      { name: this.$t('app.setting.title.macros'), hash: '#macros', visible: true },
      { name: this.$tc('app.setting.title.camera', 2), hash: '#camera', visible: true },
      { name: this.$t('app.setting.title.tool'), hash: '#toolhead', visible: true },
      { name: this.$t('app.setting.title.thermal_presets'), hash: '#presets', visible: true },
      { name: this.$t('app.setting.title.gcode_preview'), hash: '#gcodePreview', visible: true },
      { name: this.$t('app.general.title.timelapse'), hash: '#timelapse', visible: this.supportsTimelapse },
      { name: this.$t('app.spoolman.title.spoolman'), hash: '#spoolman', visible: this.supportsSpoolman },
      { name: this.$t('app.version.title'), hash: '#versions', visible: this.supportsVersions }
    ]
  }

  get supportsVersions () {
    return this.$store.getters['server/componentSupport']('update_manager')
  }

  get supportsTimelapse () {
    return this.$store.getters['server/componentSupport']('timelapse')
  }

  get supportsSpoolman () {
    return this.$store.getters['server/componentSupport']('spoolman')
  }
}
</script>
