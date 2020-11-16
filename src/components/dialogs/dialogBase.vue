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
      </v-card-title>
      <v-card-text>
        <slot></slot>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <slot name="actions">
          <v-btn color="secondary" @click="emitChange(false)">Close</v-btn>
          <v-btn color="primary" @click="saveValue()">Save</v-btn>
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
}
</script>
