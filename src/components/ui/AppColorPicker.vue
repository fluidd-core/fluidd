<template>
  <v-menu
      v-model="menu"
      ref="menu"
      bottom
      left
      :max-width="260"
      :close-on-content-click="false"
    >
      <template v-slot:activator="{ on, attrs }">
        <v-btn
          v-if="!dot"
          v-bind="attrs"
          v-on="on"
          :color="colors.standard.hexString"
          outlined
          small
        >
          {{ title }}
        </v-btn>
        <v-icon
          v-else
          v-bind="attrs"
          v-on="on"
          :color="colors.standard.hexString"
        >
          $circle
        </v-icon>

      </template>
      <v-card>
        <v-card-text>

          <!-- <pre>{{ colors }}</pre> -->

          <v-icon
            :color="colors.standard.hexString"
            large
          >
            $circle
          </v-icon>

          <v-icon
            v-if="pickerType === 'rgbw'"
            :color="colors.white.hexString"
            large
          >
            $circle
          </v-icon>

          <v-layout align-center column>
            <!-- standard full color picker -->
            <app-iro-color-picker
              @color:change="handleColorChange('standard', $event)"
              :options="pickerOptions.standard"
            >
            </app-iro-color-picker>

            <!-- white channel color picker -->
            <app-iro-color-picker
              v-if="pickerType === 'rgbw' || pickerType === 'rgb'"
              class="mt-4"
              @color:change="handleColorChange('white', $event)"
              :options="pickerOptions.white"
            >
            </app-iro-color-picker>
          </v-layout>

          <v-layout class="mt-4" justify-space-between>
            <div class="color-input">
              <v-text-field
                dense
                hide-details
                v-model="colors.standard.rgb.r"
                outlined
              ></v-text-field>
              <div>R</div>
            </div>
            <div class="color-input">
              <v-text-field
                dense
                hide-details
                v-model="colors.standard.rgb.g"
                outlined
              ></v-text-field>
              <div>G</div>
            </div>
            <div class="color-input">
              <v-text-field
                dense
                hide-details
                v-model="colors.standard.rgb.b"
                outlined
              ></v-text-field>
              <div>B</div>
            </div>
            <div v-if="pickerType === 'rgbw' || pickerType === 'rgb'" class="color-input">
              <v-text-field
                dense
                hide-details
                v-model="colors.white.rgb.r"
                outlined
              ></v-text-field>
              <div>W</div>
            </div>
          </v-layout>
        </v-card-text>
      </v-card>
  </v-menu>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import { Debounce } from 'vue-debounce-decorator'
import iro from '@jaames/iro'
import { IroColor, IroColorValue } from '@irojs/iro-core'

interface RgbwColor {
    r: number;
    g: number;
    b: number;
    w: number;
}

@Component({
  components: {}
})
export default class AppColorPicker extends Vue {
  @Prop({ type: [String, Object], required: true })
  value!: IroColorValue | RgbwColor

  @Prop({ type: String, default: '' })
  title!: string

  @Prop({ type: Boolean, default: false })
  dot!: boolean

  menu = false

  colors: { [index: string]: any } = {
    standard: {
      rgb: {},
      hexString: ''
    },
    white: {
      rgb: {},
      rgbw: {},
      hexString: ''
    }
  }

  get pickerOptions (): any {
    const opts = {
      width: 208
    }
    return {
      standard: {
        ...opts,
        color: this.colors.standard.rgb,
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
      },
      white: {
        ...opts,
        color: this.colors.white.rgb,
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
  }

  // If the value is a string, assume a single color picker.
  // If the value is rgb, assume a single color picker.
  // If the value is rgbw, assume it has a white channel.
  get pickerType () {
    if (
      Object.keys(this.value).includes('w') ||
      Object.keys(this.value).includes('W')
    ) {
      return 'rgbw'
    }
    return 'standard'
  }

  @Watch('value')
  onValue () {
    this.apply()
  }

  created () {
    this.apply()
  }

  apply () {
    // Set the initial color to the hex value of our set color.
    const c = new iro.Color(this.value)
    this.colors.standard = {
      hexString: c.hexString,
      rgb: c.rgb
    }

    // If we have a white channel, set our white channel.
    if (this.pickerType === 'rgbw') {
      const value = this.value as RgbwColor
      const b = new iro.Color({ r: value.w, g: value.w, b: value.w })
      this.colors.white = {
        hexString: b.hexString,
        rgb: b.rgb
      }
    }
  }

  handleColorChange (channel: string, e: IroColor) {
    // console.log('got change', channel, e)
    this.colors[channel] = {
      hexString: e.hexString,
      rgb: e.rgb
    }

    // If we have a white channel, emit with it included.
    const r = this.colors.standard
    if (this.pickerType === 'rgbw') {
      r.rgb.w = this.colors.white.rgb.r
    }
    this.$emit('input', r)
    this.debouncedChange(r)
  }

  @Debounce(500)
  debouncedChange (e: IroColor) {
    this.$emit('change', e)
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
