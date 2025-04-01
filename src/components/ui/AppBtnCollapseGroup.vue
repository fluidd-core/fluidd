<template v-if="hasDefaultSlot">
  <!-- not collapsed -->
  <div
    v-if="!collapsed"
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
    :disabled="disabled"
    :close-on-content-click="false"
  >
    <template #activator="{ on, attrs }">
      <app-btn
        icon
        :disabled="disabled"
        v-bind="attrs"
        v-on="on"
      >
        <v-icon dense>
          {{ menuIcon }}
        </v-icon>
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

@Component({
  inheritAttrs: false
})
export default class AppBtnCollapseGroup extends Vue {
  @Prop({ type: Boolean })
  readonly collapsed?: boolean

  @Prop({ type: String, default: '$menu' })
  readonly menuIcon!: string

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  get hasDefaultSlot () {
    return !!this.$slots.default
  }
}
</script>
