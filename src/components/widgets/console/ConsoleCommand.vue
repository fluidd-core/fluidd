<template>
  <v-row class="ma-2">
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
        @keydown.up.exact="handleKeyUp"
        @keydown.down.exact="handleKeyDown"
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
</template>

<script lang="ts">
import { Vue, Component, Prop, Watch, Ref } from 'vue-property-decorator'
import { Globals } from '@/globals'
import type { VTextarea } from 'vuetify/lib'
import type { GcodeCommands } from '@/store/printer/types'

@Component({})
export default class ConsoleCommand extends Vue {
  @Prop({ type: String })
  readonly value!: string

  @Ref('input')
  readonly input!: VTextarea

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
  historyIndex = -1

  mounted () {
    this.newValue = this.value
    const savedHistory: string[] = this.$typedState.console.commandHistory
    this.history = [...savedHistory]
  }

  emitChange (val: string) {
    this.newValue = val
    this.$emit('input', val)
  }

  emitSend (val: string) {
    if (val && val.length > 0) {
      if (this.history.length >= this.commandHistoryCount) {
        this.history.pop()
      }
      this.history.unshift(val)
      this.$typedDispatch('console/onUpdateCommandHistory', [...this.history])
      this.historyIndex = -1
      this.$emit('send', val)
    }
  }

  handleKeyUp (event: KeyboardEvent) {
    const el = this.input.$refs.input

    if (
      el.selectionStart === el.selectionEnd &&
      el.value.slice(0, el.selectionStart ?? 0).indexOf('\n') === -1
    ) {
      event.preventDefault()

      const historyLength = this.history.length

      if (
        historyLength >= 1 &&
        this.historyIndex !== historyLength
      ) {
        const index = ++this.historyIndex

        this.emitChange(this.history[index] ?? '')
      }
    }
  }

  handleKeyDown (event: KeyboardEvent) {
    const el = this.input.$refs.input

    if (
      el.selectionStart === el.selectionEnd &&
      el.value.slice(el.selectionEnd ?? 0).indexOf('\n') === -1
    ) {
      event.preventDefault()

      const historyLength = this.history.length

      if (
        historyLength >= 1 &&
        this.historyIndex !== -1
      ) {
        const index = --this.historyIndex

        this.emitChange(this.history[index] ?? '')
      }
    }
  }

  get availableCommands (): GcodeCommands {
    return this.$typedGetters['printer/getAvailableCommands']
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
        this.$typedDispatch('console/onAddConsoleEntry', { message, type: 'response' })
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
