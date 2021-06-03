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
        <!-- <g id="handle" stroke-width="2" fill="#fff" stroke="#000">
        <g transform="translate(-2.000000, 0.000000)">
          <path d="M11.5201888,0.98376551 C13.6952297,0.98376551 15.8701457,1.81608292 17.5295957,3.48022772 C19.1901518,5.14549409 20.0201888,7.32814902 20.0201888,9.51067916 C20.0201888,11.5892784 19.2673214,13.6679882 17.7611695,15.299761 L17.529597,15.541119 L16.751934,16.320985 L16.3895078,16.6844379 L15.7908391,17.2848025 L11.5201888,21.5675509 L6.56546871,16.5987948 L6.06410518,16.096011 C4.16105924,14.1875741 3.18084887,11.8968269 3.09234842,9.65314602 C3.00270091,7.38038455 3.8309449,5.16482966 5.5107793,3.48023034 C7.17023192,1.81608292 9.34514792,0.98376551 11.5201888,0.98376551 Z M11.5,6 C10.5335017,6 9.65850169,6.39175084 9.02512627,7.02512627 C8.39175084,7.65850169 8,8.53350169 8,9.5 C8,10.4664983 8.39175084,11.3414983 9.02512627,11.9748737 C9.65850169,12.6082492 10.5335017,13 11.5,13 C12.4664983,13 13.3414983,12.6082492 13.9748737,11.9748737 C14.6082492,11.3414983 15,10.4664983 15,9.5 C15,8.53350169 14.6082492,7.65850169 13.9748737,7.02512627 C13.3414983,6.39175084 12.4664983,6 11.5,6 Z" id="Combined-Shape"></path>
        </g>
      </g> -->
    </defs>
    </svg>
    <!-- / custom handle svg -->
    <div ref="picker"></div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Ref } from 'vue-property-decorator'
import iro from '@jaames/iro'
import { IroColor } from '@irojs/iro-core'
import { ColorPickerProps, IroColorPicker } from '@jaames/iro/dist/ColorPicker'

@Component({
  components: {}
})
export default class AppColorPicker extends Vue {
  @Prop({ type: Object, default: () => ({}) })
  options!: ColorPickerProps

  @Ref('picker') picker!: HTMLElement

  colorPicker: null | IroColorPicker = null
  supportedEvents = [
    'mount',
    'color:init',
    'color:setActive',
    'color:change',
    'color:remove',
    'input:change',
    'input:start',
    'input:move',
    'input:end'
  ]

  mounted () {
    const opts: ColorPickerProps = {
      ...this.options,
      // borderWidth: 1,
      // borderColor: '#000000',
      // handleRadius: 20,
      sliderSize: 14,
      handleSvg: '#handle',
      handleProps: { x: 0, y: 0 }
    }
    this.colorPicker = iro.ColorPicker(this.picker, opts)

    // Bind events.
    this.supportedEvents.forEach((name) => {
      if (this.colorPicker) {
        this.colorPicker.on(name, (color: IroColor) => {
          this.eventHandler(name, color)
        })
      }
    })
  }

  destroy () {
    if (this.colorPicker) {
      this.colorPicker.off(this.supportedEvents, this.eventHandler)
    }
  }

  eventHandler (e: string, c: IroColor) {
    this.$emit(e, c)
  }
}
</script>
