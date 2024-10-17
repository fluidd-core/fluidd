<template>
  <v-menu
    bottom
    left
    max-width="260"
    :close-on-content-click="false"
    :disabled="disabled"
  >
    <template #activator="{ on, attrs }">
      <v-btn
        v-if="!dot"
        v-bind="attrs"
        :color="controlColor"
        :disabled="disabled"
        outlined
        small
        v-on="on"
      >
        {{ title }}
      </v-btn>

      <v-icon
        v-else
        v-bind="attrs"
        :color="controlColor"
        :disabled="disabled"
        v-on="on"
      >
        $circle
      </v-icon>
    </template>
    <v-card ref="card">
      <v-card-title
        v-if="title"
        class="card-heading mb-2"
        style="cursor: move; user-select: none;"
        @mousedown="startMouseDrag"
        @touchstart="startTouchDrag"
        @touchmove="touchMove"
      >
        {{ title }}
      </v-card-title>
      <v-card-text>
        <v-icon
          v-if="supportedChannels !== 'W'"
          :color="currentPrimaryColor.hexString"
          large
        >
          $circle
        </v-icon>

        <v-icon
          v-if="supportedChannels.includes('W')"
          :color="currentWhiteColor.hexString"
          large
        >
          $circle
        </v-icon>

        <v-layout
          align-center
          column
        >
          <app-iro-color-picker
            v-if="supportedChannels !== 'W'"
            v-model="currentPrimaryColor.hexString"
            :options="primaryOptions"
            @input="handleSubmitPrimary"
          />

          <app-iro-color-picker
            v-if="supportedChannels.includes('W')"
            v-model="currentWhiteColor.hexString"
            class="mt-4"
            :options="whiteOptions"
            @input="handleSubmitWhite"
          />
        </v-layout>

        <div class="text-right mt-4 mr-1">
          <v-btn-toggle
            v-model="valueRange"
            mandatory
          >
            <app-btn
              x-small
              value="absolute"
            >
              0..255
            </app-btn>
            <app-btn
              x-small
              value="percentage"
            >
              0..1
            </app-btn>
          </v-btn-toggle>
        </div>

        <v-layout
          class="mt-2"
          justify-space-between
        >
          <div
            v-if="supportedChannels !== 'W'"
            class="color-input"
          >
            <v-text-field
              v-model.number="currentRed"
              dense
              hide-details
              outlined
              persistent-placeholder
              @blur="handleReset"
              @keyup.enter.exact="handleSubmitPrimary"
            />
            <div>R</div>
          </div>
          <div
            v-if="supportedChannels !== 'W'"
            class="color-input"
          >
            <v-text-field
              v-model.number="currentGreen"
              dense
              hide-details
              outlined
              persistent-placeholder
              @blur="handleReset"
              @keyup.enter.exact="handleSubmitPrimary"
            />
            <div>G</div>
          </div>
          <div
            v-if="supportedChannels !== 'W'"
            class="color-input"
          >
            <v-text-field
              v-model.number="currentBlue"
              dense
              hide-details
              outlined
              persistent-placeholder
              @blur="handleReset"
              @keyup.enter.exact="handleSubmitPrimary"
            />
            <div>B</div>
          </div>
          <div
            v-if="supportedChannels.includes('W')"
            class="color-input"
          >
            <v-text-field
              v-model.number="currentWhite"
              dense
              hide-details
              outlined
              persistent-placeholder
              @blur="handleReset"
              @keyup.enter.exact="handleSubmitWhite"
            />
            <div>W</div>
          </div>
        </v-layout>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref, VModel, PropSync, Watch } from 'vue-property-decorator'
import iro from '@jaames/iro'
import { IroColor } from '@irojs/iro-core'
import type { ColorPickerProps } from '@jaames/iro/dist/ColorPicker'
import type { ColorPickerValueRange } from '@/store/config/types'

interface PointerPosition {
  x: number;
  y: number;
}

@Component({})
export default class AppColorPicker extends Vue {
  @VModel({ type: String, required: true })
    inputPrimaryColor!: string

  @PropSync('white', { type: Number, default: 0 })
    inputWhiteValue!: number

  @Prop({ type: String, default: '' })
  readonly title!: string

  @Prop({ type: Boolean })
  readonly dot?: boolean

  @Prop({ type: String, default: 'RGB' })
  readonly supportedChannels!: string

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Ref('card')
  readonly card!: Vue

  lastPointerPosition: PointerPosition = { x: 0, y: 0 }

  get primaryOptions (): Partial<ColorPickerProps> {
    return {
      color: this.inputPrimaryColor,
      width: 208,
      layout: [
        {
          component: iro.ui.Wheel,
          options: {
            wheelLightness: false,
            wheelAngle: 270,
            wheelDirection: 'clockwise'
          }
        },
        {
          component: iro.ui.Slider,
          options: {
            sliderType: 'value'
          }
        }
      ]
    }
  }

