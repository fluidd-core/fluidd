<template>
  <section
    class="ov-card ov-console"
    data-tid="overview-console"
  >
    <div class="ov-card__head">
      <h2 class="ov-card__title">
        Console
      </h2>
      <router-link
        :to="consoleTo"
        class="ov-console__open"
      >
        Open console
      </router-link>
    </div>
    <ol
      class="ov-console__lines"
      aria-live="polite"
    >
      <li
        v-for="line in lines"
        :key="line.id"
        class="ov-console__line"
        :class="`ov-console__line--${line.type}`"
      >
        <time>{{ line.time }}</time>
        <span>{{ line.text }}</span>
      </li>
      <li
        v-if="!lines.length"
        class="ov-console__empty"
      >
        Nothing yet.
      </li>
    </ol>
    <form
      class="ov-console__send"
      @submit.prevent="send"
    >
      <span aria-hidden="true">›</span>
      <input
        v-model="command"
        type="text"
        spellcheck="false"
        autocomplete="off"
        :disabled="!klippyReady"
        placeholder="Send G-code · Enter sends · ↑ for the last one"
        aria-label="Send G-code"
        data-tid="overview-console-input"
        @keydown.up.prevent="recall"
      >
    </form>
  </section>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import { Globals } from '@/globals'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import type { ConsoleEntry } from '@/store/console/types'

/** How many of the console's last lines Overview shows. */
const SHOWN = 6

/**
 * The console's last lines on Pro's Overview, with a line to send G-code
 * from; the Console page has the rest.
 */
@Component({})
export default class OverviewConsole extends Mixins(StateMixin) {
  command = ''

  get consoleTo (): string {
    return scopedPath('/console', activeSlug())
  }

  get lines (): Array<{ id: number, time: string, text: string, type: string }> {
    const entries = (this.$store.state.console.console as ConsoleEntry[]) ?? []
    return entries.slice(-SHOWN).map((e, i) => ({
      id: e.id ?? i,
      time: clock(e.time),
      // Console messages are sanitised HTML; the strip shows their text.
      text: (e.message ?? '').replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim(),
      type: e.type
    }))
  }

  send () {
    const gcode = this.command.trim()
    if (!gcode || !this.klippyReady) return
    this.sendGcode(gcode)
    // The Console page's history: newest first, the same length it keeps.
    const history = (this.$store.state.console.commandHistory as string[]) ?? []
    this.$store.dispatch('console/onUpdateCommandHistory', [gcode, ...history.filter(h => h !== gcode)].slice(0, Globals.CONSOLE_COMMAND_HISTORY))
    this.command = ''
  }

  /** The last command sent, back in the line. */
  recall () {
    const history = (this.$store.state.console.commandHistory as string[]) ?? []
    if (history.length) this.command = history[0]
  }
}

function clock (seconds?: number): string {
  if (!seconds) return ''
  const d = new Date(seconds * 1000)
  const two = (n: number) => String(n).padStart(2, '0')
  return `${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`
}
</script>

<style lang="scss" scoped>
  .ov-console__open {
    color: var(--m3d-accent) !important;
    font-size: 13px;
    text-decoration: none;
  }

  .ov-console__lines {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-family: var(--m3d-font-mono, monospace);
    font-size: 12.5px;
  }

  .ov-console__line {
    display: flex;
    gap: 12px;
    min-width: 0;

    time {
      flex: none;
      color: var(--m3d-text-subtle);
    }

    span {
      overflow: hidden;
      color: var(--m3d-text-muted);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .ov-console__line--command span {
    color: var(--m3d-accent);
  }

  .ov-console__empty {
    color: var(--m3d-text-subtle);
  }

  .ov-console__send {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 0 12px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-subtle);
    font-family: var(--m3d-font-mono, monospace);

    input {
      flex: 1 1 auto;
      min-width: 0;
      height: 38px;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--m3d-text);
      font: inherit;
      font-size: 13px;
    }
  }
</style>
