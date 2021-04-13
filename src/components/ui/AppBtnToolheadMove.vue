<template>
  <v-tooltip
    top>
    <template v-slot:activator="{ on, attrs }">
      <app-btn
        @click="$emit('click')"
        :disabled="disabled"
        :min-width="40"
        :loading="loading"
        :color="color"
        v-bind="(tooltip !== '') ? attrs : undefined"
        v-on="(tooltip !== '') ? on : undefined"
        class="px-2">
        <v-icon
          v-if="icon"
          :small="smallIcon"
          :class="{ 'mr-1': hasDefaultSlot }">
          {{ icon }}
        </v-icon>
        <slot></slot>
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
  icon!: string

  @Prop()
  disabled!: boolean

  @Prop({ type: String, default: 'btncolor' })
  color!: string

  @Prop({ type: Boolean, default: false })
  loading!: boolean

  @Prop({ type: String, default: '' })
  badge!: string

  @Prop({ type: String, default: '' })
  tooltip!: string

  @Prop({ type: Boolean, default: false })
  smallIcon!: boolean

  get hasDefaultSlot () {
    return !!this.$slots.default || !!this.$scopedSlots.default
  }
}
</script>
