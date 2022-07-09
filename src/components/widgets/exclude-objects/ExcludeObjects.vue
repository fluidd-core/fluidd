<template>
  <g
    id="parts"
    class="layer"
  >
    <path
      v-for="name in parts"
      :key="`${name}bounds`"
      :class="isPartExcluded(name) ? 'partOutline partExcluded' : 'partOutline'"
      :d="partSVG(name)"
    />
    <svg
      v-for="name in parts"
      :key="`${name}icon`"
      width="7"
      height="7"
      viewBox="0 0 24 24"
      class="partIcon"
      :x="partPos(name).x - 7/2"
      :y="partPos(name).y - 7/2"
    >
      <path
        :class="iconClasses(name)"
        :d="iconCancelled"
      />
      <path
        v-if="!isPartExcluded(name)"
        :class="iconClasses(name)"
        :d="iconCircle"
        class="hitarea"
        @click="$emit('cancel', name)"
      />
    </svg>
  </g>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Icons } from '@/globals'

@Component({})
export default class ExcludeObjects extends Mixins(StateMixin) {
  get parts () {
    const parts = this.$store.getters['parts/getParts']
    return Object.keys(parts)
  }

  iconClasses (name: string) {
    return this.isPartExcluded(name) ? 'partExcluded' : 'partIncluded'
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
.layer > path {
  fill: none;
  stroke: var(--v-success-base);
  stroke-linecap: round;
  stroke-linejoin: round;
}

.layer .partIcon {
  filter: brightness(150%);
  fill-opacity: 15%;
}

.layer .partIcon .hitarea {
  pointer-events: all;
  z-index: -1;
  stroke-width: 0;
}

.layer .partIcon .partIncluded:hover {
  fill-opacity: 50%;
}

.layer .partIcon.partCurrent {
  fill: var(--v-info-base);
  fill-opacity: 30%;
}

.layer .partIcon .partIncluded {
  pointer-events: all;
  fill: var(--v-success-base);
  stroke: var(--v-success-base);
  stroke-width: .5;
}

.layer .partIcon.partExcluded {
  filter: brightness(75%);
  pointer-events: none;
}

.layer .partOutline {
  filter: opacity(60%);
  stroke-width: .5;
}

.layer .partExcluded {
  filter: opacity(100%);
  fill: var(--v-error-base);
  stroke: var(--v-error-base);
  fill-opacity: 35%;
}
</style>
