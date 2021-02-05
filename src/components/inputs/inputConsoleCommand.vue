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
    :placeholder="$t('type help for available commands')"
    @keyup.enter="emitSend(newValue)"
    @keyup.up="historyUp()"
    @keyup.down="historyDown()">
    <template v-slot:append-outer>
      <v-icon @click="emitSend(newValue)">$send</v-icon>
    </template>
  </v-text-field>
  <!-- {{ originalHistory}}<br />
  {{ history }} -->
</template>

<script lang="ts">
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
      this.newValue = this.history[0]
      this.isFirst = false
    }
  }

  historyDown () {
    if (this.history.length >= 1) {
      if (!this.isFirst) {
        const f = this.history.pop() as string
        this.history.unshift(f)
      }
      this.newValue = this.history[0]
      this.isFirst = false
    }
  }
}
</script>
