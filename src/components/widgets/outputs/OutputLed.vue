<template>
  <v-row
    no-gutters
    justify-space-between
  >
    <v-col
      align-self="center"
      cols="5"
      class="text-body-1 dim--text py-0"
    >
      {{ led.prettyName }}
    </v-col>
    <v-col class="ml-auto py-0 text-right">
        <app-color-picker
          :value="value"
          @change="handleColorChange"
          dot
        >
        </app-color-picker>
    </v-col>
  </v-row>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class OutputLed extends Mixins(StateMixin) {
  @Prop({ type: Object, required: true })
  led!: any

  get value () {
    const vals = this.convertTo(this.led.color_data[0])
    return vals
  }

  get isMobile () {
    return this.$vuetify.breakpoint.mobile
  }

  handleColorChange (val: any) {
    const map: { [index: string]: string } = { r: 'RED', g: 'GREEN', b: 'BLUE', w: 'WHITE' }
    const rgb = this.convertFrom(val.rgb)
    let s = `SET_LED LED=${this.led.name}`
    Object.keys(rgb).forEach((key) => {
      s += ` ${map[key]}=${rgb[key]}`
    })
    this.sendGcode(s)
  }

  convertTo (o: any) {
    const r: any = {}
    Object.keys(o).forEach((key) => {
      r[key.toLowerCase()] = Math.round(o[key] * 255)
    })
    return r
  }

  convertFrom (o: any) {
    const r: any = {}
    Object.keys(o).forEach((key) => {
      r[key.toLowerCase()] = Number.parseFloat((o[key] / 255).toPrecision(2))
    })
    return r
  }
}
</script>
