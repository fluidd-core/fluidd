<template>
  <div class="console">
    <v-card outlined color="tertiary" class="console-wrapper pa-1" ref="console-wrapper">
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
import { Component, Prop, Mixins, Watch } from 'vue-property-decorator'
import UtilsMixin from '@/mixins/utils'
import InputConsoleCommand from '@/components/inputs/inputConsoleCommand.vue'
import ConsoleEntryWidget from '@/components/widgets/ConsoleEntryWidget.vue'
import { ConsoleEntry } from '@/store/socket/types'

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

  @Watch('items')
  onItemsChange (val: ConsoleEntry) {
    // console.log('items changed', val)
    this.scrollToEnd()
  }

  scrollToEnd () {
    this.$nextTick(() => {
      const vel = this.$refs['console-wrapper'] as Vue
      if (vel && vel.$el) {
        const el = vel.$el
        // console.log('updating scroll', el.scrollHeight, el)
        el.scrollTop = el.scrollHeight
      }
    })
  }

  sendCommand (command?: string) {
    if (command && command.length) {
      this.sendGcode(command)
    }
  }

  handleEntryClick (command: string) {
    this.consoleCommand = command
  }
}
</script>

<style lang="scss" scoped>
  .console {
    height: calc(100% - 12px);
    position: relative;
    display: block;
    font-family: monospace;
    font-size: 1rem; // 15 px
    font-weight: 100 !important;
  }

  .console-wrapper {
    height: calc(100% - 60px);
    overflow-x: hidden;
  }

  .v-input {
    flex: 0 0 auto;
  }

  .console ::-webkit-scrollbar {
    transition: all .5s;
    width: 5px;
    height: 1px;
    z-index: 10;
  }

  .console ::-webkit-scrollbar-track {
    background: transparent;
  }

  .console ::-webkit-scrollbar-thumb {
    background: #b3ada7;
  }

</style>
