<template>
  <v-layout class="console-item">
    <span
      v-if="value.time"
      class="grey--text text--darken-2 mr-3 d-none d-sm-block">
      {{ itemTime }}&nbsp;
    </span>
    <span
      @click.capture="itemClick"
      :class="itemClass"
      v-html="itemMessage">
    </span>
  </v-layout>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Globals } from '@/globals'
import { ConsoleEntry } from '@/store/socket/types'

@Component({})
export default class ConsoleEntryWidget extends Vue {
  @Prop({ type: Object, required: true })
  value!: ConsoleEntry

  get knownCommands () {
    const availableCommands = this.$store.getters['socket/getAllGcodeCommands']
    const commands = new Set(Object.keys(availableCommands))
    const additional = [
      'TESTZ',
      'ABORT',
      'ACCEPT',
      'ADJUSTED',
      'GET_POSITION'
    ]
    additional.forEach(command => {
      if (!commands.has(command)) commands.add(command)
    })
    return commands
  }

  get itemMessage () {
    let message = this.value.message
    if (this.value.type === 'response') {
      message = this.value.message.replace(/([A-Z0-9_]{2,})/gm, (match, command) => {
        if (this.knownCommands.has(command)) return `<a class="primary--text text--lighten-1">${command.toUpperCase()}</a>`
        return match
      })
    }
    return (this.value.type === 'command')
      ? `${Globals.CONSOLE_SEND_PREFIX}<a class="primary--text text--lighten-1">${message}</a>`
      : message
  }

  get itemTime () {
    return (this.value.time)
      ? this.$dayjs(this.value.time * 1000).format('HH:mm:ss')
      : ''
  }

  get itemClass () {
    if (this.value.message.startsWith('!!')) {
      return { 'error--text': true }
    }

    if (this.value.message.startsWith('//')) {
      return { 'grey--text': true }
    }

    if (this.value.type === 'command') {
      return { 'primary--text text--lighten-1': true }
    }

    return { 'grey--text text--darken-1': true }
  }

  itemClick (event: Event) {
    const target = event.target as Element
    if (target.tagName.toLowerCase() === 'a') {
      this.$emit('click', target.innerHTML)
    }
  }
}
</script>

<style lang="scss" scoped>
  .console-item {
    flex: 0 0 auto;
  }
</style>
