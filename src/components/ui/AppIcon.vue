<template>
  <div class="logo-wrapper">
    <inline-svg
      :src="logoSrc"
      :style="{
        '--logo-color': logoColor,
        '--primary-color': theme.currentTheme.primary,
        '--primary-offset-color': theme.currentTheme.primaryOffset
      }"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import type { ThemeConfig } from '@/store/config/types'

@Component({})
export default class AppIcon extends Vue {
  get theme (): ThemeConfig {
    return this.$store.getters['config/getTheme'] as ThemeConfig
  }

  get logoSrc () {
    return `${import.meta.env.BASE_URL}${this.theme.logo.src}`
  }

  get logoColor () {
    return this.theme.isDark
      ? this.theme.logo.light
      : this.theme.logo.dark
  }
}
</script>

<style lang="scss" scoped>
  .logo-wrapper {
    display: flex;
  }
</style>
