<template>
  <div
    class="console">
    <v-card
      flat
      class="console-wrapper pa-1"
      ref="console-wrapper"
    >
      <DynamicScroller
        ref="scroller"
        :items="items"
        :min-item-size="24"
        @resize="scrollToBottom()"
        :style="{ height: height + 'px' }"
        :key-field="keyField"
        :buffer="600"
      >
        <template v-slot="{ item, index, active }">
          <DynamicScrollerItem
            :item="item"
            :active="active"
            :size-dependencies="[
              item.message,
            ]"
            :data-index="index"
          >
            <console-item
              :value="item"
              :key="item[keyField]"
              @click="handleEntryClick"
              class="console-item"
            >
            </console-item>
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>
    </v-card>
    <console-command
      v-if="!readonly"
      v-model="consoleCommand"
      @send="sendCommand"
      @autoScrollChange="handleAutoScrollChange"
    >
    </console-command>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Watch, Ref } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import ConsoleCommand from './ConsoleCommand.vue'
import ConsoleItem from './ConsoleItem.vue'
import { ConsoleEntry } from '@/store/console/types'
import { SocketActions } from '@/api/socketActions'

@Component({
  components: {
    ConsoleCommand,
    ConsoleItem
  }
})
export default class Console extends Mixins(StateMixin) {
  @Prop({ type: Array, default: [] })
  items!: []

  @Prop({ type: String, default: 'id' })
  keyField!: string

  @Prop({ type: Number, default: 250 })
  height!: number

  @Prop({ type: Boolean, default: false })
  readonly!: boolean

  @Ref('scroller') dynamicScroller: any

  get availableCommands () {
    return this.$store.getters['console/getAllGcodeCommands']
  }

  get consoleCommand () {
    return this.$store.state.console.consoleCommand
  }

  set consoleCommand (val: string) {
    this.$store.commit('console/setConsoleCommand', val)
  }

  mounted () {
    this.scrollToBottom()
  }

  /**
   * Scroll if the last item in the array is different from the previous
   * array.
   */
  @Watch('items', { immediate: true })
  onItemsChange (val: ConsoleEntry[], oldVal: ConsoleEntry[]) {
    const item = (val && val.length)
      ? val[val.length - 1] as ConsoleEntry
      : undefined
    const oldItem = (oldVal && oldVal.length)
      ? oldVal[oldVal.length - 1] as ConsoleEntry
      : undefined
    if (
      (!item || !oldItem) ||
      (item.id !== oldItem.id) ||
      val.length !== oldVal.length
    ) {
      this.scrollToBottom()
    }
  }

  handleAutoScrollChange (autoScroll: boolean) {
    if (autoScroll) {
      this.scrollToBottom()
    }
  }

  scrollToBottom () {
    // If we have auto scroll turned off, then don't do this
    // unless it's readonly.
    if (this.dynamicScroller) {
      if (
        this.$store.state.console.autoScroll ||
        this.readonly
      ) {
        this.dynamicScroller.scrollToBottom()
      }
    }
  }

  sendCommand (command?: string) {
    if (command && command.length) {
      // If clients detect M112 input from the console, we should invoke the emergency_stop endpoint
      if (command && command.trim().toLowerCase() === 'm112') {
        SocketActions.printerEmergencyStop()
      }
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
  }

  .console-wrapper {
    font-family: monospace;
    font-size: 1rem; // 15 px
    font-weight: 100 !important;
  }

  .v-input {
    flex: 0 0 auto;
  }

  ::v-deep .vue-recycle-scroller__item-wrapper {
    overflow: revert;
  }

</style>
