
<template>
  <div>
    <v-subheader id="theme">Theme</v-subheader>
    <v-card
      :elevation="5"
      dense
      class="mb-4">
      <v-list
        color="transparent"
      >
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>Primary color</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <theme-picker
              v-if="theme"
              v-model="themeColor">
            </theme-picker>
          </v-list-item-action>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>Dark mode</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <v-switch
              @click.native.stop
              v-model="isDark"
              hide-details
              class="mb-5"
            ></v-switch>
          </v-list-item-action>
        </v-list-item>

        <v-divider></v-divider>

        <v-list-item>
          <v-list-item-content>
            <v-list-item-title>Reset settings</v-list-item-title>
          </v-list-item-content>
          <v-list-item-action>
            <btn
              outlined
              small
              color="primary"
              @click="handleReset"
            >
              Reset
            </btn>
          </v-list-item-action>
        </v-list-item>

      </v-list>
    </v-card>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import ThemePicker from '@/components/widgets/settings/ThemePicker.vue'
import StateMixin from '@/mixins/state'
import { ThemeConfig } from '@/store/config/types'

@Component({
  components: {
    ThemePicker
  }
})
export default class ThemeSettingsCard extends Mixins(StateMixin) {
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

  setTheme (primary: string, isDark: boolean) {
    this.$vuetify.theme.dark = isDark
    this.$vuetify.theme.currentTheme.primary = primary
  }

  handleReset () {
    const value: ThemeConfig = {
      isDark: true,
      currentTheme: {
        primary: '#2196F3'
      }
    }
    this.setTheme('#2196F3', true)
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.theme',
      value,
      server: true
    })
  }
}
</script>
