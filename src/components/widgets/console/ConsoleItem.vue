<template>
  <v-layout class="console-item">
    <span
      v-if="itemTime"
      class="secondary--text mr-3 d-none d-sm-block text-no-wrap"
    >
      {{ itemTime }}&nbsp;
    </span>
    <span
      v-safe-html="itemMessage"
      :class="itemClass"
      @click.capture="itemClick"
    />
  </v-layout>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import { Globals } from '@/globals'
import type { ConsoleEntry } from '@/store/console/types'
import type { UpdateResponse } from '@/store/version/types'

@Component({})
export default class ConsoleItem extends Vue {
  @Prop({ type: Object, required: true })
  readonly value!: ConsoleEntry | UpdateResponse

  get knownCommands (): Moonraker.KlippyApis.GcodeHelpResponse {
    return this.$typedGetters['console/getAllKnownCommands']
  }

  get itemMessage () {
    const message = this.value.message

    if ('type' in this.value) {
      switch (this.value.type) {
        case 'command':
          return `${Globals.CONSOLE_SEND_PREFIX}<a class="primary--text text--lighten-1">${message}</a>`

        case 'response':
          return message
            .replace(/([A-Z_][A-Z0-9_.]+)/g, (match, command) => (
              command in this.knownCommands
                ? `<a class="primary--text text--lighten-1">${command.toUpperCase()}</a>`
                : match
            ))
      }
    }

    return message
  }

  get itemTime () {
    return (
      'time' in this.value &&
      this.value.time
    )
      ? this.$filters.formatTimeWithSeconds(this.value.time * 1000)
      : ''
  }

  get itemClass () {
    if (this.value.message.startsWith('!!')) {
      return { 'error--text': true }
    }

    if (
      'type' in this.value &&
      this.value.type === 'command'
    ) {
      return { 'primary--text': true }
    }

    return { 'secondary--text': true }
  }

  itemClick (event: Event) {
    if (event.target instanceof HTMLAnchorElement) {
      const command = event.target.innerHTML
        .replace(/<br>/g, '\n')
        .replace(/^\s+|\s+$/gm, '')

      this.$emit('click', command)
    }
  }
}
</script>

<style lang="scss" scoped>
  .console-item {
    flex: 0 0 auto;
  }
</style>
