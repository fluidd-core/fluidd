<template>
  <v-tooltip bottom>
    <template #activator="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        fab
        small
        text
        :disabled="disabled"
        :color="property ? 'primary' : undefined"
        v-on="on"
        @click="property = !property"
      >
        <v-icon>{{ icon }}</v-icon>
      </v-btn>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import StatesMixin from '@/mixins/state'

@Component({})
export default class GcodePreviewToolbarButton extends Mixins(StatesMixin) {
  @Prop({ type: String, required: true })
  readonly name!: string

  @Prop({ type: String, required: true })
  readonly icon!: string

  @Prop({ type: String, required: true })
  readonly tooltip!: string

  @Prop({ type: Boolean, default: false })
  readonly disabled!: boolean

  get property () {
    return this.$store.getters['gcodePreview/getViewerOption'](this.name)
  }

  set property (value) {
    this.$store.commit('gcodePreview/setViewerState', { [this.name]: value })
  }
}
</script>
