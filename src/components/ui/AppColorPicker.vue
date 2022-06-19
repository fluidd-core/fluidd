<template>
  <v-menu
    ref="menu"
    v-model="menu"
    bottom
    left
    :max-width="260"
    :close-on-content-click="false"
  >
    <template #activator="{ on, attrs }">
      <v-btn
        v-show="!dot"
        v-bind="attrs"
        :color="primaryColor.hexString"
        outlined
        small
        v-on="on"
      >
        {{ title }}
      </v-btn>

      <v-icon
        v-show="dot"
        v-bind="attrs"
        :color="primaryColor.hexString"
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
          :color="primaryColor.hexString"
          large
        >
          $circle
        </v-icon>

        <v-icon
          v-if="supportedChannels.includes('W')"
          :color="whiteColor.hexString"
          large
        >
          $circle
        </v-icon>

        <v-layout
          align-center
          column
        >
          <!-- <pre>{{primaryColor.hexString}}</pre> -->
          <!-- standard full color picker -->
          <app-iro-color-picker
            :color="primaryColor.hexString"
            :options="primaryOptions"
            @color:change="handleColorChange('primary', $event)"
          />

          <!-- white channel color picker -->
          <app-iro-color-picker
            v-if="supportedChannels.includes('W')"
            class="mt-4"
            :color="whiteColor.hexString"
            :options="whiteOptions"
            @color:change="handleColorChange('white', $event)"
          />
        </v-layout>

        <!-- <pre>{{ primaryColor }}</pre>
          <pre v-if="this.white">{{ whiteColor }}</pre> -->
        <v-layout
          class="mt-4"
          justify-space-between
        >
          <div class="color-input">
            <v-text-field
              v-model.number="primaryColor.rgb.r"
              dense
              hide-details
              outlined
            />
            <div>R</div>
          </div>
          <div class="color-input">
            <v-text-field
              v-model.number="primaryColor.rgb.g"
              dense
              hide-details
              outlined
            />
            <div>G</div>
          </div>
          <div class="color-input">
            <v-text-field
              v-model.number="primaryColor.rgb.b"
              dense
              hide-details
              outlined
            />
            <div>B</div>
          </div>
          <div
            v-if="supportedChannels.includes('W')"
            class="color-input"
          >
            <v-text-field
              v-model="whiteColor.rgb.r"
              dense
              hide-details
              outlined
            />
            <div>W</div>
          </div>
        </v-layout>
      </v-card-text>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch, Ref } from 'vue-property-decorator'
import { Debounce } from 'vue-debounce-decorator'
import iro from '@jaames/iro'
import { IroColor } from '@irojs/iro-core'

interface RgbwColor {
    r: number;
    g: number;
    b: number;
}

interface AppColor {
  hexString: string;
  rgb: RgbwColor;
}

interface PointerPosition {
  x: number;
  y: number;
}

@Component({
  components: {}
})
export default class AppColorPicker extends Vue {
  // Expected color input. Can be a hex, rgbw etc.
  @Prop({ type: String, required: true })
  primary!: string

  @Prop({ type: String, required: false })
  white!: string

  @Prop({ type: String, default: '' })
  title!: string

  @Prop({ type: Boolean, default: false })
  dot!: boolean

  @Prop({ type: String, default: 'RGB' })
  supportedChannels!: string

  menu = false

  @Ref('card')
  card!: Vue

  lastPointerPosition: PointerPosition = { x: 0, y: 0 }

  primaryColor: AppColor = {
    hexString: '#ffffff',
    rgb: { r: 255, g: 255, b: 255 }
  }

  whiteColor: AppColor = {
    hexString: '#ffffff',
    rgb: { r: 255, g: 255, b: 255 }
  }

  primaryOptions = {
    color: this.primaryColor,
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

  whiteOptions = {
    color: this.whiteColor,
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

  @Watch('primaryColor', { deep: true })
  onPrimaryColorChange (value: AppColor) {
    // Update the hex to reflect changes. This covers off users adjusting
    // the rgb values independently.
    const c = new IroColor(value.rgb)
    if (c.hexString !== value.hexString) this.primaryColor.hexString = c.hexString
  }

  @Watch('whiteColor', { deep: true })
  onWhiteColorChange (value: AppColor) {
    // Update the hex to reflect changes. This covers off users adjusting
    // the rgb values independently.
    const c = new IroColor({ r: value.rgb.r, g: value.rgb.r, b: value.rgb.r })
    if (c.hexString !== value.hexString) this.whiteColor.hexString = c.hexString
  }

  @Watch('primary')
  onPrimaryChange (value: string) {
    if (value) {
      this.primaryColor = this.getColor(value)
    }
  }

  @Watch('white')
  onWhiteChange (value: string) {
    if (value) {
      this.whiteColor = this.getColor(value)
    }
  }

  created () {
    this.primaryColor = this.getColor(this.primary)
    if (this.supportedChannels.includes('W')) this.whiteColor = this.getColor(this.white)
  }

  getColor (color: string) {
    const base = new iro.Color(color)
    return {
      hexString: base.hexString,
      rgb: {
        r: base.rgb.r,
        g: base.rgb.g,
        b: base.rgb.b
      }
    }
  }

  handleColorChange (channel: string, color: IroColor) {
    const c = this.getColor(color.hexString)
    if (channel === 'primary') {
      this.primaryColor = c
    } else {
      this.whiteColor = c
    }

    this.$emit(`update:${channel}`, color)
    this.debouncedChange(channel, color)
  }

  @Debounce(500)
  debouncedChange (channel: string, color: IroColor) {
    this.$emit('change', { channel, color })
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
    const parent = this.card.$el.parentElement as HTMLElement

    parent.style.left = (parseFloat(parent.style.left) + (newPosition.x - this.lastPointerPosition.x)) + 'px'
    parent.style.top = (parseFloat(parent.style.top) + (newPosition.y - this.lastPointerPosition.y)) + 'px'
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
}
</script>

<style lang="scss" scoped>
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

  ::v-deep .v-text-field__slot input {
    text-align: center;
  }

  ::v-deep .v-input--dense .v-input__slot {
    min-height: 32px !important;
  }
</style>
