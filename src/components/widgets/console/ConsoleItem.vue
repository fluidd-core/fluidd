<template>
  <v-layout class="console-item">
    <span
      v-if="itemTime"
      class="secondary--text mr-3 d-none d-sm-block text-no-wrap"
    >
      {{ itemTime }}&nbsp;
    </span>
    <span
      v-safe-html="{
        html: itemMessage,
        search
      }"
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
import { escapeHtml } from '@/util/html-helpers'
import { hasRenderableHtml } from '@/util/sanitize-html'

@Component({})
export default class ConsoleItem extends Vue {
  @Prop({ type: Object, required: true })
  readonly value!: ConsoleEntry | UpdateResponse

  @Prop({ type: String })
  readonly search?: string

  get knownCommands (): Moonraker.KlippyApis.GcodeHelpResponse {
    return this.$typedGetters['console/getAllKnownCommands']
  }

  get itemMessage () {
    const message = this.value.message
    const escapedMessage = escapeHtml(message)

    if ('type' in this.value) {
      switch (this.value.type) {
        case 'command':
          return `${Globals.CONSOLE_SEND_PREFIX}<a class="primary--text text--lighten-1">${escapedMessage}</a>`

        case 'response':
          if (hasRenderableHtml(message)) {
            return message
          }

          return escapedMessage
            .replace(/([A-Z_][A-Z0-9_.]+)/g, (match, command) => (
              command in this.knownCommands
                ? `<a class="primary--text text--lighten-1">${command.toUpperCase()}</a>`
                : match
            ))
      }
    }

    return escapedMessage
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
    const target = (
      event.target instanceof HTMLElement &&
      event.target.tagName === 'MARK'
    )
      ? event.target.parentElement
      : event.target

    if (target instanceof HTMLAnchorElement) {
      const command = target.innerText
        .replace(/^\s+|\s+$/gm, '')

      this.$emit('click', command)
    }
  }
}
</script>

<style lang="scss" scoped>
  .console-item {
    flex: 0 0 auto;

    :deep(img),
    :deep(svg),
    :deep(video) {
      height: auto;
      max-width: 90%;
      max-height: 250px;
      object-fit: contain;
    }

    :deep(mark) {
      background-color: #ff0;
      color: #000;
    }
  }
</style>
