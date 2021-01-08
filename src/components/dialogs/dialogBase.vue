<template>
  <v-dialog
    @input="emitChange(value)"
    :value="value"
    :max-width="maxWidthValue"
    persistent
  >
    <v-card color="secondary darken-1">
      <v-card-title>
        <span class="headline"> {{ title }}</span>
        <v-spacer />
        <slot name="title-icons"></slot>
      </v-card-title>
      <v-card-text>
        <slot></slot>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <slot name="actions">
          <v-btn color="warning" text @click="emitChange(false)">Cancel</v-btn>
          <v-btn color="primary" :elevation="2" @click="saveValue()">Ok</v-btn>
        </slot>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({})
export default class DialogBase extends Mixins(UtilsMixin) {
  @Prop({ type: Boolean, required: true })
  public value!: boolean

  @Prop({ type: String, required: true })
  title!: string

  @Prop({ type: Number, required: false, default: 250 })
  maxWidth!: number

  @Prop({ type: String })
  helpTooltip!: string

  get maxWidthValue (): string | undefined {
    return (this.maxWidth) ? this.maxWidth.toString() + 'px' : undefined
  }

  emitChange (val: boolean) {
    this.$emit('input', val)
  }

  saveValue () {
    this.$emit('save')
    this.$emit('input', false)
  }

  get hasDefaultSlot () {
    return this.$slots.default || this.$scopedSlots.default
  }

  get hasActionsSlot () {
    return this.$slots.actions || this.$scopedSlots.actions
  }
}
</script>
