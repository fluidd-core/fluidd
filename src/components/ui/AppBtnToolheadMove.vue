<template>
  <v-tooltip
    top
  >
    <template #activator="{ on, attrs }">
      <app-btn
        :disabled="disabled"
        min-width="40"
        :loading="loading"
        :color="color"
        v-bind="(tooltip !== '') ? attrs : undefined"
        class="px-2"
        @click="$emit('click')"
        v-on="(tooltip !== '') ? on : undefined"
      >
        <v-icon
          v-if="icon"
          :small="smallIcon"
          :class="{ 'mr-1': hasDefaultSlot }"
        >
          {{ icon }}
        </v-icon>
        <slot />
      </app-btn>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class AppBtnToolheadMove extends Vue {
  @Prop({ type: String, required: true })
  readonly icon!: string

  @Prop()
  readonly disabled!: boolean

  @Prop({ type: String, default: 'btncolor' })
  readonly color!: string

  @Prop({ type: Boolean, default: false })
  readonly loading!: boolean

  @Prop({ type: String, default: '' })
  readonly badge!: string

  @Prop({ type: String, default: '' })
  readonly tooltip!: string

  @Prop({ type: Boolean, default: false })
  readonly smallIcon!: boolean

  get hasDefaultSlot () {
    return !!this.$slots.default || !!this.$scopedSlots.default
  }
}
</script>
