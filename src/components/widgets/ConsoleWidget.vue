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
            <console-item-widget
              :value="item"
              :key="item[keyField]"
              @click="handleEntryClick"
              class="console-item"
            >
            </console-item-widget>
          </DynamicScrollerItem>
        </template>
      </DynamicScroller>
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
import StateMixin from '@/mixins/state'
import InputConsoleCommand from '@/components/inputs/inputConsoleCommand.vue'
import ConsoleItemWidget from '@/components/widgets/ConsoleItemWidget.vue'
import { ConsoleEntry } from '@/store/console/types'

@Component({
  components: {
    InputConsoleCommand,
    ConsoleItemWidget
  }
})
export default class ConsoleWidget extends Mixins(StateMixin) {
  @Prop({ type: Array, default: [] })
  items!: []

  @Prop({ type: String, default: 'id' })
  keyField!: string

  @Prop({ type: Number, default: 250 })
  height!: number

  @Prop({ type: Boolean, default: false })
  readonly!: boolean

  @Prop({ type: Boolean, default: false })
  padBottom!: boolean

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

  scrollToBottom () {
    const ref = this.$refs.scroller as any
    if (ref) ref.scrollToBottom()
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
