<template>
  <v-card class="mb-4" color="tertiary">
    <v-card-title class="font-weight-light quaternary">
      <v-icon left>{{ icons.expandHorizontal }}</v-icon> Endstops<br />
      <v-btn
        @click="queryEndstops"
        small
        right
        fab
        absolute
        color="secondary">
        <v-icon>{{ icons.refresh }}</v-icon>
      </v-btn>
    </v-card-title>
    <v-card-subtitle class="quaternary">Use the refresh button to update endstop status.</v-card-subtitle>
    <v-divider v-if="hasEndStops"></v-divider>
    <v-card-text v-if="hasEndStops">
      <v-layout
        align-center justify-start
        class="py-1"
        v-for="(item, name) in endStops"
        :key="name">
        <span class="grey--text text--lighten-1 text-h5 mr-5">{{ name }}</span>
        <v-chip
          :color="(item === 'open') ? 'secondary' : 'warning'"
          class="ml-2"
          small
          label>
          <v-icon small left>{{ (item === 'open') ? icons.blankCircle : icons.markedCircle }}</v-icon>
          {{ item.toUpperCase() }}
        </v-chip>
      </v-layout>
    </v-card-text>
  </v-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import { SocketActions } from '@/socketActions'

@Component({
  components: {}
})
export default class EndStopsWidget extends Mixins(UtilsMixin) {
  get endStops () {
    return this.$store.getters['socket/getEndstops']
  }

  // Default state is an empty object.
  get hasEndStops () {
    return (Object.keys(this.endStops).length > 0)
  }

  queryEndstops () {
    SocketActions.printerQueryEndstops()
  }

  destroyed () {
    this.$store.commit('socket/clearEndStops')
  }
}
</script>
