<template>
  <v-btn
    v-bind="$attrs"
    v-on="$listeners"
    :class="classes"
  >
    <slot></slot>
  </v-btn>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class FluiddBtn extends Vue {
  get theme () {
    return this.$store.getters['config/getTheme']
  }

  get classes () {
    if (
      (this.$attrs.fab === undefined) &&
      (this.$attrs.icon === undefined) &&
      this.$attrs.color === 'primary'
    ) {
      return { 'grey--text text--darken-3': !this.$filters.isColorDark(this.theme.currentTheme[this.$attrs.color]) }
    }
  }

  get colorIsDark () {
    if (!this.$attrs.color || this.$attrs.color !== 'primary') return true
    return this.$filters.isColorDark(this.theme.currentTheme[this.$attrs.color])
  }
}
</script>
