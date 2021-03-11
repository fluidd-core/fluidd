
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
        :value="theme.currentTheme.primary"
        @update:color="handlePrimaryColorChange"
        mode="hexa"
        hide-mode-switch
        canvas-height="100"
        dot-size="25"
      >
      </v-color-picker>

      <v-switch
        @click.native.stop
        label="Dark Mode"
        v-model="theme.isDark"
        @change="handleDarkModeChange"
        hide-details
        class="mb-5"
      ></v-switch>

      <btn
        color="secondary"
        @click="handleReset"
      >
        Reset to default
      </btn>

    </v-card-text>
  </collapsable-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { Debounce } from 'vue-debounce-decorator'
import StateMixin from '@/mixins/state'
import { ThemeConfig } from '@/store/config/types'

@Component({
  components: {}
})
export default class ThemeSettingsCard extends Mixins(StateMixin) {
  get theme () {
    return this.$store.getters['config/getTheme']
  }

  setTheme (value: ThemeConfig) {
    this.$vuetify.theme.dark = value.isDark
    this.$vuetify.theme.currentTheme.primary = value.currentTheme.primary
  }

  @Debounce(500)
  handlePrimaryColorChange (value: { hex: string }) {
    this.setTheme({
      isDark: this.theme.isDark,
      currentTheme: {
        primary: value.hex
      }
    })

    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.theme.currentTheme.primary',
      value: value.hex,
      server: true
    })
  }

  handleDarkModeChange (value: boolean) {
    this.setTheme({
      isDark: value,
      currentTheme: {
        primary: this.theme.currentTheme.primary
      }
    })

    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.theme.isDark',
      value,
      server: true
    })
  }

  handleReset () {
    const theme: ThemeConfig = {
      isDark: true,
      currentTheme: {
        primary: '#2196F3'
      }
    }
    this.setTheme(theme)
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.theme',
      value: theme,
      server: true
    })
  }
}
</script>
