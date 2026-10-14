<template>
  <span
    class="printer-thumb"
    :class="{ 'printer-thumb--off': state === 'offline' }"
    :style="{ width: `${size}px`, height: `${size}px`, borderRadius: `${Math.round(size * 0.28)}px` }"
  >
    <img
      :src="src"
      alt=""
      :width="size"
      :height="size"
    >
  </span>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import idle from '@/assets/m1/m1-idle-thumb.jpg'
import printing from '@/assets/m1/m1-printing-thumb.jpg'
import offline from '@/assets/m1/m1-offline-thumb.jpg'

export type ThumbState = 'idle' | 'printing' | 'offline'

/** The M1, small, on the light stage the app shows it on: printing, idle or offline. */
@Component({})
export default class PrinterThumb extends Vue {
  @Prop({ type: Number, default: 40 })
  readonly size!: number

  @Prop({ type: String, default: 'idle' })
  readonly state!: ThumbState

  get src (): string {
    if (this.state === 'printing') return printing
    if (this.state === 'offline') return offline
    return idle
  }
}
</script>

<style lang="scss" scoped>
  .printer-thumb {
    display: inline-flex;
    flex: none;
    overflow: hidden;
    background: radial-gradient(120% 90% at 50% 40%, #fbfbfc 0%, #e4e4e8 62%, #cfcfd4 100%);

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
      mix-blend-mode: multiply;
    }
  }

  .printer-thumb--off {
    background: radial-gradient(120% 90% at 50% 40%, #d9d9dd 0%, #bdbdc3 70%, #a8a8af 100%);
  }
</style>
