<template>
  <v-row
    no-gutters
    justify-space-between
  >
    <v-col
      align-self="center"
      cols="5"
      class="text-body-1 py-0"
      :class="{ 'text--disabled': !klippyReady }"
    >
      {{ led.prettyName }}
    </v-col>
    <v-col class="ml-auto py-0 text-right">
      <app-color-picker
        v-model="primaryColor"
        :white.sync="whiteValue"
        :title="led.prettyName"
        :supported-channels="supportedChannels"
        :disabled="!klippyReady"
        dot
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import { IroColor } from '@irojs/iro-core'
import StateMixin from '@/mixins/state'
import type { Led } from '@/store/printer/types'

type Rgbw = {
  r: number,
  g: number,
  b: number,
  w: number
}

@Component({})
export default class OutputLed extends Mixins(StateMixin) {
  @Prop({ type: Object, required: true })
  readonly led!: Led

  channelLookup: Record<keyof Rgbw, string> = {
    r: 'RED',
    g: 'GREEN',
    b: 'BLUE',
    w: 'WHITE'
  }

  get supportedChannels (): string {
    const { type, config } = this.led

    if ('color_order' in config) {
      return config.color_order[0]
    }

    switch (type) {
      case 'dotstar':
        return 'RGB'

      case 'led': {
        const channels = []

        if ('red_pin' in config) channels.push('R')
        if ('green_pin' in config) channels.push('G')
        if ('blue_pin' in config) channels.push('B')
        if ('white_pin' in config) channels.push('W')

        return channels.join('')
      }
    }

    return 'RBGW'
  }

  get color (): Rgbw {
    const [r, g, b, w] = this.led.color_data[0]
      .map(value => Math.round(value * 255))

    return {
      r,
      g,
      b,
      w
    }
  }

  get primaryColor (): string {
    const color = new IroColor(this.color)

    return color.hexString
  }

  set primaryColor (value: string) {
    const { r, g, b } = new IroColor(value).rgb

    const newColor: Rgbw = {
      ...this.color,
      r,
      g,
      b
    }

    this.sendColor(newColor)
  }

  get whiteValue () {
    return this.color.w
  }

  set whiteValue (value: number) {
    const newColor: Rgbw = {
      ...this.color,
      w: value
    }

    this.sendColor(newColor)
  }

  sendColor (color: Rgbw) {
    const supportedChannels = this.supportedChannels.toLowerCase().split('') as (keyof Rgbw)[]

    const colorsString = supportedChannels
      .map(channel => ` ${this.channelLookup[channel]}=${Math.round(color[channel] * 1000 / 255) / 1000}`)
      .join('')

    this.sendGcode(`SET_LED LED=${this.led.name}${colorsString}`)
  }
}
</script>
