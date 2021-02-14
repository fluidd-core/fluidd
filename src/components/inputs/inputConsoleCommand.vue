<template>
  <v-text-field
    ref="input"
    :value="newValue"
    @input="emitChange"
    :items="history"
    class="ma-4"
    clearable
    outlined
    single-line
    dense
    hide-details
    placeholder="'tab' for autocomplete, 'arrows' for history, 'help' for commands"
    @keyup.enter="emitSend(newValue)"
    @keyup.up="historyUp()"
    @keyup.down="historyDown()"
    @keydown.prevent.tab="autoComplete()">
    <template v-slot:append-outer>
      <v-icon @click="emitSend(newValue)">$send</v-icon>
    </template>
  </v-text-field>
  <!-- {{ originalHistory}}<br />
  {{ history }} -->
</template>

<script lang="ts">
import { GcodeCommands } from '@/store/socket/types'
import { Vue, Component, Prop, Watch } from 'vue-property-decorator'

@Component({})
export default class InputConsoleCommand extends Vue {
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
  history: string[] = []
  originalHistory: string[] = []
  isFirst = true

  mounted () {
    this.newValue = this.value
  }

  emitChange (val: string) {
    this.newValue = val
    this.$emit('input', val)
  }

  emitSend (val: string) {
    if (val && val.length > 0) {
      if (this.history.length >= 5) {
        this.originalHistory.shift()
      }
      this.originalHistory.unshift(val)
      this.history = Object.assign([], this.originalHistory)
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
    const gcodeCommands: GcodeCommands = this.$store.getters['socket/getAllGcodeCommands']
    if (this.newValue.length) {
      const commands = Object.keys(gcodeCommands).filter((c: string) => c.toLowerCase().indexOf(this.newValue.toLowerCase()) === 0)
      if (commands && commands.length === 1) {
        this.emitChange(commands[0])
      } else {
        commands.forEach((c) => {
          const message = `// ${c}: ${gcodeCommands[c]}`
          this.$store.dispatch('socket/addConsoleEntry', { message, type: 'response' })
        })
      }
    }
  }
}
</script>
