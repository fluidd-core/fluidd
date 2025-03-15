<template>
  <v-list
    v-if="canEditLayout"
    dense
  >
    <v-subheader>{{ $t('app.general.label.layout') }}</v-subheader>

    <v-list-item @click.prevent="layoutMode = !layoutMode">
      <v-list-item-icon>
        <v-icon>$apps</v-icon>
      </v-list-item-icon>

      <v-list-item-content>
        <v-list-item-title class="text-wrap">
          {{ $t('app.general.btn.adjust_layout') }}
        </v-list-item-title>
      </v-list-item-content>
    </v-list-item>
  </v-list>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'

@Component({})
export default class SystemLayout extends Mixins(StateMixin) {
  get canEditLayout () {
    return this.$route.meta?.dashboard ?? false
  }

  get layoutMode (): boolean {
    return this.$typedState.config.layoutMode
  }

  set layoutMode (val: boolean) {
    this.$typedCommit('config/setLayoutMode', val)
    this.close()
  }

  close () {
    this.$emit('click')
  }
}
</script>
