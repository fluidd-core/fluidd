<template>
  <v-container>
    <v-row align="center">
      <v-col>
        <v-text-field
          ref="input"
          :value="newValue"
          @input="emitChange"
          :items="history"
          clearable
          outlined
          single-line
          dense
          hide-details
          :placeholder="$t(`app.console.placeholder.command`)"
          @keyup.enter="emitSend(newValue)"
          @keyup.up="historyUp()"
          @keyup.down="historyDown()"
          @keydown.prevent.tab="autoComplete()">
        </v-text-field>
      </v-col>
      <v-col cols="auto">
        <app-btn
          @click="emitSend(newValue)"
        >
          Send
        </app-btn>
      </v-col>
      <v-col cols="auto">
        <v-checkbox
          v-model="autoScroll"
          hide-details
          label="Auto scroll"
          class="mt-0 pt-0"
        >
        </v-checkbox>
      </v-col>
    </v-row>
  </v-container>
    <!-- <pre>{{ originalHistory }}</pre>
    <pre>{{ history }}</pre> -->
</template>

<script lang="ts">
import { GcodeCommands } from '@/store/console/types'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'
import { Globals } from '@/globals'

@Component({})
export default class ConsoleCommand extends Vue {
  @Prop({ type: String })
  public value!: string

  @Watch('value')
  onValueChange (val: string) {
    if (val) {
      this.newValue = val
      const input = this.$refs.input as HTMLElement
      input.focus()
    } else {
      this.newValue = ''
    }
  }

  newValue = ''
  commandHistoryCount = Globals.CONSOLE_COMMAND_HISTORY
  history: string[] = []
  originalHistory: string[] = []
  isFirst = true

  get autoScroll () {
    return this.$store.state.console.autoScroll
  }

  set autoScroll (value: boolean) {
    this.$store.dispatch('console/onUpdateAutoScroll', value)
    this.$emit('autoScrollChange', value)
  }

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

  autoComplete () {
    const gcodeCommands: GcodeCommands = this.$store.getters['console/getAllGcodeCommands']
    if (this.newValue.length) {
      const commands = Object.keys(gcodeCommands).filter((c: string) => c.toLowerCase().indexOf(this.newValue.toLowerCase()) === 0)
      if (commands && commands.length === 1) {
        this.emitChange(commands[0])
      } else {
        commands.forEach((c) => {
          const message = `// ${c}: ${gcodeCommands[c]}`
          this.$store.dispatch('console/onAddConsoleEntry', { message, type: 'response' })
        })
      }
    }
  }
}
</script>
