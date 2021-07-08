<template>
  <!-- not collapsed -->
  <div v-if="!isCollapsed && hasDefaultSlot">
    <slot></slot>
  </div>

  <!-- collapsed to hamburger -->
  <v-menu
    v-else-if="isCollapsed && hasDefaultSlot"
    transition="slide-y-transition"
    left
    offset-y
    :close-on-content-click="false"
  >
    <template v-slot:activator="{ on, attrs }">
      <app-btn
        fab
        x-small
        text
        color=""
        v-bind="attrs"
        v-on="on">
        <v-icon>{{ menuIcon }}</v-icon>
      </app-btn>
    </template>
    <v-sheet elevation="0" class="pa-2">
      <slot></slot>
    </v-sheet>
  </v-menu>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class AppBtnCollapseGroup extends Vue {
  @Prop({ type: Boolean, default: false })
  collapsed!: boolean

  @Prop({ type: String, default: '$menu' })
  menuIcon!: string

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
