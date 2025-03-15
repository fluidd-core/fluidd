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
      <app-setting>
        <template #title>
          <span>{{ $t('app.setting.label.theme_preset') }}</span>
          <app-inline-help
            bottom
            small
            :tooltip="$t('app.setting.tooltip.theme_disclaimer')"
          />
        </template>
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
          v-model="themeColor"
          :title="$t('app.setting.btn.select_theme')"
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.dark_mode')">
        <v-switch
          v-model="isDark"
          hide-details
          @click.native.stop
        />
      </app-setting>

      <v-divider />

      <app-setting :title="$t('app.setting.label.show_logo_on_background')">
        <v-switch
          v-model="backgroundLogo"
          hide-details
          @click.native.stop
        />
      </app-setting>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { ThemePreset, ThemeConfig } from '@/store/config/types'
import ThemePicker from '../ui/AppColorPicker.vue'

@Component({
  components: {
    ThemePicker
  }
})
export default class ThemeSettings extends Mixins(StateMixin) {
  get theme (): ThemeConfig {
    return this.$typedState.config.uiSettings.theme
  }

  get themePresets (): ThemePreset[] {
    return this.$typedState.config.hostConfig.themePresets
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

  set themeColor (value: string) {
    if (this.theme.color.toLowerCase() !== value.toLowerCase()) {
      this.updateTheme({
        color: value
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
    this.$typedDispatch('config/updateTheme', updatedTheme)
  }

  handleReset () {
    const themePreset = this.themePreset

    if (themePreset) {
      this.themePreset = themePreset
    }
  }
}
</script>
