<template>
  <div
    class="console"
    style="height: 100%;">
    <v-card
      outlined
      color="tertiary"
      class="console-wrapper pa-1"
      :style="(padBottom) ? 'height: calc(100% - 68px);' : 'height: 100%'"
      ref="console-wrapper"
    >
      <console-entry-widget
        v-for="(item, index) in availableItems"
        :key="index"
        class="console-item"
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
  readonly!: boolean

  @Prop({ type: Boolean, default: false })
  padBottom!: boolean

  availableItems: ConsoleEntry[] = []

  get availableCommands () {
    return this.$store.getters['socket/getAllGcodeCommands']
  }

  get consoleCommand () {
    return this.$store.state.consoleCommand
  }

  set consoleCommand (val: string) {
    this.$store.commit('setConsoleCommand', val)
  }

  mounted () {
    this.scrollToEnd()
  }

  // TODO:
  // Later, we should be smarter with scrolling.
  @Watch('items', { immediate: true })
  onItemsChange (val: ConsoleEntry[]) {
    let doScroll = true
    const newArray = val.slice(0) as ConsoleEntry[]
    if (
      newArray.length &&
      this.availableItems.length &&
      newArray[newArray.length - 1].time &&
      this.availableItems[this.availableItems.length - 1].time &&
      newArray[newArray.length - 1].time === this.availableItems[this.availableItems.length - 1].time
    ) {
      doScroll = false
    }
    this.availableItems = newArray
    if (doScroll) this.scrollToEnd()
  }

  scrollToEnd () {
    this.$nextTick(() => {
      const vel = this.$refs['console-wrapper'] as Vue
      if (vel && vel.$el) {
        const el = vel.$el
        el.scrollTop = el.scrollHeight
      }
    })
  }

  sendCommand (command?: string) {
    if (command && command.length) {
      this.sendGcode(command)
      this.consoleCommand = ''
    }
  }

  handleEntryClick (command: string) {
    this.consoleCommand = command
  }
}
</script>

<style lang="scss" scoped>
  .console {
    position: relative;
    display: block;
    font-family: monospace;
    font-size: 1rem; // 15 px
    font-weight: 100 !important;
  }

  .console-wrapper {
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
