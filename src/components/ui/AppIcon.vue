<template>
  <div class="app-icon">
    <inline-svg
      :src="logoSrc"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import type { ThemeConfig } from '@/store/config/types'

@Component({})
export default class AppIcon extends Vue {
  get theme (): ThemeConfig {
    return this.$typedState.config.uiSettings.theme
  }

  get logoSrc () {
    return `${import.meta.env.BASE_URL}${this.theme.logo.src}`
  }
}
</script>

<style lang="scss" scoped>
  .app-icon {
    display: flex;
  }
</style>
