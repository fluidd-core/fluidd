<template>
    <g id="parts" class="layer">
        <path v-for="item in svgParts" :key="item.name+'bounds'"
                :class="isPartExcluded(item.name) ? 'partOutline partExcluded' : 'partOutline'"
            :d=item.svg
        />
        <path v-for="item in svgParts" :key="item.name+'icon'"
                :class="isPartExcluded(item.name) ? 'partIcon partExcluded' : 'partIcon'"
         :transform="'translate(' + partPos(item.name) +') scale(.5,.5)'" :d="icon(item.name)" pointer-events="all"
         v-on:click="onPartClick(item.name, $event)"
        />
    </g>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Icons } from '@/globals'

@Component({})
export default class ExcludeObjects extends Mixins(StateMixin) {
  get svgParts () {
    const svg = this.$store.getters['parts/getPartsSVG']
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
  filter: opacity(80%);
}

.layer .partExcluded {
  filter: opacity(100%);
  fill: var(--v-error-base);
  stroke: var(--v-error-base);
  fill-opacity: 35%;
}
</style>
