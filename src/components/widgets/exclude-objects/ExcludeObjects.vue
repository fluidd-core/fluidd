<template>
    <g id="parts" class="layer">
        <path v-for="name in partNames" :key="name+'bounds'"
                :class="isPartExcluded(name) ? 'partOutline partExcluded' : 'partOutline'"
            :d="partSVG(name)"
        />
        <svg width="7" height="7" viewBox="0 0 24 24"
          v-for="name in partNames" :key="name+'icon'" :x="partPos(name).x-3.5" :y="partPos(name).y-3.5">
        <path
                :class="isPartExcluded(name) ? 'partIcon partExcluded' : 'partIcon'"
                :d="icon(name)" pointer-events="all"
         v-on:click="onPartClick(name, $event)"
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
  get partNames () {
    const parts = this.$store.getters['parts/getParts']
    const names = []
    for (const name in parts) {
      names.push(name)
    }
    return names
  }

  partSVG (name: string) {
    const svg = this.$store.getters['parts/getPartSVG'](name)
    return svg
  }

  icon (name: string) {
    return this.$store.getters['parts/getIsPartExcluded'](name) ? Icons.cancelled : Icons.circle
  }

  partPos (name: string) {
    return this.$store.getters['parts/getPartPos'](name)
  }

  isPartExcluded (name: string) {
    return this.$store.getters['parts/getIsPartExcluded'](name)
  }

  onPartClick (id: string) {
    const reqId = id.toUpperCase().replace(/\s/g, '_')

    this.$tc('app.general.simple_form.msg.confirm')
    this.$confirm(
      this.$tc('app.general.simple_form.msg.confirm'),
      { title: this.$tc('app.general.label.confirm'), color: 'card-heading', icon: '$error' }
    )
      .then(res => {
        if (res) {
          this.sendGcode('EXCLUDE_OBJECT NAME=' + reqId)
        }
      })
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
  fill: var(--v-success-base);
  fill-opacity: 15%
}

.layer .partIcon:hover {
  fill-opacity: 50%;
}

.layer .partIcon .partExcluded {
  filter: brightness(75%);
}

.layer .partOutline {
  filter: opacity(60%);
  stroke-width: .25;
}

.layer .partExcluded {
  filter: opacity(100%);
  fill: var(--v-error-base);
  stroke: var(--v-error-base);
  fill-opacity: 35%;
}
</style>
