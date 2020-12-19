<template>
  <v-footer app absolute>
    <span class="font-weight-light grey--text">
      &copy; {{ new Date().getFullYear() }}
      fluidd: v{{ systemInfo.version }}-{{ systemInfo.hash }}
    </span>
  </v-footer>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component } from 'vue-property-decorator'

@Component({})
export default class Footer extends Vue {
  get systemInfo () {
    return {
      version: this.$store.state.version.fluidd.version,
      hash: this.$store.state.version.fluidd.hash
    }
  }
}
</script>
