<template>
  <g id="parts">
    <g
      v-for="name in parts"
      :key="name"
      :class="iconClasses(name)"
      class="layer"
    >
      <path
        class="partOutline"
        :d="partSVG(name)"
        :shape-rendering="shapeRendering"
      />
      <svg
        width="7"
        height="7"
        viewBox="0 0 24 24"
        class="partIcon"
        :x="partPos(name).x - 7/2"
        :y="partPos(name).y - 7/2"
      >
        <path :d="iconCancelled" />
        <path
          v-if="!isPartExcluded(name)"
          :d="iconCircle"
          class="hitarea"
          @click="$emit('cancel', name)"
          @touchstart="handleTouchStart(name)"
          @touchend="handleTouchEnd(name)"
          @touchcancel="touchedElement = undefined"
          @touchmove="handleTouchMove"
        />
      </svg>
    </g>
  </g>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Icons } from '@/globals'

@Component({})
export default class ExcludeObjects extends Mixins(StateMixin) {
  @Prop({ type: String })
  readonly shapeRendering?: string

  touchedElement?: string
  lastTouchPosition?: [number, number]
  touchMoveDistance = 0

  handleTouchStart (name: string) {
    this.lastTouchPosition = undefined
    this.touchMoveDistance = 0
    this.touchedElement = name
  }

  handleTouchEnd (name: string) {
    this.lastTouchPosition = undefined
    if (this.touchMoveDistance * window.devicePixelRatio > 25) {
      // assume view was moved intentionally
      this.touchedElement = undefined
      return
    }

    if (this.touchedElement === name) this.$emit('cancel', name)
    this.touchedElement = undefined
  }

  handleTouchMove (ev: TouchEvent) {
    const [touch] = ev.changedTouches
    if (this.lastTouchPosition) {
      this.touchMoveDistance += Math.abs(touch.clientX - this.lastTouchPosition[0]) + Math.abs(touch.clientY - this.lastTouchPosition[1])
    }

    this.lastTouchPosition = [touch.clientX, touch.clientY]
  }

  get parts () {
    const parts = this.$store.getters['parts/getParts']
    return Object.keys(parts)
  }

  iconClasses (name: string) {
    return this.isPartExcluded(name) ? 'partExcluded' : this.isPartCurrent(name) ? 'partCurrent' : 'partIncluded'
  }

  partSVG (name: string) {
    return this.$store.getters['parts/getPartSVG'](name)
  }

  get iconCancelled () {
    return Icons.cancelled
  }

  get iconCircle () {
    return Icons.circle
  }

  partPos (name: string) {
    return this.$store.getters['parts/getPartPos'](name)
  }

  isPartCurrent (name: string) {
    return this.$store.getters['parts/getIsPartCurrent'](name)
  }

  isPartExcluded (name: string) {
    return this.$store.getters['parts/getIsPartExcluded'](name)
  }
}
</script>

<style lang="scss" scoped>
.layer {
  filter: brightness(140%);

  & > path {
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .partOutline {
    filter: opacity(60%);
    stroke-width: .5;
  }

  .partIcon {
    fill-opacity: 15%;
    stroke-width: .5;

    .hitarea {
      pointer-events: all;
      z-index: -1;
    }
  }

  &:not(.partExcluded) {
    .partIcon:hover {
      fill-opacity: 50%;
    }
  }

  &.partExcluded {
    fill: var(--v-error-base);
    stroke: var(--v-error-base);
  }

  &.partIncluded {
    fill: var(--v-success-base);
    stroke: var(--v-success-base);
  }

  &.partCurrent {
    fill: var(--v-info-base);
    stroke: var(--v-info-base);
  }
}

.theme--light .layer {
  filter: brightness(90%);
}
</style>
