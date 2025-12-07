<template>
  <v-alert
    v-if="bypassState"
    type="warning"
    class="mt-3"
    dense
    text
  >
    {{ $t('app.afc.BypassActive') }}
  </v-alert>
</template>
<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import AfcMixin from '@/mixins/afc'

@Component
export default class AfcCardBypass extends Mixins(StateMixin, AfcMixin) {
  get bypassState (): boolean {
    return this.afc?.bypass_state === true
  }
}
</script>
