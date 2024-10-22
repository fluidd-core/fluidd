<template>
  <v-tooltip bottom>
    <template #activator="{ on, attrs }">
      <v-btn
        v-bind="attrs"
        icon
        small
        tabindex="-1"
        :disabled="disabled"
        :color="inputValue ? 'primary' : undefined"
        :retain-focus-on-click="!isMobileViewport"
        v-on="on"
        @click="inputValue = !inputValue"
      >
        <v-icon>{{ icon }}</v-icon>
      </v-btn>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script lang="ts">
import { Component, Prop, Mixins, VModel } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'

@Component({})
export default class GcodePreviewButton extends Mixins(BrowserMixin) {
  @VModel({ type: Boolean })
    inputValue?: boolean

  @Prop({ type: String, required: true })
  readonly icon!: string

  @Prop({ type: String, required: true })
  readonly tooltip!: string

  @Prop({ type: Boolean })
  readonly disabled?: boolean
}
</script>
