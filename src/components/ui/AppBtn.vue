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
      'grey--text text--darken-3': primaryColorIsLight
    }"
    v-on="$listeners"
  >
    <slot />
  </v-btn>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

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

  get primaryColorIsLight () {
    if (
      this.fab ||
      this.icon ||
      this.outlined ||
      this.text ||
      this.color !== 'primary'
    ) {
      return false
    }

    const color = this.$vuetify.theme.currentTheme.primary?.toString() ?? ''

    return !this.$filters.isColorDark(color)
  }
}
</script>
