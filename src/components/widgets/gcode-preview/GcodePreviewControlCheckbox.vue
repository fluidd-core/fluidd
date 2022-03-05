<template>
  <v-checkbox
    :disabled="disabled"
    :label="label"
    v-model="property"
    hide-details
  />
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class GcodePreviewControlCheckbox extends Mixins(StateMixin) {
  @Prop({
    type: String,
    required: true
  })
  name!: string

  @Prop({
    type: String,
    required: true
  })
  label!: string

  @Prop({
    type: Boolean,
    default: false
  })
  disabled!: boolean

  get property () {
    return this.$store.getters['gcodePreview/getViewerOption'](this.name)
  }

  set property (value) {
    this.$store.commit('gcodePreview/setViewerState', { [this.name]: value })
  }
}
</script>
