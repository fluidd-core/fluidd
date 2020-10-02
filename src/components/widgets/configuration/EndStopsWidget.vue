<template>
  <v-card class="mb-4">
    <v-row>
      <v-col>
        <v-card-title class="pt-0 pr-0">
          <v-icon left>mdi-arrow-expand-horizontal</v-icon> Endstops<br />
        </v-card-title>
        <v-card-subtitle class="pr-0">Use the refresh button to update endstop status.</v-card-subtitle>
      </v-col>
      <v-col cols="auto" class="pl-0">
        <v-btn
          @click="queryEndstops"
          small
          fab
          class="mr-4"
          color="secondary">
          <v-icon>mdi-refresh</v-icon>
        </v-btn>
      </v-col>
    </v-row>
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
          <v-icon small left>{{ (item === 'open') ? 'mdi-checkbox-blank-circle-outline' : 'mdi-checkbox-marked-circle' }}</v-icon>
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
    return this.$store.state.socket.endstops
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
