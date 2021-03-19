<template>
  <v-alert text dense icon="$alert" type="warning">
    <div class="text-body-1 mb-2">{{$t('app.warnings.found',{ appName })}}</div>
    <ul class="mb-4" v-if="printerWarnings.length > 0">
      <li v-for="(warning, index) in printerWarnings" :key="index" v-html="warning.message"></li>
    </ul>

    <div v-if="moonrakerWarnings.length > 0">
      <div class="mb-2">{{$t('app.warnings.failedPlugins')}}</div>
      <ul class="mb-4">
        <li v-for="(warning, index) in moonrakerWarnings" :key="index" v-html="warning"></li>
      </ul>
    </div>

    <div v-if="printerWarnings.length > 0">{{$t('app.warnings.fluiddReq[0]')}}<a target="_blank" :href="docsUrl">{{$t('app.warnings.fluiddReq[1]')}}</a></div>
    <div v-if="moonrakerWarnings.length > 0">{{$t('app.warnings.moonrakerPluginConfig[0]')}}<a target="_blank" :href="moonrakerDocsUrl">{{$t('app.warnings.moonrakerPluginConfig[1]')}}</a></div>
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
