<template>
  <v-footer app>
    <span class="font-weight-light grey--text">
      &copy; {{ new Date().getFullYear() }}
      fluidd: v{{ systemInfo.version }}, klippy: {{ systemInfo.software_version }}
    </span>
  </v-footer>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component } from 'vue-property-decorator'

@Component({})
export default class Footer extends Vue {
  get systemInfo () {
    const printerInfo = this.$store.state.socket.printer.info
    return {
      version: this.$store.state.version,
      ...printerInfo
    }
  }
}
</script>
