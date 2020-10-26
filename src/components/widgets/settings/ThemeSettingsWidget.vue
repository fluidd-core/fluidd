
<template>
  <v-card color="tertiary" class="mb-4">
    <v-card-title class="quaternary font-weight-light"><v-icon left>$cogs</v-icon> Themes</v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <v-select
        label="Theme"
        v-model="theme"
        :items="['dark', 'light']">
      </v-select>
      <!-- <v-switch
        @click.native.stop
        v-model="darkmode"
        hide-details
        class="mr-5 d-none d-sm-block"
      ></v-switch> -->
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({
  components: {}
})
export default class ThemeSettingsWidget extends Mixins(UtilsMixin) {
  // Theme is currently restricted to dark / light.
  // This starts impl thought on more options.
  get theme () {
    const darkMode = this.$store.state.config.fileConfig.general.darkMode
    return (darkMode)
      ? 'dark'
      : 'light'
  }

  set theme (val: string) {
    const darkMode = (val === 'dark')
    this.$vuetify.theme.dark = darkMode
    this.$store.dispatch('config/saveGeneric', { key: 'fileConfig.general.darkMode', value: darkMode })
  }
}
</script>
