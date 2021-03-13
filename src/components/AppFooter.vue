<template>
  <v-footer app absolute>
    <span class="font-weight-light grey--text">
      &copy; {{ new Date().getFullYear() }}
      fluidd: v{{ appInfo.fluidd.version }}-{{ appInfo.fluidd.hash }},
      moonraker: {{ appInfo.components.moonraker.current_hash }},
      klipper: {{ appInfo.components.klipper.current_hash }}
    </span>
    <!-- <pre>{{ appInfo }}</pre> -->
  </v-footer>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component } from 'vue-property-decorator'

@Component({})
export default class Footer extends Vue {
  get clientInfo () {
    return {
      version: this.$store.state.version.fluidd.version,
      hash: this.$store.state.version.fluidd.hash
    }
  }

  get appInfo () {
    return this.$store.state.version
  }
}
</script>
