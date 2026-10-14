<template>
  <div
    class="printer-stage"
    :class="{ 'printer-stage--off': state === 'offline' }"
    :style="height ? { height: `${height}px` } : undefined"
  >
    <img
      :src="src"
      alt=""
      loading="lazy"
      class="printer-stage__m1"
    >
    <slot />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import idle from '@/assets/m1/m1-idle.jpg'
import printing from '@/assets/m1/m1-printing.jpg'
import offline from '@/assets/m1/m1-offline.jpg'
import type { ThumbState } from '@/components/ui/PrinterThumb.vue'

/**
 * The whole M1 on the light stage the app shows it on, never cropped:
 * idle, printing (a part on the plate) or offline (dimmed).
 */
@Component({})
export default class PrinterStage extends Vue {
  @Prop({ type: String, default: 'idle' })
  readonly state!: ThumbState

  @Prop({ type: Number })
  readonly height?: number

  get src (): string {
    if (this.state === 'printing') return printing
    if (this.state === 'offline') return offline
    return idle
  }
}
</script>

<style lang="scss" scoped>
  .printer-stage {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 18px;
    /* The product shot is on white and multiplied in, so its stage stays light in either theme; the live M1 draws its own. */
    background: radial-gradient(120% 90% at 50% 40%, #eceef0 0%, #d8dbdf 62%, #c4c8cd 100%);
  }

  .printer-stage--off {
    background: radial-gradient(120% 90% at 50% 40%, #d9d9dd 0%, #bdbdc3 70%, #a8a8af 100%);
  }

  .printer-stage__m1 {
    display: block;
    max-width: 92%;
    max-height: 92%;
    object-fit: contain;
    mix-blend-mode: multiply;
  }
</style>
