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
        :class="iconClass"
        :color="controlColor"
        :disabled="disabled"
        :small="small"
        v-on="on"
      >
        {{ icon }}
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
          <app-btn-toggle
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
          </app-btn-toggle>
        </div>

        <v-layout
          class="mt-2"
          justify-space-between
        >
          <div
            v-for="channel in visibleChannels"
            :key="channel"
            class="color-input"
          >
            <v-text-field
              :value="channelText[channel] ?? channelValue(channel)"
              dense
              hide-details
              outlined
              persistent-placeholder
              @input="onChannelInput(channel, $event)"
              @blur="handleReset"
              @keyup.enter.exact="onChannelSubmit(channel)"
            />
            <div>{{ channelLabel(channel) }}</div>
          </div>
        </v-layout>
      </v-card-text>
      <v-card-actions
        v-if="resettable"
        class="pt-0"
      >
        <v-spacer />
        <app-btn
          small
          color="primary"
          text
          @click="$emit('reset')"
        >
          {{ $t('app.general.btn.reset_to_default') }}
        </app-btn>
      </v-card-actions>
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

const colorChannels = ['red', 'green', 'blue', 'white'] as const

type ColorChannel = typeof colorChannels[number]

const numericValueRegExp = /^(?:\d+(?:\.\d*)?|\.\d+)$/

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

  @Prop({ type: String, default: '$circle' })
  readonly icon!: string

  @Prop({ type: [String, Object, Array], default: undefined })
  readonly iconClass?: string | Record<string, boolean> | unknown[]

  @Prop({ type: Boolean })
  readonly small?: boolean

  @Prop({ type: Boolean })
  readonly resettable?: boolean

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

  channelText: Record<ColorChannel, string | null> = {
    red: null,
    green: null,
    blue: null,
    white: null
  }

  @Watch('value')
  onValue (value: string) {
    this.currentPrimaryColor.set(value)
    this.clearChannelText()
  }

  @Watch('white')
  onWhite (value: number) {
    this.currentWhiteColor.set(this.valueToHexColor(value))
    this.clearChannelText()
  }

  get visibleChannels (): ColorChannel[] {
    const hasPrimary = this.supportedChannels !== 'W'
    const hasWhite = this.supportedChannels.includes('W')

    return colorChannels.filter(channel => channel === 'white' ? hasWhite : hasPrimary)
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
    return this.$typedState.config.uiSettings.general.colorPickerValueRange
  }

  set valueRange (value: ColorPickerValueRange) {
    this.$typedDispatch('config/saveByPath', {
      path: 'uiSettings.general.colorPickerValueRange',
      value,
      server: true
    })
  }

  handleSubmitPrimary () {
    this.inputPrimaryColor = this.currentPrimaryColor.hexString
    this.clearChannelText()
  }

  handleSubmitWhite () {
    this.inputWhiteValue = this.currentWhiteColor.red
    this.clearChannelText()
  }

  handleReset () {
    this.currentPrimaryColor.set(this.inputPrimaryColor)
    this.currentWhiteColor.set(this.inputWhiteColor)
    this.clearChannelText()
  }

  clearChannelText () {
    for (const channel of colorChannels) {
      this.channelText[channel] = null
    }
  }

  channelLabel (channel: ColorChannel): string {
    return channel.charAt(0).toUpperCase()
  }

  channelValue (channel: ColorChannel): number {
    const value = channel === 'white'
      ? this.currentWhiteColor.red
      : this.currentPrimaryColor[channel]

    return this.convertValueRange(value, 'out')
  }

  onChannelSubmit (channel: ColorChannel) {
    if (channel === 'white') {
      this.handleSubmitWhite()
    } else {
      this.handleSubmitPrimary()
    }
  }

  onChannelInput (channel: ColorChannel, value: string) {
    this.channelText[channel] = value

    if (!numericValueRegExp.test(value)) {
      return
    }

    const parsedValue = Math.min(Math.max(this.convertValueRange(Number(value), 'in'), 0), 255)

    if (channel === 'white') {
      this.currentWhiteColor.set(this.valueToHexColor(parsedValue))
    } else {
      this.currentPrimaryColor[channel] = parsedValue
    }
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
