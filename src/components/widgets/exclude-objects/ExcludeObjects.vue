<template>
  <g id="parts">
    <template v-for="part in parts">
      <g
        v-if="(
          part.polygon &&
          part.polygon.length > 0 &&
          part.center &&
          part.center.length >= 2
        )"
        :key="part.name"
        :class="iconClasses(part)"
        class="layer"
      >
        <path
          class="partOutline"
          :d="partSVG(part)"
          :shape-rendering="shapeRendering"
        />
        <svg
          width="7"
          height="7"
          viewBox="0 0 24 24"
          class="partIcon"
          :x="part.center[0] - 7/2"
          :y="part.center[1] - 7/2"
        >
          <path :d="iconCancelled" />
          <path
            v-if="!part.isExcluded"
            v-touch:tap="() => $emit('cancel', part.name)"
            :d="iconCircle"
            class="hitarea"
          />
        </svg>
      </g>
    </template>
  </g>
</template>

<script lang="ts">
import { Component, Mixins, Prop } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Icons } from '@/globals'
import type { ExcludeObjectPart } from '@/store/printer/types'

@Component({})
export default class ExcludeObjects extends Mixins(StateMixin) {
  @Prop({ type: String })
  readonly shapeRendering?: string

  get parts () {
    return this.$store.getters['printer/getExcludeObjectParts'] as ExcludeObjectPart[]
  }

  iconClasses (part: ExcludeObjectPart) {
    if (part.isExcluded) {
      return 'partExcluded'
    } else if (part.isCurrent) {
      return 'partCurrent'
    } else {
      return 'partIncluded'
    }
  }

  partSVG (part: ExcludeObjectPart) {
    const polygonAsString = part.polygon!
      .map(point => `${point[0]},${point[1]}`)
      .join('L')

    return `M${polygonAsString}z`
  }

  get iconCancelled () {
    return Icons.cancelled
  }

  get iconCircle () {
    return Icons.circle
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
