<template>
  <img
    v-if="customImage"
    :src="customImage"
    :class="svgClass"
    :style="svgStyle"
  >
  <svg
    v-else-if="Array.isArray(customIcon)"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 56 56"
    :class="svgClass"
    :style="svgStyle"
  >
    <path
      v-for="(p, i) in customIcon"
      :key="i"
      :fill="color || p.fill || 'currentColor'"
      :d="p.d"
    />
  </svg>
  <span
    v-else-if="isCustomIconDataUrl && color"
    :class="svgClass"
    :style="maskedSvgStyle"
  />
  <img
    v-else-if="isCustomIconDataUrl"
    :src="customIcon"
    :class="svgClass"
    :style="svgStyle"
  >
  <svg
    v-else-if="customIcon"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    :class="svgClass"
    :style="svgStyle"
  >
    <path
      :fill="color || 'currentColor'"
      :d="customIcon"
    />
  </svg>
  <v-icon
    v-else
    :small="small"
    :color="color"
    :class="iconClass"
  >
    {{ icon }}
  </v-icon>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import type { SvgIconPath } from '@/store/config/types'

@Component({})
export default class AppNavLinkIcon extends Vue {
  @Prop({ type: String })
  readonly icon?: string

  @Prop({ type: [String, Array] })
  readonly customIcon?: string | SvgIconPath[]

  @Prop({ type: String })
  readonly customImage?: string

  @Prop({ type: String })
  readonly color?: string

  @Prop({ type: Boolean, default: false })
  readonly small!: boolean

  get isCustomIconDataUrl (): boolean {
    return typeof this.customIcon === 'string' && this.customIcon.startsWith('data:')
  }

  get svgClass (): string {
    return this.small ? 'v-icon v-icon--dense' : 'v-icon__svg'
  }

  get svgStyle (): string {
    const size = this.small ? '16px' : '24px'
    return `width: ${size}; height: ${size};`
  }

  get maskedSvgStyle (): string {
    const size = this.small ? '16px' : '24px'
    return `
      display: inline-block;
      width: ${size};
      height: ${size};
      background-color: ${this.color};
      mask-image: url(${this.customIcon});
      mask-size: contain;
      mask-repeat: no-repeat;
      mask-position: center;
      -webkit-mask-image: url(${this.customIcon});
      -webkit-mask-size: contain;
      -webkit-mask-repeat: no-repeat;
      -webkit-mask-position: center;
    `.replace(/\s+/g, ' ').trim()
  }

  get iconClass (): string | undefined {
    return this.small ? 'mr-2' : undefined
  }
}
</script>
