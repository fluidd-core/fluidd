<template>
  <div
    class="ov-stage"
    data-tid="overview-stage"
  >
    <printer-stage
      class="ov-stage__m1"
      :state="busy ? 'printing' : 'idle'"
    />
    <span
      v-if="badge"
      class="ov-stage__badge"
    >
      <span
        v-if="badgeDot"
        class="ov-stage__dot"
        :style="{ background: badgeDot }"
      />
      {{ badge }}
    </span>
    <div
      v-if="chips.length"
      class="ov-stage__chips"
    >
      <span
        v-for="chip in chips"
        :key="chip"
        class="ov-stage__chip"
      >{{ chip }}</span>
    </div>
    <div
      v-if="busy && jobThumbnail"
      class="ov-stage__part"
    >
      <img
        :src="jobThumbnail"
        alt=""
      >
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import PrinterStage from '@/components/printers/PrinterStage.vue'

/**
 * The whole M1, on the light stage, with what can be seen at a glance:
 * printing, the layer and the part's picture; idle, the material and
 * whether it is homed.
 */
@Component({ components: { PrinterStage } })
export default class OverviewStage extends Mixins(OverviewMixin) {
  get badge (): string | null {
    if (this.busy) {
      if (this.printerPaused) return 'Paused'
      return this.layer && this.layers ? `Live · layer ${this.layer} of ${this.layers}` : 'Printing'
    }
    return this.material ? `${this.material.name} heat set` : null
  }

  get badgeDot (): string | null {
    if (this.busy) return null
    return this.material ? 'var(--m3d-warning)' : null
  }

  get chips (): string[] {
    if (this.busy || !this.klippyReady) return []
    return this.isHomed('XYZ') ? [] : ['Not homed']
  }
}
</script>

<style lang="scss" scoped>
  .ov-stage {
    position: relative;
    display: flex;
    min-height: 300px;
  }

  .ov-stage__m1 {
    flex: 1 1 auto;
    min-height: 100%;
  }

  .ov-stage__badge {
    position: absolute;
    top: 14px;
    left: 14px;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgb(255 255 255 / 92%);
    color: #1c1c1e;
    font-size: 12px;
    font-weight: 500;
  }

  .ov-stage__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .ov-stage__chips {
    position: absolute;
    right: 14px;
    bottom: 14px;
    display: flex;
    gap: 6px;
  }

  .ov-stage__chip {
    padding: 4px 10px;
    border-radius: 999px;
    background: rgb(255 255 255 / 92%);
    color: #1c1c1e;
    font-size: 12px;
    font-weight: 500;
  }

  .ov-stage__part {
    position: absolute;
    right: 14px;
    bottom: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32%;
    max-width: 190px;
    aspect-ratio: 1;
    border-radius: 16px;
    background: radial-gradient(90% 80% at 50% 45%, #1d2a2a 0%, #121516 75%);

    img {
      width: 86%;
      height: 86%;
      object-fit: contain;
    }
  }
</style>
