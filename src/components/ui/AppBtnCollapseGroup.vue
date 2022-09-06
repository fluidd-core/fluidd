<template v-if="hasDefaultSlot">
  <!-- not collapsed -->
  <div
    v-if="!isCollapsed"
    class="d-inline-block"
  >
    <slot />
  </div>

  <!-- collapsed to hamburger -->
  <v-menu
    v-else
    transition="slide-y-transition"
    left
    offset-y
    :close-on-content-click="false"
  >
    <template #activator="{ on, attrs }">
      <app-btn
        fab
        x-small
        text
        color=""
        v-bind="attrs"
        class="ml-1"
        v-on="on"
      >
        <v-icon>{{ menuIcon }}</v-icon>
      </app-btn>
    </template>
    <v-sheet
      elevation="0"
      class="pa-2"
    >
      <slot />
    </v-sheet>
  </v-menu>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class AppBtnCollapseGroup extends Vue {
  @Prop({ type: Boolean, default: false })
  readonly collapsed!: boolean

  @Prop({ type: String, default: '$menu' })
  readonly menuIcon!: string

  get isCollapsed () {
    if (this.collapsed) return true
    return this.$vuetify.breakpoint.mdAndDown
  }

  get hasDefaultSlot () {
    return !!this.$slots.default
  }
}
</script>

<style lang="scss" scoped>
  .handle {
    cursor: pointer;
  }
</style>
