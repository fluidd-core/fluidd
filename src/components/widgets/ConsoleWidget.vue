<template>
  <div class="console-wrapper">
    <v-card outlined color="tertiary" class="console pa-1">
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
  .console-wrapper {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100%;
  }
  .console {
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
