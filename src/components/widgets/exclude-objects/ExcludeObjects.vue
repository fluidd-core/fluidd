<template>
  <g
    id="parts"
    class="layer"
  >
    <path
      v-for="name in outlineNames"
      :key="`${name}bounds`"
      :class="isPartExcluded(name) ? 'partOutline partExcluded' : 'partOutline'"
      :d="partSVG(name)"
    />
    <svg
      v-for="name in iconNames"
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
        @click="onPartClick(name)"
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
  get outlineNames () {
    const parts = this.$store.getters['parts/getParts']
    const names = []
    for (const name in parts) {
      if (parts[name].outline.length >= 3) {
        names.push(name)
      }
    }
    return names
  }

  get iconNames () {
    const parts = this.$store.getters['parts/getParts']
    const state = this.$store.getters['parts/getPrintState']
    const names = []
    for (const name in parts) {
      const excluded = this.isPartExcluded(name)
      if (parts[name].target &&
        ((state === 'printing' || state === 'paused') ||
        ((state === 'complete' || state === 'cancelled' || state === 'error') && excluded))) {
        names.push(name)
      }
    }
    return names
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

  async onPartClick (id: string) {
    const reqId = id.toUpperCase().replace(/\s/g, '_')

    const res = await this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )

    if (res) {
      this.sendGcode(`EXCLUDE_OBJECT NAME=${reqId}`)
    }
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
