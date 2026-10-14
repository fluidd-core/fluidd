<template>
  <tone-pill
    v-if="klippyReady && checks.length"
    :tone="dueCount ? 'warn' : 'ok'"
    data-tid="maintenance-due"
  >
    {{ text }}
  </tone-pill>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import MaintenanceMixin from '@/mixins/maintenance'
import TonePill from '@/components/printers/TonePill.vue'

/** Beside Maintenance's title: how many checks are due, or that none are. */
@Component({ components: { TonePill } })
export default class MaintenanceDue extends Mixins(MaintenanceMixin) {
  get text (): string {
    if (!this.dueCount) return 'Nothing is due'
    return this.dueCount === 1 ? '1 thing is due' : `${this.dueCount} things are due`
  }
}
</script>
