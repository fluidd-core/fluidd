<template>
  <v-btn
    v-bind="$attrs"
    :color="colorToApply"
    :fab="fab"
    :icon="icon"
    :outlined="outlined"
    :text="text"
    :plain="plain"
    :class="{
      'grey--text text--darken-3': colorIsLight
    }"
    v-on="$listeners"
  >
    <slot />
  </v-btn>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { TinyColor } from '@ctrl/tinycolor'

@Component({
  inheritAttrs: false
})
export default class AppBtn extends Vue {
  @Prop({ type: String })
  color?: string

  @Prop({ type: Boolean })
  fab?: boolean

  @Prop({ type: Boolean })
  icon?: boolean

  @Prop({ type: Boolean })
  outlined?: boolean

  @Prop({ type: Boolean })
  text?: boolean

  @Prop({ type: Boolean })
  plain?: boolean

  get colorToApply () {
    if (this.color != null) {
      return this.color
    }

    return (
      this.fab ||
      this.icon ||
      this.plain
    )
      ? undefined
      : 'btncolor'
  }

  get colorIsLight () {
    const color = this.colorToApply

    if (
      color == null ||
      this.fab ||
      this.icon ||
      this.outlined ||
      this.text ||
      this.plain
    ) {
      return false
    }

    const themeColor = this.$vuetify.theme.currentTheme[color]

    // Theme colors are used as is, with the exception of "primary"
    if (
      themeColor != null &&
      color !== 'primary'
    ) {
      return false
    }

    const resolvedColor = new TinyColor(themeColor?.toString() ?? color)

    return (
      resolvedColor.isValid &&
      resolvedColor.isLight()
    )
  }
}
</script>
