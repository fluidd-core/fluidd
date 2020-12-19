<template>
  <div class="console-wrapper">
    <v-card outlined color="tertiary" class="console pa-1">
      <v-layout v-for="(item, index) in items" :key="index" class="console-item">
        <span v-if="item.time" class="grey--text text--darken-2 mr-3 d-none d-sm-block">{{ getTime(item.time) }} </span>
        <span :class="consoleClass(item)" v-html="item.message"></span>
      </v-layout>
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
import { ConsoleEntry } from '@/store/socket/types'
import { Globals } from '@/globals'

@Component({
  components: {
    InputConsoleCommand
  }
})
export default class ConsoleWidget extends Mixins(UtilsMixin) {
  @Prop({ type: Array, default: [] })
  items!: []

  @Prop({ type: Boolean, default: false })
  readonly!: false

  consoleCommand = ''

  sendCommand (command?: string) {
    if (command && command.length) {
      this.sendGcode(command)
    }
  }

  getTime (item: number) {
    return this.$dayjs(item * 1000).format('HH:mm:ss')
  }

  consoleClass (item: ConsoleEntry) {
    if (item.message.startsWith('!!')) {
      return { 'error--text': true }
    }

    if (item.message.startsWith('//')) {
      return { 'grey--text': true }
    }

    if (item.message.startsWith(Globals.CONSOLE_SEND_PREFIX.trim())) {
      return { 'primary--text text--lighten-1': true }
    }

    return { 'grey--text text--darken-1': true }
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

  .console-item {
    flex: 0 0 auto;
  }

  .v-input {
    flex: 0 0 auto;
  }
</style>
