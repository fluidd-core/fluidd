<template>
  <v-container>
    <v-row align="center">
      <v-col>
        <v-textarea
          ref="input"
          :rows="1"
          :value="newValue"
          :items="history"
          :disabled="disabled"
          :autofocus="autofocus"
          auto-grow
          clearable
          outlined
          single-line
          dense
          hide-details
          spellcheck="false"
          class="console-command"
          @input="emitChange"
          @keyup.enter.exact="emitSend(newValue)"
          @keydown.enter.exact.prevent
          @keydown.up.exact.prevent="historyUp()"
          @keydown.down.exact.prevent="historyDown()"
          @keydown.prevent.tab="autoComplete()"
        />
      </v-col>
      <v-col cols="auto">
        <app-btn
          :disabled="disabled"
          @click="emitSend(newValue)"
        >
          {{ $t('app.general.btn.send') }}
        </app-btn>
      </v-col>
    </v-row>
  </v-container>
  <!-- <pre>{{ originalHistory }}</pre>
    <pre>{{ history }}</pre> -->
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch, Ref } from 'vue-property-decorator'
import { Globals } from '@/globals'
import type { VInput } from '@/types'
import type { GcodeCommands } from '@/store/printer/types'

@Component({})
export default class ConsoleCommand extends Vue {
  @Prop({ type: String })
  readonly value!: string

  @Ref('input')
  readonly input!: VInput

  @Prop({ type: Boolean })
  readonly disabled?: boolean

  @Prop({ type: Boolean })
  readonly autofocus?: boolean

  @Watch('value')
  onValueChange (val: string) {
    if (val) {
      this.newValue = val
      this.input.focus()
    } else {
      this.newValue = ''
    }
  }

  newValue = ''
  commandHistoryCount = Globals.CONSOLE_COMMAND_HISTORY
  history: string[] = []
  originalHistory: string[] = []
  isFirst = true

  mounted () {
    this.newValue = this.value
    const savedHistory = this.$store.state.console.commandHistory
    this.history = [...savedHistory]
    this.originalHistory = [...savedHistory]
  }

  emitChange (val: string) {
    this.newValue = val
    this.$emit('input', val)
  }

  emitSend (val: string) {
    if (val && val.length > 0) {
      if (this.history.length >= this.commandHistoryCount) {
        this.originalHistory.pop()
      }
      this.originalHistory.unshift(val)
      this.$store.dispatch('console/onUpdateCommandHistory', [...this.originalHistory])
      this.history = [...this.originalHistory]
      this.isFirst = true
      this.$emit('send', val)
    }
  }

  historyUp () {
    if (this.history.length >= 1) {
      if (!this.isFirst) {
        const f = this.history.shift() as string
        this.history.push(f)
      }
      this.emitChange(this.history[0])
      this.isFirst = false
    }
  }

  historyDown () {
    if (this.history.length >= 1) {
      if (!this.isFirst) {
        const f = this.history.pop() as string
        this.history.unshift(f)
      }
      this.emitChange(this.history[0])
      this.isFirst = false
    }
  }

  get availableCommands (): GcodeCommands {
    return this.$store.getters['printer/getAvailableCommands'] as GcodeCommands
  }

  autoComplete () {
    const availableCommands = this.availableCommands

    if (this.newValue.length) {
      const commands = Object.keys(availableCommands)
        .filter(command => command.startsWith(this.newValue.toUpperCase()))

      if (commands.length === 1) {
        this.emitChange(commands[0])
      } else if (commands.length > 0) {
        const message = commands
          .map(command => `// ${command}: ${availableCommands[command].help ?? ''}`)
          .join('\n')
        this.$store.dispatch('console/onAddConsoleEntry', { message, type: 'response' })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  .console-command {
    font-family: monospace;
  }
</style>
