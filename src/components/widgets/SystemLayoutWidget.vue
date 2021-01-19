<template>
  <v-list dense>
    <v-subheader>{{ $t('Layout') }}</v-subheader>

    <v-list-item @click.prevent="layoutMode = !layoutMode">
      <v-list-item-action>
        <v-checkbox :input-value="layoutMode"></v-checkbox>
      </v-list-item-action>

      <v-list-item-content>
        <v-list-item-title class="text-wrap">{{ $t('Adjust dashboard layout') }}</v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <v-list-item @click="resetLayout">
      <v-list-item-icon>
        <v-icon>$refresh</v-icon>
      </v-list-item-icon>

      <v-list-item-content>
        <v-list-item-title class="text-wrap">{{ $t('Reset dashboard layout') }}</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
  </v-list>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { defaultState } from '@/store/config/index'

@Component({})
export default class SystemLayoutWidget extends Mixins(StateMixin) {
  get layoutMode () {
    return this.$store.state.config.layoutMode
  }

  set layoutMode (val: boolean) {
    this.$store.commit('config/setLayoutMode', val)
    this.close()
  }

  close () {
    this.$emit('click')
  }

  resetLayout () {
    const layout = defaultState().cardLayout
    this.$store.dispatch('config/saveCardConfig', { group: 'dashboard1', cards: layout.dashboard1 })
    this.$store.dispatch('config/saveCardConfig', { group: 'dashboard2', cards: layout.dashboard2 })
  }
}
</script>
