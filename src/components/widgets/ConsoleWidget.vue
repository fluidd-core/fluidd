<template>
  <div>
      <v-card outlined color="#1c1c1c" class="console-container mb-3 pa-1" height="300">
        <span v-for="(item, index) in consoleItems" :key="index" v-html="item"></span>
      </v-card>
      <input-console-command
        v-model="consoleCommand"
        @send="sendCommand"
      >
      </input-console-command>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import InputConsoleCommand from '@/components/inputs/inputConsoleCommand.vue'

@Component({
  components: {
    InputConsoleCommand
  }
})
export default class ConsoleWidget extends Mixins(UtilsMixin) {
  get consoleItems () {
    return this.$store.state.socket.console
  }

  consoleCommand = ''

  sendCommand (command?: string) {
    if (command && command.length) {
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
