<template>
  <div class="console">
    <console-command
      v-if="!readonly && flipLayout"
      v-model="currentCommand"
      :disabled="!klippyConnected"
      :autofocus="fullscreen"
      @send="sendCommand"
    />
    <v-card
      flat
      class="console-wrapper"
    >
      <app-auto-scroll-container
        ref="consoleScroller"
        class="console-scroller"
        :class="{
          'console-scroller-fullscreen': fullscreen
        }"
        :reversed="flipLayout"
        v-on="$listeners"
      >
        <console-item
          v-for="item in orderedItems"
          :key="item.id"
          :value="item"
          class="console-item"
          @click="handleEntryClick"
        />
      </app-auto-scroll-container>
    </v-card>
    <console-command
      v-if="!readonly && !flipLayout"
      v-model="currentCommand"
      :disabled="!klippyConnected"
      :autofocus="fullscreen"
      @send="sendCommand"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ConsoleCommand from './ConsoleCommand.vue'
import ConsoleItem from './ConsoleItem.vue'
import { SocketActions } from '@/api/socketActions'
import type { ConsoleEntry } from '@/store/console/types'
import type { UpdateResponse } from '@/store/version/types'
import type AppAutoScrollContainer from '@/components/ui/AppAutoScrollContainer.vue'

@Component({
  components: {
    ConsoleCommand,
    ConsoleItem
  }
})
export default class Console extends Mixins(StateMixin) {
  @Prop({ type: [Array], default: () => [] })
  readonly items!: ConsoleEntry[] | UpdateResponse[]

  @Prop({ type: Boolean })
  readonly fullscreen?: boolean

  @Prop({ type: Boolean })
  readonly readonly?: boolean

  @Ref('consoleScroller')
  readonly consoleScrollerElement!: AppAutoScrollContainer

  get currentCommand (): string {
    return this.$typedState.console.consoleCommand
  }

  set currentCommand (val: string) {
    this.$typedCommit('console/setConsoleCommand', val)
  }

  get flipLayout (): boolean {
    return this.$typedState.config.uiSettings.general.flipConsoleLayout
  }

  get orderedItems () {
    return this.flipLayout
      ? [...this.items].reverse()
      : this.items
  }

  scrollToLatest () {
    this.consoleScrollerElement.scrollToLatest(true)
  }

  sendCommand (command?: string) {
    if (command) {
      // If clients detect M112 input from the console, we should invoke the emergency_stop endpoint
      if (command.trim().toLowerCase() === 'm112') {
        SocketActions.printerEmergencyStop()
      }
      this.sendGcode(command)
      this.currentCommand = ''
    }
  }

  handleEntryClick (command: string) {
    this.currentCommand = command
  }
}
</script>

<style lang="scss" scoped>
  .console-item {
    white-space: pre-wrap;
  }

  .console-wrapper {
    font-family: monospace;
    font-size: 1rem; // 15 px
    font-weight: 100 !important;
    padding-left: 4px;
  }

  .console-scroller {
    height: 300px;
  }

  .console-scroller-fullscreen {
    height: calc(100vh - 260px);
    height: calc(100svh - 260px);
  }

  .v-input {
    flex: 0 0 auto;
  }
</style>
