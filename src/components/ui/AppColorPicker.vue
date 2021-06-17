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
          :color="primaryColor.hexString"
          outlined
          small
        >
          {{ title }}
        </v-btn>

        <v-icon
          v-else
          v-bind="attrs"
          v-on="on"
          :color="primaryColor.hexString"
        >
          $circle
        </v-icon>

      </template>
      <v-card>
        <v-card-text>

          <v-icon
            :color="primaryColor.hexString"
            large
          >
            $circle
          </v-icon>

          <v-icon
            v-if="this.white"
            :color="whiteColor.hexString"
            large
          >
            $circle
          </v-icon>

          <v-layout align-center column>
            <!-- <pre>{{primaryColor.hexString}}</pre> -->
            <!-- standard full color picker -->
            <app-iro-color-picker
              v-if="primaryColor"
              :color="primaryColor.hexString"
              :options="primaryOptions"
              @color:change="handleColorChange('primary', $event)"
            >
            </app-iro-color-picker>

            <!-- white channel color picker -->
            <app-iro-color-picker
              v-if="this.white"
              class="mt-4"
              :color="whiteColor.hexString"
              :options="whiteOptions"
              @color:change="handleColorChange('white', $event)"
            >
            </app-iro-color-picker>
          </v-layout>

          <!-- <pre>{{ primaryColor }}</pre>
          <pre v-if="this.white">{{ whiteColor }}</pre> -->
          <v-layout class="mt-4" justify-space-between>
            <div class="color-input">
              <v-text-field
                dense
                hide-details
                v-model.number="primaryColor.rgb.r"
                outlined
              ></v-text-field>
              <div>R</div>
            </div>
            <div class="color-input">
              <v-text-field
                dense
                hide-details
                v-model.number="primaryColor.rgb.g"
                outlined
              ></v-text-field>
              <div>G</div>
            </div>
            <div class="color-input">
              <v-text-field
                dense
                hide-details
                v-model.number="primaryColor.rgb.b"
                outlined
              ></v-text-field>
              <div>B</div>
            </div>
            <div v-if="this.white" class="color-input">
              <v-text-field
                dense
                hide-details
                v-model="whiteColor.rgb.r"
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

  menu = false

  primaryColor: AppColor = {
    hexString: '#ffffff',
    rgb: { r: 255, g: 255, b: 255 }
  }

  whiteColor: AppColor = {
    hexString: '#ffffff',
    rgb: { r: 255, g: 255, b: 255 }
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

  created () {
    this.primaryColor = this.getColor(this.primary)
    if (this.whiteColor) this.whiteColor = this.getColor(this.white)
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

  // apply () {
  //   // Set the initial color to the hex value of our set color.
  //   const c = new iro.Color(this.value)
  //   this.colors.standard = {
  //     hexString: c.hexString,
  //     rgb: c.rgb
  //   }

  //   // If we have a white channel, set our white channel.
  //   if (this.pickerType === 'rgbw') {
  //     const value = this.value as RgbwColor
  //     const b = new iro.Color({ r: value.w, g: value.w, b: value.w })
  //     this.colors.white = {
  //       hexString: b.hexString,
  //       rgb: b.rgb
  //     }
  //   }
  // }

  // handleColorChange (channel: string, e: IroColor) {
  //   // console.log('got change', channel, e)
  //   this.colors[channel] = {
  //     hexString: e.hexString,
  //     rgb: e.rgb
  //   }

  //   // If we have a white channel, emit with it included.
  //   const r = this.colors.standard
  //   if (this.pickerType === 'rgbw') {
  //     r.rgb.w = this.colors.white.rgb.r
  //   }
  //   this.$emit('input', r)
  //   this.debouncedChange(r)
  // }

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
