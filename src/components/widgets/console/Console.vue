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
      ref="console-wrapper"
      flat
      class="console-wrapper"
    >
      <DynamicScroller
        ref="scroller"
        :items="flipLayout ? [...items].reverse() : items"
        :min-item-size="24"
        class="console-scroller"
        :class="{
          'console-scroller-fullscreen': fullscreen
        }"
        key-field="id"
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
              :key="item.id"
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
      v-model="currentCommand"
      :disabled="!klippyConnected"
      :autofocus="fullscreen"
      @send="sendCommand"
    />
  </div>
</template>

<script lang="ts">
import { Component, Prop, Mixins, Watch, Ref, PropSync } from 'vue-property-decorator'
import { consola } from 'consola'
import StateMixin from '@/mixins/state'
import ConsoleCommand from './ConsoleCommand.vue'
import ConsoleItem from './ConsoleItem.vue'
import { SocketActions } from '@/api/socketActions'
import type { DinamicScroller } from 'vue-virtual-scroller'
import type { ConsoleEntry } from '@/store/console/types'
import type { UpdateResponse } from '@/store/version/types'

@Component({
  components: {
    ConsoleCommand,
    ConsoleItem
  }
})
export default class Console extends Mixins(StateMixin) {
  @Prop({ type: [Array<ConsoleEntry>, Array<UpdateResponse>], default: () => [] })
  readonly items!: ConsoleEntry[] | UpdateResponse[]

  @Prop({ type: Boolean })
  readonly fullscreen?: boolean

  @Prop({ type: Boolean })
  readonly readonly?: boolean

  @PropSync('scrollingPaused', { type: Boolean })
  scrollingPausedModel?: boolean

  @Ref('scroller')
  readonly dynamicScroller!: DinamicScroller

  _pauseScroll = false
  declare _programmaticFrames: number
  declare _programmaticRaf: number | null
  _stopSizesWatcher: (() => void) | null = null

  get currentCommand (): string {
    return this.$typedState.console.consoleCommand
  }

  set currentCommand (val: string) {
    this.$typedCommit('console/setConsoleCommand', val)
  }

  get flipLayout (): boolean {
    return this.$typedState.config.uiSettings.general.flipConsoleLayout
  }

  set flipLayout (_) {
    this.scrollToLatest(true)
  }

  mounted () {
    // Vue 2 does not proxy _-prefixed properties onto the instance, so class-field
    // initializers for these are silently dropped. Set them as own properties here.
    this._programmaticFrames = 0
    this._programmaticRaf = null

    const el = this.dynamicScroller.$el
    el.addEventListener('scroll', this.onScroll)

    // DynamicScroller's internal `itemsWithSize` watcher adjusts scrollTop on item
    // measurement, producing a scroll event indistinguishable from user input.
    // Mirror vscrollData.sizes so we can open a programmatic window before that event.
    const scroller = this.dynamicScroller as unknown as {
      vscrollData?: { sizes: Record<string | number, number> }
    }
    const vscrollData = scroller.vscrollData
    if (vscrollData) {
      this._stopSizesWatcher = this.$watch(
        () => vscrollData.sizes,
        () => this.markProgrammatic(),
        { deep: true }
      )
    } else {
      consola.warn('[Console] DynamicScroller.vscrollData not found; auto-scroll pause detection may misfire on item measurement.')
    }
  }

  beforeDestroy () {
    const el = this.dynamicScroller.$el
    el.removeEventListener('scroll', this.onScroll)
    if (this._stopSizesWatcher) {
      this._stopSizesWatcher()
      this._stopSizesWatcher = null
    }
    if (this._programmaticRaf !== null) {
      cancelAnimationFrame(this._programmaticRaf)
      this._programmaticRaf = null
    }
  }

  @Watch('items', { immediate: true })
  onItemsChange (_: unknown, oldItems: unknown[]) {
    if (this.dynamicScroller) {
      const el = this.dynamicScroller.$el

      if (this.flipLayout && (this._pauseScroll || !this.$typedState.console.autoScroll)) {
        const { scrollHeight, clientHeight } = el

        if (scrollHeight > clientHeight) {
          this.$nextTick(() => {
            this.markProgrammatic()
            el.scrollTop += el.scrollHeight - scrollHeight
          })
        }
      } else {
        this.scrollToLatest(oldItems?.length === 0)
      }
    }
  }

  markProgrammatic (frames = 2) {
    this._programmaticFrames = Math.max(this._programmaticFrames, frames)
    if (this._programmaticRaf === null) {
      const tick = () => {
        this._programmaticFrames--
        if (this._programmaticFrames > 0) {
          this._programmaticRaf = requestAnimationFrame(tick)
        } else {
          this._programmaticRaf = null
        }
      }
      this._programmaticRaf = requestAnimationFrame(tick)
    }
  }

  // Must be a method, not a getter: vue-class-component turns getters into cached
  // computed properties. Because _programmaticFrames is non-reactive (Vue 2 does not
  // proxy _-prefixed props), no dep is recorded and the cached value never updates.
  isProgrammaticScroll (): boolean {
    return this._programmaticFrames > 0
  }

  onScroll () {
    const { scrollTop, scrollHeight, clientHeight } = this.dynamicScroller.$el
    const atLatest = this.flipLayout
      ? scrollTop <= 1
      : scrollHeight - scrollTop - clientHeight <= 1

    if (this._pauseScroll) {
      if (atLatest) {
        this._pauseScroll = false
        this.scrollingPausedModel = false
      }
      return
    }

    if (this.isProgrammaticScroll()) return

    if (!atLatest) {
      this._pauseScroll = true
      this.scrollingPausedModel = true
    }
  }

  scrollToLatest (force?: boolean) {
    if (this._pauseScroll && !force) return

    if (this.dynamicScroller) {
      if (
        this.$typedState.console.autoScroll ||
        this.readonly ||
        force
      ) {
        this.markProgrammatic(3) // 3 frames covers scrollToBottom's async rAF settle
        if (this.flipLayout) {
          this.dynamicScroller.scrollToItem(0)
        } else {
          this.dynamicScroller.scrollToBottom()
        }
      }

      if (force) {
        this._pauseScroll = false
        this.scrollingPausedModel = false
      }
    }
  }

  sendCommand (command?: string) {
    if (command && command.length) {
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

  :deep(.vue-recycle-scroller__item-wrapper) {
    overflow: revert;
  }

</style>
