
<template>
  <collapsable-card
    title="Theme"
    subTitle="Define a primary color, and whether to show in dark mode or not."
    cardKey="ThemeSettings"
    icon="$cogs">
    <v-card-text>
      <!-- <pre>{{ $vuetify.theme.themes.dark }}</pre> -->
      <!-- <pre>{{ color }}</pre> -->

      <v-color-picker
        :value="theme.colors.primary"
        @update:color="handlePrimaryColorChange"
        mode="hexa"
        hide-mode-switch
        hide-inputs
        canvas-height="100"
        dot-size="25"
      >
      </v-color-picker>

      <v-switch
        @click.native.stop
        label="Dark Mode"
        v-model="theme.darkMode"
        @change="handleDarkModeChange"
        hide-details
        class="mb-5"
      ></v-switch>

      <v-btn
        color="secondary"
        @click="handleReset"
      >
        Reset to default
      </v-btn>

    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { debounce } from 'lodash-es'
import UtilsMixin from '@/mixins/utils'
import { ThemeConfig } from '@/store/config/types'

@Component({
  components: {}
})
export default class ThemeSettingsCard extends Mixins(UtilsMixin) {
  get theme () {
    return this.$store.getters['config/getTheme']
  }

  setTheme (value: ThemeConfig) {
    this.$vuetify.theme.dark = value.darkMode
    this.$vuetify.theme.currentTheme.primary = value.colors.primary
  }

  handlePrimaryColorChange = debounce((value: { hex: string }) => {
    this.setTheme({
      darkMode: this.theme.darkMode,
      colors: {
        primary: value.hex
      }
    })

    this.$store.dispatch('config/saveGeneric', { key: 'uiSettings.theme.colors.primary', value: value.hex })
  }, 500)

  handleDarkModeChange (value: boolean) {
    this.setTheme({
      darkMode: value,
      colors: {
        primary: this.theme.colors.primary
      }
    })

    this.$store.dispatch('config/saveGeneric', { key: 'uiSettings.theme.darkMode', value })
  }

  handleReset () {
    const theme: ThemeConfig = {
      darkMode: true,
      colors: {
        primary: '#2196F3'
      }
    }
    this.setTheme(theme)
    this.$store.dispatch('config/saveGeneric', {
      key: 'uiSettings.theme',
      value: theme
    })
  }
}
</script>
