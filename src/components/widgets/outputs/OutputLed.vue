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

@Component({})
export default class OutputLed extends Mixins(StateMixin) {
  @Prop({ type: Object, required: true })
  led!: any

  channelLookup: {[key: string]: string} = { r: 'RED', g: 'GREEN', b: 'BLUE', w: 'WHITE' }

  get supportedChannels () {
    return this.led.config.color_order[0]
  }

  get primaryColor () {
    const vals = this.convertTo(this.led.color_data[0])
    const c = new IroColor(vals)
    return c.hexString
  }

  get whiteColor () {
    const vals = this.convertTo(this.led.color_data[0])
    if (!vals.w) return undefined
    const c = new IroColor({ r: vals.w, g: vals.w, b: vals.w })
    return c.hexString
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }

  handleColorChange (value: { channel: string; color: IroColor }) {
    // Will return an update to either the primary or white channel.
    // Gather the existing values..
    const channels = this.supportedChannels.toLowerCase()
    let currentVals = Object.fromEntries(this.led.color_data[0].map((value: number, idx: number) => [channels[idx], value]))
    const newVals = this.convertFrom(value.color.rgb)

    if (value.channel === 'primary') {
      // RGB picker update
      currentVals = { ...currentVals, ...newVals }
    } else {
      // White channel update
      currentVals.w = newVals.r
    }

    this.sendGcode(`SET_LED LED=${this.led.name} ${Object.entries(currentVals).map(([key, val]) => `${this.channelLookup[key]}=${val}`).join(' ')}`)
  }

  convertTo (o: any) {
    const r: any = {}
    const channels = this.supportedChannels.toLowerCase()
    Object.keys(o).forEach((key) => {
      r[channels[key]] = Math.round(o[key] * 255)
    })
    return r
  }

  convertFrom (o: any) {
    const r: any = {}
    Object.keys(o).forEach((key) => {
      r[key] = Number.parseFloat((o[key] / 255).toPrecision(2))
    })
    return r
  }
}
</script>
