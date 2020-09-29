<template>
  <div>
      <v-card outlined color="#262626" class="console-container mb-3 pa-1" height="300">
        <span v-for="(item, index) in consoleItems" :key="index" v-html="item"></span>
      </v-card>
      <v-text-field
        v-model="consoleCommand"
        :items="consoleHistory"
        class="ma-4"
        clearable
        solo
        dense
        hide-details
        placeholder="Send gcode"
        append-outer-icon="mdi-send"
        @click:append-outer="sendCommand(consoleCommand)"
        @keyup.enter="sendCommand(consoleCommand)"></v-text-field>
      <!-- <v-virtual-scroll
        :bench="50"
        :items="consoleItems"
        height="300"
        item-height="25"
        class=""
      >
        <template v-slot="{ item }">
          <div class="d-flex" style="flex: 0 1 auto;">{{ item }}</div>
        </template>
      </v-virtual-scroll> -->

  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'

@Component({})
export default class ConsoleWidget extends Mixins(UtilsMixin) {
  get consoleItems () {
    return this.$store.state.socket.console
  }

  consoleCommand = ''
  consoleHistory: string[] = []

  sendCommand (command: string) {
    // keep a history of 5 items.
    if (command && command.length) {
      this.consoleCommand = ''
      if (this.consoleHistory.length >= 5) {
        this.consoleHistory.shift()
      }
      this.consoleHistory.unshift(command)
      this.sendGcode(command)
    }
  }
}
</script>

<style lang="scss" scoped>
  .console-container {
    display: flex;
    flex-direction: column-reverse;
    overflow-y: scroll;
    overflow-x: hidden;
    font-family: monospace;
    font-size: 1rem; // 15 px
    font-weight: 100 !important;
    span {
      flex: 0 0 auto;
    }
  }
</style>
