<template>
  <v-alert text dense icon="$alert" type="warning">
    <div class="text-body-1 mb-2">
      {{ $t('app.general.error.app_warnings_found', { appName }) }}
    </div>
    <ul class="mb-4" v-if="printerWarnings.length > 0">
      <li v-for="(warning, index) in printerWarnings" :key="index" v-html="warning.message"></li>
    </ul>

    <div v-if="moonrakerWarnings.length > 0">
      <div class="mb-2">{{ $t('app.general.error.failed_components') }}</div>
      <ul class="mb-4">
        <li v-for="(warning, index) in moonrakerWarnings" :key="index" v-html="warning"></li>
      </ul>
    </div>

    <div v-if="printerWarnings.length > 0">
      <span v-html="printerWarningsTxt"></span>
    </div>
    <div v-if="moonrakerWarnings.length > 0">
      <span v-html="moonrakerWarningsTxt"></span>
    </div>
  </v-alert>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Globals } from '@/globals'

@Component({
  components: {}
})
export default class KlippyCard extends Mixins(StateMixin) {
  get docsUrl () {
    return Globals.DOCS_REQUIRED_CONFIGURATION
  }

  get moonrakerDocsUrl () {
    return Globals.DOCS_MOONRAKER_PLUGINS
  }

  get printerWarningsTxt () {
    return this.$t('app.general.error.app_setup_link', {
      Url: this.docsUrl
    })
  }

  get moonrakerWarningsTxt () {
    return this.$t('app.general.error.components_config', {
      url: this.moonrakerDocsUrl
    })
  }

  get appName () {
    return Globals.APP_NAME
  }

  get printerWarnings () {
    return this.$store.getters['printer/getPrinterWarnings']
  }

  get moonrakerWarnings () {
    return this.$store.getters['printer/getMoonrakerWarnings']
  }
}
</script>
