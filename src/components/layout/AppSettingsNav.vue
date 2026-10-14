<template>
  <div class="settings-nav">
    <template
      v-for="item in items"
    >
      <router-link
        v-if="item.visible"
        :key="item.name"
        :to="`${settingsPath}${item.hash}`"
        class="settings-nav__item"
        :class="{ 'settings-nav__item--active': $route.hash === item.hash }"
      >
        {{ item.name }}
      </router-link>
    </template>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'

@Component({})
export default class AppSettingsNav extends Vue {
  get settingsPath () {
    return scopedPath('/settings', activeSlug())
  }

  get isVisible () {
    return !this.$vuetify.breakpoint.mobile
  }

  get items () {
    return [
      { name: this.$t('app.setting.title.general'), hash: '#general', visible: true },
      { name: this.$t('app.setting.title.theme'), hash: '#theme', visible: true },
      { name: this.$t('app.setting.title.authentication'), hash: '#auth', visible: true },
      { name: 'Access', hash: '#access', visible: this.supportsAccess },
      { name: this.$t('app.protection.title'), hash: '#protection', visible: this.supportsProtection && !this.supportsAccess },
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

  get supportsAccess () {
    return this.$store.getters['server/componentSupport']('muon_access')
  }

  get supportsProtection () {
    return this.$store.getters['server/componentSupport']('muon_protection')
  }
}
</script>

<style lang="scss" scoped>
  .settings-nav {
    margin-left: 21px;
    padding-left: 12px;
    border-left: 1px solid var(--m3d-border);
  }

  .settings-nav__item {
    display: block;
    padding: 6px 10px;
    border-radius: var(--m3d-radius-sm);
    color: var(--m3d-text-muted) !important;
    font-size: 0.8125rem;
    line-height: 1.3;
    text-decoration: none;

    &:hover {
      background-color: var(--m3d-hover);
      color: var(--m3d-text) !important;
    }
  }

  .settings-nav__item--active {
    color: var(--m3d-accent) !important;
    font-weight: 600;
  }
</style>
