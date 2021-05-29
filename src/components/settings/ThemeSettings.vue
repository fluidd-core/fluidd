
<template>
  <div>
    <v-subheader id="theme">{{ $t('app.setting.title.theme') }}</v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4">

      <app-setting :title="$t('app.setting.label.theme_preset')">
        <v-select
          filled
          dense
          single-line
          hide-details="auto"
          :items="themePresets"
          item-value="icon.src"
          item-text="name"
          v-model="themePreset"
          return-object
        ></v-select>
      </app-setting>

      <v-divider></v-divider>

      <app-setting :title="$t('app.setting.label.primary_color')">
        <app-btn
          outlined
          small
          color="primary"
          class="mr-2"
          @click="handleReset"
        >
          {{ $t('app.setting.btn.reset') }}
        </app-btn>

        <app-color-picker
          v-if="theme"
          v-model="themeColor"
          :title="$t('app.setting.btn.select_theme')"
        >
        </app-color-picker>
      </app-setting>

      <v-divider></v-divider>

      <app-setting :title="$t('app.setting.label.dark_mode')">
        <v-switch
          @click.native.stop
          v-model="isDark"
          hide-details
          class="mb-5"
        ></v-switch>
      </app-setting>

    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { SupportedTheme, ThemeConfig } from '@/store/config/types'
import ThemePicker from '../ui/AppColorPicker.vue'

@Component({
  components: {
    ThemePicker
  }
})
export default class ThemeSettings extends Mixins(StateMixin) {
  preset: SupportedTheme | null = null

  get themePreset () {
    return this.$store.getters['config/getCurrentThemePreset']
    // return this.themePresets.find((preset: SupportedTheme) => preset.logo.src === this.theme.logo.src)
  }

  set themePreset (d: SupportedTheme) {
    const value: ThemeConfig = {
      isDark: d.isDark,
      logo: d.logo,
      currentTheme: {
        primary: d.color
      }
    }

    this.setTheme(d.color, d.isDark)
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.theme',
      value,
      server: true
    })
  }

  get theme () {
    return this.$store.getters['config/getTheme']
  }

  get themeColor () {
    return this.theme.currentTheme.primary
  }

  set themeColor (value: string) {
    this.setTheme(value, this.isDark)
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.theme.currentTheme.primary',
      value,
      server: true
    })
  }

  get isDark () {
    return this.theme.isDark
  }

  set isDark (value: boolean) {
    this.setTheme(this.themeColor, value)
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.theme.isDark',
      value,
      server: true
    })
  }

  get themePresets () {
    return this.$store.state.config.hostConfig.themePresets
  }

  setTheme (primary: string, isDark: boolean) {
    this.$vuetify.theme.dark = isDark
    this.$vuetify.theme.currentTheme.primary = primary
  }

  handleReset () {
    const d = this.$store.getters['config/getCurrentThemePreset']
    const value: ThemeConfig = {
      isDark: d.isDark,
      logo: d.logo,
      currentTheme: {
        primary: d.color
      }
    }
    this.setTheme(d.color, true)
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.theme',
      value,
      server: true
    })
  }
}
</script>
