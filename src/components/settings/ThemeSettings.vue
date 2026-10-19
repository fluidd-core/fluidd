<template>
  <section
    id="theme"
    class="m3-set"
    data-tid="theme-settings"
  >
    <h2 class="m3-set__title">
      How it looks
    </h2>
    <div class="m3-set__row">
      <div class="m3-set__label">
        <b>Dark or light</b>
      </div>
      <div class="m3-set__control">
        <seg-picker
          :options="[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]"
          :value="isDark ? 'dark' : 'light'"
          label="Dark or light"
          @input="isDark = $event === 'dark'"
        />
      </div>
    </div>
    <div class="m3-set__row">
      <div class="m3-set__label">
        <b>Panels</b>
        <span>Glass lets the page show through a little; flat is solid.</span>
      </div>
      <div class="m3-set__control">
        <seg-picker
          :options="uiStyles.map(s => ({ value: s, label: $t(`app.setting.label.interface_style_${s}`) }))"
          :value="uiStyle"
          label="Panels"
          @input="uiStyle = $event"
        />
      </div>
    </div>
    <div class="m3-set__row">
      <div class="m3-set__label">
        <b>Colour</b>
        <span>Buttons, switches and highlights. Reset goes back to {{ themePreset ? themePreset.name : 'the preset' }}'s.</span>
      </div>
      <div class="m3-set__control">
        <button
          type="button"
          class="cbtn cbtn--ghost"
          @click="handleReset"
        >
          Reset
        </button>
        <app-color-picker
          v-if="theme"
          v-model="themeColor"
          :title="$t('app.setting.btn.select_theme')"
        />
      </div>
    </div>
    <div class="m3-set__row">
      <div class="m3-set__label">
        <b>Logo behind the pages</b>
      </div>
      <div class="m3-set__control">
        <toggle-switch
          :value="backgroundLogo"
          label="Logo behind the pages"
          @input="backgroundLogo = $event"
        />
      </div>
    </div>
    <div class="m3-set__row">
      <div class="m3-set__label">
        <b>A community theme</b>
        <span>Another maker's colours and logo. Their names and logos are theirs; Fluidd's makers include them with permission.</span>
      </div>
      <div class="m3-set__control m3-set__control--wide">
        <v-select
          v-model="themePreset"
          outlined
          dense
          single-line
          hide-details
          :items="themePresets"
          item-value="icon.src"
          item-text="name"
          return-object
        />
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import type { ThemePreset, ThemeConfig, UiStyle } from '@/store/config/types'
import { UI_STYLES } from '@/util/ui-style'
import ThemePicker from '../ui/AppColorPicker.vue'
import SegPicker from '@/components/control/SegPicker.vue'
import ToggleSwitch from '@/components/control/ToggleSwitch.vue'

@Component({
  components: {
    ThemePicker,
    SegPicker,
    ToggleSwitch
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

  set themeColor (value: string) {
    if (this.theme.color.toLowerCase() !== value.toLowerCase()) {
      this.updateTheme({
        color: value
      })
    }
  }

  get uiStyles () {
    return UI_STYLES
  }

  get uiStyle (): UiStyle {
    return this.theme.style
  }

  set uiStyle (value: UiStyle) {
    this.updateTheme({
      style: value
    })
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
