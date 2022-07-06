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
      ref="console-wrapper"
      flat
      class="console-wrapper"
    >
      <DynamicScroller
        ref="scroller"
        :items="flipLayout ? [...items].reverse() : items"
        :min-item-size="24"
        :style="{ height: height + 'px' }"
        :key-field="keyField"
        :buffer="600"
        @resize="scrollToLatest()"
      >
        <template #default="{ item, index, active }">
          <DynamicScrollerItem
            :item="item"
            :active="active"
            :size-dependencies="[
              item.message,
            ]"
            :data-index="index"
          >
            <console-item
              :key="item[keyField]"
              :value="item"
              class="console-item"
              @click="handleEntryClick"
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
import { SocketActions } from '@/api/socketActions'
import { DinamicScroller } from 'vue-virtual-scroller'

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

  @Ref('scroller')
  readonly dynamicScroller!: DinamicScroller

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
    this.dynamicScroller.$el.addEventListener('scroll', this.onScroll)
  }

  beforeDestroy () {
    this.dynamicScroller.$el.removeEventListener('scroll', this.onScroll)
  }

  @Watch('items', { immediate: true })
  onItemsChange (_: any, oldItems: any[]) {
    if (this.dynamicScroller) {
      const el = this.dynamicScroller.$el

      if (this.flipLayout && (this._pauseScroll || !this.$store.state.console.autoScroll)) {
        const { scrollHeight, clientHeight } = el

        if (scrollHeight > clientHeight) {
          this.$nextTick(() => {
            el.scrollTop += el.scrollHeight - scrollHeight
          })
        }
      } else {
        this.scrollToLatest(oldItems?.length === 0)
      }
    }
  }

  updateScrollingPaused () {
    this.$nextTick(() => {
      const { scrollTop, scrollHeight, clientHeight } = this.dynamicScroller.$el

      const pauseScroll = this.flipLayout ? scrollTop > 1 : scrollHeight - scrollTop - clientHeight > 1

      if (this._pauseScroll !== pauseScroll) {
        this._pauseScroll = pauseScroll
        this.$emit('update:scrollingPaused', pauseScroll)
      }
    })
  }

  onScroll () {
    this.updateScrollingPaused()
  }

  scrollToLatest (force?: boolean) {
    if (this._pauseScroll && !force) return

    if (this.dynamicScroller) {
      if (
        this.$store.state.console.autoScroll ||
        this.readonly ||
        force
      ) {
        if (this.flipLayout) {
          this.dynamicScroller.scrollToItem(0)
        } else {
          this.dynamicScroller.scrollToBottom()
        }
      }

      this.updateScrollingPaused()
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

  :deep(.vue-recycle-scroller__item-wrapper) {
    overflow: revert;
  }

</style>
