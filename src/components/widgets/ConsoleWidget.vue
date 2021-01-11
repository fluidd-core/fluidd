<template>
  <div class="console-wrapper">
    <v-card outlined color="tertiary" class="console pa-1">
        <console-entry-widget
          v-for="(item, index) in items" :key="index" class="console-item"
          :value="item"
          @click="handleEntryClick"
        >
        </console-entry-widget>
    </v-card>
    <input-console-command
      v-if="!readonly"
      v-model="consoleCommand"
      @send="sendCommand"
    >
    </input-console-command>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import InputConsoleCommand from '@/components/inputs/inputConsoleCommand.vue'
import ConsoleEntryWidget from '@/components/widgets/ConsoleEntryWidget.vue'

@Component({
  components: {
    InputConsoleCommand,
    ConsoleEntryWidget
  }
})
export default class ConsoleWidget extends Mixins(UtilsMixin) {
  @Prop({ type: Array, default: [] })
  items!: []

  @Prop({ type: Boolean, default: false })
  readonly!: false

  get availableCommands () {
    return this.$store.getters['socket/getAllGcodeCommands']
  }

  get consoleCommand () {
    return this.$store.state.consoleCommand
  }

  set consoleCommand (val: string) {
    this.$store.commit('setConsoleCommand', val)
  }

  sendCommand (command?: string) {
    if (command && command.length) {
      this.sendGcode(command)
    }
  }

  handleEntryClick (command: string) {
    console.log('got a command click', command)
    this.consoleCommand = command
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
    flex: 1 0 0;
  }

  .v-input {
    flex: 0 0 auto;
  }
</style>
