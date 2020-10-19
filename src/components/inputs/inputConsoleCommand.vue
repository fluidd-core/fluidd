<template>
  <v-text-field
    :value="newValue"
    @input="emitChange"
    :items="history"
    class="ma-4"
    clearable
    solo
    dense
    hide-details
    placeholder="Send gcode"
    append-outer-icon="mdi-send"
    @click:append-outer="emitSend(newValue)"
    @keyup.enter="emitSend(newValue)"
    @keyup.up="historyUp()"
    @keyup.down="historyDown()">
  </v-text-field>
  <!-- {{ originalHistory}}<br />
  {{ history }} -->
</template>

<script lang="ts">
import { Vue, Component, Prop } from 'vue-property-decorator'

@Component({})
export default class InputConsoleCommand extends Vue {
  @Prop({ type: String, required: true })
  public value!: string

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
      this.newValue = ''
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