  get whiteOptions (): Partial<ColorPickerProps> {
    return {
      color: this.inputWhiteColor,
      width: 208,
      layout: [
        {
          component: iro.ui.Slider,
          options: {
            sliderType: 'value'
          }
        }
      ]
    }
  }

  currentPrimaryColor = new IroColor()
  currentWhiteColor = new IroColor()

  @Watch('value')
  onValue (value: string) {
    this.currentPrimaryColor.set(value)
  }

  @Watch('white')
  onWhite (value: number) {
    this.currentWhiteColor.set(this.valueToHexColor(value))
  }

  get currentRed (): number {
    return this.convertValueRange(this.currentPrimaryColor.red, 'out')
  }

  set currentRed (value: number) {
    this.currentPrimaryColor.red = this.convertValueRange(value, 'in')
  }

  get currentGreen (): number {
    return this.convertValueRange(this.currentPrimaryColor.green, 'out')
  }

  set currentGreen (value: number) {
    this.currentPrimaryColor.green = this.convertValueRange(value, 'in')
  }

  get currentBlue (): number {
    return this.convertValueRange(this.currentPrimaryColor.blue, 'out')
  }

  set currentBlue (value: number) {
    this.currentPrimaryColor.blue = this.convertValueRange(value, 'in')
  }

  get currentWhite (): number {
    return this.convertValueRange(this.currentWhiteColor.red, 'out')
  }

  set currentWhite (value: number) {
    this.currentWhiteColor.set(this.valueToHexColor(this.convertValueRange(value, 'in')))
  }

  get inputWhiteColor (): string {
    return this.valueToHexColor(this.inputWhiteValue)
  }

  get controlColor (): string {
    return (
      this.supportedChannels === 'W'
        ? this.inputWhiteColor
        : this.inputPrimaryColor
    )
  }

  get valueRange (): ColorPickerValueRange {
    return this.$store.state.config.uiSettings.general.colorPickerValueRange
  }

  set valueRange (value: ColorPickerValueRange) {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.colorPickerValueRange',
      value,
      server: true
    })
  }

  handleSubmitPrimary () {
    this.inputPrimaryColor = this.currentPrimaryColor.hexString
  }

  handleSubmitWhite () {
    this.inputWhiteValue = this.currentWhiteColor.red
  }

  handleReset () {
    this.currentPrimaryColor.set(this.inputPrimaryColor)
    this.currentWhiteColor.set(this.inputWhiteColor)
  }

  valueToHexColor (value: number): string {
    value = Math.round(Math.min(Math.max(value, 0), 255))

    return `#${value.toString(16).padStart(2, '0').repeat(3)}`
  }

  created () {
    this.handleReset()
  }

  startMouseDrag (event: MouseEvent) {
    this.lastPointerPosition = { x: event.clientX, y: event.clientY }
    window.addEventListener('mousemove', this.mouseMove)
    window.addEventListener('mouseup', this.stopMouseDrag)
  }

  stopMouseDrag () {
    window.removeEventListener('mousemove', this.mouseMove)
    window.removeEventListener('mouseup', this.stopMouseDrag)
  }

  startTouchDrag (event: TouchEvent) {
    this.lastPointerPosition = { x: event.touches[0].clientX, y: event.touches[0].clientY }
  }

  relativeMove (newPosition: PointerPosition) {
    const parent = this.card.$el.parentElement

    if (parent) {
      parent.style.left = (parseFloat(parent.style.left) + (newPosition.x - this.lastPointerPosition.x)) + 'px'
      parent.style.top = (parseFloat(parent.style.top) + (newPosition.y - this.lastPointerPosition.y)) + 'px'
    }
  }

  mouseMove (event: MouseEvent) {
    const newPosition = { x: event.clientX, y: event.clientY }
    this.relativeMove(newPosition)
    this.lastPointerPosition = newPosition
  }

  touchMove (event: TouchEvent) {
    event.preventDefault()
    const newPosition = { x: event.touches[0].clientX, y: event.touches[0].clientY }
    this.relativeMove(newPosition)
    this.lastPointerPosition = newPosition
  }

  convertValueRange (value: number, direction: 'in' | 'out') {
    if (this.valueRange === 'absolute') return value

    let factor = 1
    if (this.valueRange === 'percentage') factor = 255
    if (direction === 'out') factor = 1 / factor

    return Math.round(value * factor * 1000) / 1000
  }
}
</script>

<style lang="scss" scoped>
  @import 'vuetify/src/styles/styles.sass';

  .color-input div {
    margin: 0 2px;
    text-align: center;
  }

  .theme--light .color-input div:not(:first-child) {
    color: rgba(map-get($material-light, 'text-color'), 0.45);
  }

  .theme--dark .color-input div:not(:first-child) {
    color: rgba(map-get($material-dark, 'text-color'), 0.45);
  }

  :deep(.v-text-field__slot input) {
    text-align: center;
  }

  :deep(.v-input--dense .v-input__slot) {
    min-height: 32px !important;
  }
</style>
