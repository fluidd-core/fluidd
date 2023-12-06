<template>
  <div>
    <v-subheader id="theme">
      {{ $t('app.setting.title.theme') }}
    </v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4"
    >
      <app-setting :title="$t('app.setting.label.theme_preset')">
        <v-select
          v-model="themePreset"
          filled
          dense
          single-line
          hide-details="auto"
          :items="themePresets"
          item-value="icon.src"
          item-text="name"
          return-object
        />
      </app-setting>

      <v-divider />

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
          :primary="themeColor"
          :title="$t('app.setting.btn.select_theme')"
          @change="handleChangeThemeColor"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.dark_mode')">
        <v-switch
          v-model="isDark"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.show_logo_on_background')">
        <v-switch
          v-model="backgroundLogo"
          hide-details
          class="mb-5"
          @click.native.stop
        />
      </app-setting>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { IroColor } from '@irojs/iro-core'
import type { ThemePreset, ThemeConfig } from '@/store/config/types'
import ThemePicker from '../ui/AppColorPicker.vue'

@Component({
  components: {
    ThemePicker
  }
})
export default class ThemeSettings extends Mixins(StateMixin) {
  get theme (): ThemeConfig {
    return this.$store.state.config.uiSettings.theme as ThemeConfig
  }

  get themePresets (): ThemePreset[] {
    return this.$store.state.config.hostConfig.themePresets as ThemePreset[]
  }

  get themePreset (): ThemePreset | undefined {
    return this.themePresets
      .find(themePreset => themePreset.logo.src === this.theme.logo.src)
  }

  set themePreset (value: ThemePreset) {
    const { color, isDark, logo } = value

    this.updateTheme({
      color,
      isDark,
      logo
    })
  }

  get themeColor () {
    return this.theme.color
  }

  handleChangeThemeColor (value: { channel: string; color: IroColor }) {
    const color = value.color.hexString

    if (this.theme.color.toLowerCase() !== color.toLowerCase()) {
      this.updateTheme({
        color
      })
    }
  }

  get isDark () {
    return this.theme.isDark
  }

  set isDark (value: boolean) {
    this.updateTheme({
      isDark: value
    })
  }

  get backgroundLogo () {
    return this.theme.backgroundLogo
  }

  set backgroundLogo (value: boolean) {
    this.updateTheme({
      backgroundLogo: value
    })
  }

  updateTheme (updatedTheme: Partial<ThemeConfig>) {
    this.$store.dispatch('config/updateTheme', updatedTheme)
  }

  handleReset () {
    const themePreset = this.themePreset

    if (themePreset) {
      this.themePreset = themePreset
    }
  }
}
</script>
