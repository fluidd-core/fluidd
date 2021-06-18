<template>
  <div>
    <!-- custom handle svg -->
    <svg style="display:none;">
      <defs>
        <g id="handle" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <g id="Desktop" transform="translate(-497.000000, -493.000000)">
                <g id="Group-2" transform="translate(498.000000, 494.000000)">
                    <g id="Group" stroke="#000000" stroke-width="2">
                        <circle id="Oval" cx="7.5" cy="7.5" r="7.5"></circle>
                    </g>
                    <path d="M7.5,14 C3.91014913,14 1,11.0898509 1,7.5 C1,3.91014913 3.91014913,1 7.5,1 C11.0898509,1 14,3.91014913 14,7.5 C14,11.0898509 11.0898509,14 7.5,14 Z M7.5,12 C9.98528137,12 12,9.98528137 12,7.5 C12,5.01471863 9.98528137,3 7.5,3 C5.01471863,3 3,5.01471863 3,7.5 C3,9.98528137 5.01471863,12 7.5,12 Z" id="Combined-Shape" fill="#D8D8D8"></path>
                </g>
            </g>
        </g>
    </defs>
    </svg>
    <!-- / custom handle svg -->
    <div ref="picker"></div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref, Watch } from 'vue-property-decorator'
import iro from '@jaames/iro'
import { IroColor } from '@irojs/iro-core'
import { ColorPickerProps, IroColorPicker } from '@jaames/iro/dist/ColorPicker'

@Component({
  components: {}
})
export default class AppColorPicker extends Vue {
  @Prop({ type: [Object, String], default: '#ffffff' })
  color!: IroColor;

  @Prop({ type: Object, default: () => ({}) })
  options!: ColorPickerProps

  @Ref('picker') picker!: HTMLElement

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
      // borderWidth: 1,
      // borderColor: '#000000',
      // handleRadius: 20,
      sliderSize: 14,
      handleSvg: '#handle',
      handleProps: { x: 0, y: 0 }
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
