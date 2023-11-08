<template>
  <v-tooltip bottom>
    <template #activator="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        icon
        small
        tabindex="-1"
        :disabled="disabled"
        :color="property ? 'primary' : undefined"
        :retain-focus-on-click="!isMobileViewport"
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
import BrowserMixin from '@/mixins/browser'

@Component({})
export default class GcodePreviewButton extends Mixins(BrowserMixin) {
  @Prop({ type: String, required: true })
  readonly name!: string

  @Prop({ type: String, required: true })
  readonly icon!: string

  @Prop({ type: String, required: true })
  readonly tooltip!: string

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  get property () {
    return this.$store.getters['gcodePreview/getViewerOption'](this.name)
  }

  set property (value) {
    this.$store.commit('gcodePreview/setViewerState', { [this.name]: value })
  }
}
</script>
