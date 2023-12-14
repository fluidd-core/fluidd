<template>
  <v-btn
    v-bind="attrs"
    :class="classes"
    v-on="$listeners"
  >
    <slot />
  </v-btn>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component({})
export default class AppBtn extends Vue {
  get classes () {
    // Only apply the text change if this isn't;
    // - an icon, fab, outlined or text button and
    // it's the primary color.
    if (
      this.$attrs.fab === undefined &&
      this.$attrs.icon === undefined &&
      this.$attrs.outlined === undefined &&
      this.$attrs.text === undefined &&
      this.$attrs.color === 'primary'
    ) {
      // If the color of the btn isn't dark (i.e., light) then darken the text.
      return { 'grey--text text--darken-3': !this.colorIsDark }
    }
  }

  get colorIsDark () {
    const color = this.$vuetify.theme.currentTheme[this.$attrs.color]?.toString() ?? ''

    return this.$filters.isColorDark(color)
  }

  get attrs () {
    let attrs = this.$attrs
    if (attrs.color === undefined) {
      attrs = {
        ...attrs,
        color: 'btncolor'
      }
    }
    return attrs
  }
}
</script>
