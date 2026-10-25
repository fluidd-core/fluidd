<template>
  <v-menu
    bottom
    offset-y
    transition="slide-y-transition"
  >
    <template #activator="{ on, attrs, value }">
      <v-btn
        class="gcode-preview-select"
        text
        small
        :retain-focus-on-click="!isMobileViewport"
        v-bind="attrs"
        v-on="on"
      >
        {{ selectedItem?.text }}
        <v-icon
          small
          class="ml-1"
          :class="{ 'rotate-180': value }"
        >
          $chevronDown
        </v-icon>
      </v-btn>
    </template>

    <v-list dense>
      <v-list-item-group
        v-model="inputValue"
        mandatory
      >
        <v-list-item
          v-for="item in items"
          :key="item.value"
          :value="item.value"
        >
          <v-list-item-icon v-if="item.icon">
            <v-icon>
              {{ item.icon }}
            </v-icon>
          </v-list-item-icon>
          <v-list-item-title>
            {{ item.text }}
          </v-list-item-title>
        </v-list-item>
      </v-list-item-group>
    </v-list>
  </v-menu>
</template>

<script lang="ts">
import { Component, Prop, VModel, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'

type GcodePreviewSelectItem = {
  text: string,
  value: string,
  icon?: string
}

@Component({})
export default class GcodePreviewSelect extends Mixins(BrowserMixin) {
  @VModel({ type: String })
  inputValue?: string

  @Prop({ type: Array, required: true })
  readonly items!: GcodePreviewSelectItem[]

  get selectedItem (): GcodePreviewSelectItem | undefined {
    return this.items
      .find(item => item.value === this.inputValue)
  }
}
</script>

<style lang="scss" scoped>
  .gcode-preview-select {
    padding: 0 4px !important;
  }
</style>
