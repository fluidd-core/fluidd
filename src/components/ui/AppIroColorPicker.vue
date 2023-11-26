<template>
  <div>
    <div ref="picker" />
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref, Watch } from 'vue-property-decorator'
import iro from '@jaames/iro'
import { IroColor } from '@irojs/iro-core'
import type { ColorPickerProps, IroColorPicker } from '@jaames/iro/dist/ColorPicker'

@Component({
  components: {}
})
export default class AppColorPicker extends Vue {
  @Prop({ type: [Object, String], default: '#ffffff' })
  readonly color!: IroColor

  @Prop({ type: Object, default: () => {} })
  readonly options!: ColorPickerProps

  @Ref('picker')
  readonly picker!: HTMLElement

  colorPicker: null | IroColorPicker = null
  supportedEvents = [
    'mount',
    'color:init',
    // 'color:setActive',
    'color:change'
    // 'color:remove',
    // 'input:change',
    // 'input:start',
    // 'input:move',
    // 'input:end'
  ]

  @Watch('color', { deep: true })
  onColorChange (value: string) {
    if (this.colorPicker) this.colorPicker.color.hexString = value
  }

  get opts () {
    const opts: ColorPickerProps = {
      ...this.options,
      color: this.color,
      sliderSize: 14
    }
    return opts
  }

  mounted () {
    // Create the picker
    this.colorPicker = iro.ColorPicker(this.picker, this.opts)

    // Bind events.
    this.supportedEvents.forEach((name) => {
      if (this.colorPicker) {
        this.colorPicker.on(name, (color: IroColor) => {
          this.eventHandler(name, color)
        })
      }
    })
  }

  beforeUnmount () {
    if (this.colorPicker) {
      this.colorPicker.off(this.supportedEvents, this.eventHandler)
    }
  }

  handleColorChange (color: IroColor) {
    // console.log('emitting', color, changes)
    this.$emit('change', color)
    this.$emit('update:color', color)
  }

  eventHandler (e: string, c: IroColor) {
    this.$emit(e, c)
  }
}
</script>
