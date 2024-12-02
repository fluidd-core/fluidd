<template>
  <v-btn
    v-bind="$attrs"
    :color="color"
    :fab="fab"
    :icon="icon"
    :outlined="outlined"
    :text="text"
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

@Component({
  inheritAttrs: false
})
export default class AppBtn extends Vue {
  @Prop({ type: String, default: 'btncolor' })
  color!: string

  @Prop({ type: Boolean })
  fab?: boolean

  @Prop({ type: Boolean })
  icon?: boolean

  @Prop({ type: Boolean })
  outlined?: boolean

  @Prop({ type: Boolean })
  text?: boolean

  get colorIsLight () {
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
