<template>
  <v-alert text dense icon="$alert" type="warning">
    <div class="text-body-1 mb-2">{{ appName }} warnings found.</div>
    <ul class="mb-4" v-if="printerWarnings">
      <li v-for="(warning, index) in printerWarnings" :key="index" v-html="warning.message"></li>
    </ul>

    <div v-if="moonrakerWarnings">
      <div class="mb-2">Moonraker has failed plugins, please check your logs, update your configuration and restart moonraker.</div>
      <ul class="mb-4">
        <li v-for="(warning, index) in moonrakerWarnings" :key="index" v-html="warning"></li>
      </ul>
    </div>

    <div v-if="printerWarnings">Fluidd setup requirements can be found <a target="_blank" :href="docsUrl">here.</a></div>
    <div v-if="moonrakerWarnings">Moonraker plugin configuration can be found <a target="_blank" :href="moonrakerDocsUrl">here.</a></div>
  </v-alert>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { Globals } from '@/globals'

@Component({
  components: {}
})
export default class KlippyCard extends Mixins(UtilsMixin) {
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
    console.log('got warnings', this.$store.getters['socket/getPrinterWarnings'])
    return this.$store.getters['socket/getPrinterWarnings']
  }

  get moonrakerWarnings () {
    console.log('got moonraker warnings', this.$store.getters['socket/getMoonrakerWarnings'])
    return this.$store.getters['socket/getMoonrakerWarnings']
  }
}
</script>
