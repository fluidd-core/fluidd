<template>
  <v-btn
    @click="$emit('click')"
    :disabled="disabled"
    :elevation="2"
    :min-width="40"
    :loading="loading"
    :color="color"
    class="pa-0">
    <v-icon :small="hasDefaultSlot">{{ icon }}</v-icon>
    <slot></slot>
  </v-btn>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({})
export default class BtnToolheadMove extends Vue {
  @Prop({ type: String, required: true })
  icon!: string

  @Prop()
  disabled!: boolean

  @Prop({ type: String, default: 'secondary' })
  color!: string

  @Prop({ type: Boolean, default: false })
  loading!: boolean

  get hasDefaultSlot () {
    return !!this.$slots.default || !!this.$scopedSlots.default
  }
}
</script>
