<template>
  <v-footer app absolute>
    <span class="font-weight-light grey--text">
      &copy; {{ new Date().getFullYear() }}
      fluidd: v{{ appInfo.fluidd.version }}-{{ appInfo.fluidd.hash }},
      moonraker: {{ appInfo.moonraker.current_hash }},
      klipper: {{ appInfo.klipper.current_hash }}
    </span>
    <!-- <pre>{{ appInfo }}</pre> -->
  </v-footer>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component } from 'vue-property-decorator'

@Component({})
export default class Footer extends Vue {
  get appInfo () {
    return {
      fluidd: this.$store.state.version.fluidd,
      moonraker: this.$store.state.version.components.moonraker || {},
      klipper: this.$store.state.version.components.klipper || {}
    }
  }
}
</script>
