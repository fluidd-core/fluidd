<template>
  <v-list dense>
    <v-subheader>{{ $t('app.general.label.layout') }}</v-subheader>

    <v-list-item @click.prevent="layoutMode = !layoutMode">
      <v-list-item-action>
        <v-checkbox :input-value="layoutMode"></v-checkbox>
      </v-list-item-action>

      <v-list-item-content>
        <v-list-item-title class="text-wrap">{{ $t('app.general.btn.adjust_layout') }}</v-list-item-title>
      </v-list-item-content>
    </v-list-item>

    <v-list-item @click="resetLayout">
      <v-list-item-icon>
        <v-icon>$refresh</v-icon>
      </v-list-item-icon>

      <v-list-item-content>
        <v-list-item-title class="text-wrap">{{ $t('app.general.btn.reset_layout') }}</v-list-item-title>
      </v-list-item-content>
    </v-list-item>
  </v-list>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { defaultState } from '@/store/layout/index'

@Component({})
export default class SystemLayout extends Mixins(StateMixin) {
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
    const layout = defaultState()
    this.$store.dispatch('layout/onLayoutChange', {
      name: 'dashboard',
      value: {
        container1: layout.layouts.dashboard.container1,
        container2: layout.layouts.dashboard.container2
      }
    })
  }
}
</script>
