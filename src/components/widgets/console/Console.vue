<template>
  <div
    class="console"
  >
    <console-command
      v-if="!readonly && flipLayout"
      v-model="consoleCommand"
      @send="sendCommand"
    />
    <v-card
      flat
      class="console-wrapper"
      ref="console-wrapper"
    >
      <DynamicScroller
        ref="scroller"
        :items="flipLayout ? [...items].reverse() : items"
        :min-item-size="24"
        @resize="scrollToLatest()"
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
            />
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>
    </v-card>
    <console-command
      v-if="!readonly && !flipLayout"
      v-model="consoleCommand"
      @send="sendCommand"
    />
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

  _lastScroll = 0
  _lastHeight = 0
  _pauseScroll = false

  get availableCommands () {
    return this.$store.getters['console/getAllGcodeCommands']
  }

  get consoleCommand () {
    return this.$store.state.console.consoleCommand
  }

  set consoleCommand (val: string) {
    this.$store.commit('console/setConsoleCommand', val)
  }

  get flipLayout (): boolean {
    return this.$store.state.config.uiSettings.general.flipConsoleLayout
  }

  set flipLayout (_) {
    this.scrollToLatest(true)
  }

  mounted () {
    this.$nextTick(() => {
      this.scrollToLatest()
      this.watchScroll()
    })
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
      this.scrollToLatest()
      if (this.dynamicScroller) {
        if (this.flipLayout && this._pauseScroll) {
          const el = this.dynamicScroller.$el
          el.scrollTop += el.scrollHeight - this._lastHeight
        }

        this._lastHeight = this.dynamicScroller.$el.scrollHeight
      }
    }
  }

  updateScrollingPaused (value: boolean) {
    if (this._pauseScroll !== value) {
      this._pauseScroll = value
      this.$emit('update:scrollingPaused', value)
    }
  }

  watchScroll () {
    this.dynamicScroller.$el.addEventListener('scroll', (e: any) => {
      const el = e.target
      if (this.flipLayout ? (el.scrollTop > this._lastScroll) : (el.scrollTop < this._lastScroll)) {
        this.updateScrollingPaused(true)
      } else {
        if (this._pauseScroll) {
          if (this.flipLayout ? (el.scrollTop < 1) : (el.scrollHeight - el.scrollTop - el.clientHeight < 1)) {
            this.updateScrollingPaused(false)
          }
        }
      }
      this._lastScroll = el.scrollTop
    })
  }

  scrollToLatest (force?: boolean) {
    // If we have auto scroll turned off, then don't do this
    // unless it's readonly or forced.
    if (this.dynamicScroller) {
      if (this._pauseScroll && !force) return
      if (
        this.$store.state.console.autoScroll ||
        this.readonly ||
        force
      ) {
        this.dynamicScroller[this.flipLayout ? 'scrollToItem' : 'scrollToBottom'](0)
        this.updateScrollingPaused(false)
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
    padding-left: 4px;
  }

  .v-input {
    flex: 0 0 auto;
  }

  ::v-deep .vue-recycle-scroller__item-wrapper {
    overflow: revert;
  }

</style>
