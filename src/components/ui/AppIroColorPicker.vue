<template>
  <div>
    <div ref="picker" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref, Watch, VModel } from 'vue-property-decorator'
import iro from '@jaames/iro'
import { IroColor } from '@irojs/iro-core'
import type { ColorPickerProps, IroColorPicker } from '@jaames/iro/dist/ColorPicker'

@Component({})
export default class AppColorPicker extends Vue {
  @VModel({ type: String, default: '#ffffff' })
    inputValue!: string

  @Prop({ type: Object })
  readonly options?: Partial<ColorPickerProps>

  @Ref('picker')
  readonly picker!: HTMLElement

  colorPicker: IroColorPicker | null = null

  @Watch('value')
  onValue (value: string) {
    if (value && this.colorPicker) {
      this.colorPicker.color.set(value)
    }
  }

  mounted () {
    const options: Partial<ColorPickerProps> = {
      ...this.options,
      color: this.inputValue,
      sliderSize: 14
    }

    this.colorPicker = iro.ColorPicker(this.picker, options)

    this.colorPicker.on('input:end', this.handleColorChange)
  }

  beforeUnmount () {
    if (this.colorPicker) {
      this.colorPicker.off('input:end', this.handleColorChange)
    }
  }

  handleColorChange (color: IroColor) {
    this.inputValue = color.hexString
  }
}
</script>
