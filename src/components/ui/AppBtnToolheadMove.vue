<template>
  <v-tooltip
    :disabled="!tooltip"
    top
  >
    <template #activator="{ on, attrs }">
      <app-btn
        :disabled="disabled"
        min-width="40"
        :color="color"
        class="px-2"
        v-bind="{...$attrs, ...attrs}"
        v-on="{...$listeners, ...on}"
        @click="$emit('click')"
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

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Prop({ type: String, default: 'btncolor' })
  readonly color!: string

  @Prop({ type: String })
  readonly tooltip?: string

  @Prop({ type: Boolean })
  readonly smallIcon?: boolean

  get hasDefaultSlot () {
    return !!this.$slots.default || !!this.$scopedSlots.default
  }
}
</script>
