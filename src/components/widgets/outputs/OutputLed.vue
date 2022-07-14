<template>
  <v-row
    no-gutters
    justify-space-between
  >
    <v-col
      align-self="center"
      cols="5"
      class="text-body-1 py-0"
    >
      {{ led.prettyName }}
    </v-col>
    <v-col class="ml-auto py-0 text-right">
      <app-color-picker
        :primary="primaryColor"
        :white="whiteColor"
        :title="led.prettyName"
        :supported-channels="supportedChannels"
        dot
        @change="handleColorChange"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import { IroColor } from '@irojs/iro-core'
import StateMixin from '@/mixins/state'
import { Led } from '@/store/printer/types'

type Channel = 'r' | 'g' | 'b' | 'w'

@Component({})
export default class OutputLed extends Mixins(StateMixin) {
  @Prop({ type: Object, required: true })
  public led!: Led

  channelLookup: Record<Channel, string> = { r: 'RED', g: 'GREEN', b: 'BLUE', w: 'WHITE' }

  get supportedChannels (): string {
    const { type, config } = this.led

    if ('color_order' in config) {
      return config.color_order[0]
    }

    switch (type) {
      case 'dotstar':
        return 'RGB'

      case 'led':
      {
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

  get currentColor () {
    return this.convertFromNumberArray(this.led.color_data[0])
  }

  get primaryColor () {
    const color = new IroColor(this.currentColor)

    return color.hexString
  }

  get whiteColor () {
    if (!this.supportedChannels.includes('W')) {
      return undefined
    }

    const currentColor = this.currentColor
    const color = new IroColor({
      r: currentColor.w,
      g: currentColor.w,
      b: currentColor.w
    })

    return color.hexString
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }

  handleColorChange (value: { channel: string; color: IroColor }) {
    const selectedColor = value.color.rgb

    const newColor: Record<Channel, number> = {
      ...this.currentColor,
      ...(value.channel === 'primary' ? selectedColor : { w: selectedColor.r })
    }

    const supportedChannels = this.supportedChannels.toLowerCase().split('') as Channel[]
    const colorsString = supportedChannels.map(channel => `${this.channelLookup[channel]}=${Math.round(newColor[channel] * 1000 / 255) / 1000}`).join(' ')

    this.sendGcode(`SET_LED LED=${this.led.name} ${colorsString}`)
  }

  convertFromNumberArray (colorData: number[]) : Record<Channel, number> {
    const [r, g, b, w] = colorData.map(value => value * 255)

    return {
      r,
      g,
      b,
      w
    }
  }
}
</script>
