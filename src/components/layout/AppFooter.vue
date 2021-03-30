<template>
  <v-footer app absolute>
    <span class="font-weight-light grey--text">
      &copy; {{ new Date().getFullYear() }}
      fluidd: v{{ appInfo.version }}-{{ appInfo.hash }}
    </span>
  </v-footer>
</template>

<script lang="ts">
import Vue from 'vue'
import { Component } from 'vue-property-decorator'

@Component({})
export default class AppFooter extends Vue {
  get appInfo () {
    return this.$store.state.version.fluidd
  }
}
</script>
