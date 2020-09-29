<template>
  <v-dialog
    @input="emitChange(value)"
    :value="value"
    persistent
    max-width="250px"
  >
    <v-card>
      <v-card-title>
        <span class="headline"> {{ title }}</span>
      </v-card-title>
      <v-card-text>
        <slot></slot>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="blue darken-1" text @click="emitChange(false)">Close</v-btn>
        <v-btn color="blue darken-1" text @click="saveValue()">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({})
export default class DialogInput extends Mixins(UtilsMixin) {
  @Prop({ type: Boolean, required: true })
  public value!: boolean

  @Prop({ type: String, required: true })
  title!: string

  emitChange (val: boolean) {
    this.$emit('input', val)
  }

  saveValue () {
    this.$emit('save')
    this.$emit('input', false)
  }
}
</script>
