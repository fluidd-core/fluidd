<template>
  <span
    v-if="loading"
    class="v-icon app-icon app-icon--loading"
    :class="{
      'v-icon--left': left,
      'v-icon--right': right,
      'v-icon--disabled': disabled,
      'theme--dark': isDark,
      'theme--light': !isDark
    }"
    :style="{
      width: `${iconSize}px`,
      height: `${iconSize}px`
    }"
  >
    <v-progress-circular
      indeterminate
      class="app-icon__spinner"
      :size="spinnerSize"
      :width="spinnerWidth"
      :color="color"
    />
  </span>
  <v-icon
    v-else
    v-bind="$attrs"
    class="app-icon"
    :color="color"
    :disabled="disabled"
    :dark="dark"
    :light="light"
    :dense="dense"
    :left="left"
    :right="right"
    :x-small="xSmall"
    :small="small"
    :large="large"
    :x-large="xLarge"
    v-on="$listeners"
  >
    <slot />
  </v-icon>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component({
  inheritAttrs: false
})
export default class AppIcon extends Vue {
  @Prop({ type: Boolean })
  readonly loading?: boolean

  @Prop({ type: String })
  readonly color?: string

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Prop({ type: Boolean })
  readonly dark?: boolean

  @Prop({ type: Boolean })
  readonly light?: boolean

  @Prop({ type: Boolean })
  readonly dense?: boolean

  @Prop({ type: Boolean })
  readonly left?: boolean

  @Prop({ type: Boolean })
  readonly right?: boolean

  @Prop({ type: Boolean })
  readonly xSmall?: boolean

  @Prop({ type: Boolean })
  readonly small?: boolean

  @Prop({ type: Boolean })
  readonly large?: boolean

  @Prop({ type: Boolean })
  readonly xLarge?: boolean

  // Mirrors VIcon sizing so the spinner box occupies the same space as the icon
  get iconSize(): number {
    if (this.xSmall) return 12
    if (this.small) return 16
    if (this.large) return 36
    if (this.xLarge) return 40

    return this.dense ? 20 : 24
  }

  get isDark(): boolean {
    if (this.dark) return true
    if (this.light) return false

    return this.$vuetify.theme.dark
  }

  // Matches the ring of $radioOff: 20px diameter, 2px stroke on a 24px icon
  get spinnerSize(): number {
    return (this.iconSize * 20) / 24
  }

  get spinnerWidth(): number {
    return (this.iconSize * 2) / 24
  }
}
</script>

<style lang="scss" scoped>
.app-icon--loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
