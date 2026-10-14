<template>
  <div
    class="cons"
    :class="{ 'cons--phone': isMobileViewport }"
    data-tid="console-page"
  >
    <div class="cons__bar">
      <seg-picker
        :options="filterOptions"
        :value="filter"
        label="Show"
        @input="filter = $event"
      />
      <span class="cons__grow" />
      <label class="cons__find">
        <frame-icon
          name="search"
          small
        />
        <input
          v-model="find"
          type="search"
          placeholder="Find in log"
          aria-label="Find in log"
          data-tid="console-find"
        >
      </label>
      <button
        v-if="!isMobileViewport"
        type="button"
        class="cons__chip"
        :class="{ 'cons__chip--on': hideTempWaits }"
        :aria-pressed="hideTempWaits ? 'true' : 'false'"
        title="Hide the temperature lines Klipper prints while it waits to heat"
        @click="hideTempWaits = !hideTempWaits"
      >
        Hide heating lines
      </button>
      <button
        type="button"
        class="cbtn"
        data-tid="console-clear"
        @click="clear"
      >
        Clear
      </button>
      <button
        v-if="!isMobileViewport"
        type="button"
        class="cbtn"
        title="Download Klipper's full log from the printer"
        @click="downloadLog"
      >
        <frame-icon
          name="download"
          small
        />
        klippy.log
      </button>
    </div>

    <section
      class="cons__log"
      data-tid="console-log"
      aria-live="polite"
    >
      <dynamic-scroller
        ref="scroller"
        :items="shown"
        :min-item-size="22"
        key-field="key"
        class="cons__scroller"
        :buffer="600"
        @resize="toLatest()"
      >
        <template #default="{ item, index, active }">
          <dynamic-scroller-item
            :item="item"
            :active="active"
            :size-dependencies="[item.html, item.why]"
            :data-index="index"
          >
            <div
              class="cons__line"
              :class="`cons__line--${item.kind}`"
            >
              <time>{{ item.time }}</time>
              <span
                class="cons__msg"
                @click="onLineClick"
                v-html="item.html"
              />
              <span
                v-if="item.why"
                class="cons__why"
              >What this means: {{ item.why }}</span>
            </div>
          </dynamic-scroller-item>
        </template>
      </dynamic-scroller>
      <p
        v-if="!shown.length"
        class="cons__empty"
      >
        {{ find ? `Nothing in the log matches "${find}".` : filter === 'all' ? 'Nothing yet.' : `No ${filter} in the log.` }}
      </p>
      <button
        v-if="paused"
        type="button"
        class="cons__latest"
        @click="toLatest(true)"
      >
        Latest
        <frame-icon
          name="chevronDown"
          small
        />
      </button>
    </section>

    <div class="cons__input">
      <p
        v-if="help && !(open && list.length)"
        class="cons__help"
      >
        <code>{{ typedCommand }}</code> {{ help }}
      </p>
      <div class="cons__field">
        <ul
          v-if="open && list.length"
          class="cons__suggest"
          role="listbox"
          aria-label="Suggestions"
          data-tid="console-suggestions"
        >
          <li
            v-for="(s, i) in list"
            :key="`${s.from}-${s.text}`"
            role="option"
            :aria-selected="i === picked ? 'true' : 'false'"
            class="cons__option"
            :class="{ 'cons__option--on': i === picked }"
            @mousedown.prevent="take(s)"
          >
            <code>{{ s.text }}</code>
            <span>{{ s.hint }}</span>
          </li>
        </ul>
        <form
          class="cons__send"
          @submit.prevent="send"
        >
          <span aria-hidden="true">›</span>
          <input
            ref="input"
            v-model="command"
            type="text"
            spellcheck="false"
            autocomplete="off"
            :disabled="!klippyConnected"
            placeholder="Send G-code"
            aria-label="Send G-code"
            data-tid="console-input"
            @input="open = true; picked = -1"
            @keydown="onKey"
            @blur="open = false"
          >
          <button
            type="submit"
            class="cbtn cbtn--primary"
            :disabled="!klippyConnected || !command.trim()"
          >
            Send
          </button>
        </form>
      </div>
      <p class="cons__keys">
        Tab completes · ↑ history · Enter sends
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Ref, Watch } from 'vue-property-decorator'
import StateMixin from '@/mixins/state'
import FilesMixin from '@/mixins/files'
import BrowserMixin from '@/mixins/browser'
import { SocketActions } from '@/api/socketActions'
import { Globals } from '@/globals'
import type { ConsoleEntry, GcodeHelp } from '@/store/console/types'
import { commandHelp, entryKind, explain, filterEntries, suggestions, type LogFilter, type Suggestion } from '@/services/console/model'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'

interface Line {
  key: string;
  kind: string;
  time: string;
  html: string;
  why: string | null;
}

/**
 * Console (Pro): the printer's log, filtered to commands, warnings or
 * errors and searched, with a plain sentence under the errors people
 * meet most; a line to send G-code that suggests what you've sent before
 * and Klipper's commands with their help. A command in the log, clicked,
 * goes into the line.
 */
@Component({ components: { SegPicker } })
export default class Console extends Mixins(StateMixin, FilesMixin, BrowserMixin) {
  @Ref('scroller')
  readonly scroller!: { $el: HTMLElement, scrollToBottom: () => void }

  filter: LogFilter = 'all'
  find = ''
  command = ''
  open = false
  picked = -1
  /** Where ↑ has got to in the history; -1 is the line being typed. */
  back = -1
  paused = false

  get entries (): ConsoleEntry[] {
    return (this.$store.getters['console/getConsoleEntries'] as ConsoleEntry[]) ?? []
  }

  get errorCount (): number {
    return this.entries.filter(e => entryKind(e) === 'error').length
  }

  get filterOptions (): SegOption[] {
    return [
      { value: 'all', label: 'All' },
      { value: 'commands', label: 'Commands' },
      { value: 'warnings', label: 'Warnings' },
      { value: 'errors', label: this.errorCount ? `Errors · ${this.errorCount}` : 'Errors' }
    ]
  }

  get knownCommands (): GcodeHelp {
    return (this.$store.getters['console/getAllKnownCommands'] as GcodeHelp) ?? {}
  }

  get shown (): Line[] {
    return filterEntries(this.entries, this.filter, this.find).map((e, i) => {
      const kind = entryKind(e)
      return {
        key: `${e.id ?? 'n'}-${e.time ?? 0}-${i}`,
        kind,
        time: e.time ? this.$filters.formatTimeWithSeconds(e.time * 1000) : '',
        html: this.linked(e, kind),
        why: kind === 'error' || kind === 'warning' ? explain(e.message) : null
      }
    })
  }

  /** Commands Klipper knows, in a reply, become links that put them in the line, as Fluidd's console does. */
  linked (e: ConsoleEntry, kind: string): string {
    if (kind === 'command') return `${Globals.CONSOLE_SEND_PREFIX}<a class="cons__cmd">${e.message}</a>`
    return e.message.replace(/\b([A-Z][A-Z0-9_]{2,})\b/g, (match, word: string) => (word in this.knownCommands ? `<a class="cons__cmd">${word}</a>` : match))
  }

  onLineClick (event: MouseEvent) {
    const target = event.target as HTMLElement
    if (target.tagName !== 'A') return
    this.command = (target.textContent ?? '').trim()
    this.open = false;
    (this.$refs.input as HTMLInputElement).focus()
  }

  // -- the log's scrolling ------------------------------------------------------

  mounted () {
    this.scroller.$el.addEventListener('scroll', this.onScroll)
    this.$nextTick(() => this.toLatest(true))
  }

  beforeDestroy () {
    this.scroller.$el.removeEventListener('scroll', this.onScroll)
  }

  /** Scrolled up to read, the log stays put; at the bottom, it follows. */
  onScroll () {
    const el = this.scroller.$el
    this.paused = el.scrollHeight - el.scrollTop - el.clientHeight > 4
  }

  @Watch('shown')
  onShown () {
    this.$nextTick(() => this.toLatest())
  }

  toLatest (force = false) {
    if (this.paused && !force) return
    this.scroller?.scrollToBottom()
    if (force) this.paused = false
  }

  // -- the bar ------------------------------------------------------------------------

  get hideTempWaits (): boolean {
    return !!this.$store.state.config.uiSettings.general.hideTempWaits
  }

  set hideTempWaits (value: boolean) {
    this.$store.dispatch('config/saveByPath', { path: 'uiSettings.general.hideTempWaits', value, server: true })
  }

  clear () {
    this.$store.dispatch('console/onClear')
  }

  downloadLog () {
    this.downloadFile('klippy.log', 'logs')
  }

  // -- the line ---------------------------------------------------------------------

  /** Sent commands, newest first, as Fluidd keeps them (repeats included, so they can be counted). */
  get history (): string[] {
    return (this.$store.state.console.commandHistory as string[]) ?? []
  }

  get uniqueHistory (): string[] {
    return [...new Set(this.history)]
  }

  get list (): Suggestion[] {
    return suggestions(this.command, this.knownCommands, this.history)
  }

  get typedCommand (): string {
    return this.command.trim().split(/\s/)[0]?.toUpperCase() ?? ''
  }

  get help (): string | null {
    return commandHelp(this.command, this.knownCommands)
  }

  take (s: Suggestion) {
    this.command = s.from === 'command' ? `${s.text} ` : s.text
    this.open = false
    this.picked = -1
  }

  onKey (event: KeyboardEvent) {
    const listing = this.open && this.list.length > 0
    switch (event.key) {
      case 'Tab':
        if (!listing) return
        this.take(this.list[Math.max(0, this.picked)])
        break
      case 'ArrowDown':
        if (listing) this.picked = Math.min(this.list.length - 1, this.picked + 1)
        else this.recall(-1)
        break
      case 'ArrowUp':
        if (listing && this.picked > 0) this.picked--
        else if (listing && this.picked === 0) this.picked = -1
        else this.recall(1)
        break
      case 'Enter':
        if (listing && this.picked >= 0) this.take(this.list[this.picked])
        else return
        break
      case 'Escape':
        if (!listing) return
        this.open = false
        break
      default:
        return
    }
    event.preventDefault()
  }

  /** ↑ goes back through what was sent, ↓ forward again, to an empty line. */
  recall (by: number) {
    const next = Math.max(-1, Math.min(this.uniqueHistory.length - 1, this.back + by))
    this.back = next
    this.command = next < 0 ? '' : this.uniqueHistory[next]
    this.open = false
  }

  send () {
    const gcode = this.command.trim()
    if (!gcode || !this.klippyConnected) return
    // Typed M112 also asks Moonraker for the emergency stop, as Fluidd's console does.
    if (gcode.toLowerCase() === 'm112') SocketActions.printerEmergencyStop()
    this.sendGcode(gcode)
    this.$store.dispatch('console/onUpdateCommandHistory', [gcode, ...this.history].slice(0, Globals.CONSOLE_COMMAND_HISTORY))
    this.command = ''
    this.back = -1
    this.open = false
    this.toLatest(true)
  }
}
</script>

<style lang="scss" scoped>
  // The page fills the window below the header, so the line to send from is always in view and the log takes the rest.
  .cons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
    height: calc(100vh - 250px);
    height: calc(100svh - 250px);
    min-height: 460px;
  }

  .cons__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .cons__grow {
    flex: 1 1 auto;
  }

  .cons__find {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: 220px;
    height: 40px;
    padding: 0 12px;
    border-radius: 12px;
    background: var(--m3d-surface);
    color: var(--m3d-text-muted);

    input {
      flex: 1 1 0;
      min-width: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--m3d-text);
      font: inherit;
      font-size: 14px;
    }
  }

  .cons__chip {
    height: 32px;
    padding: 0 12px;
    border-radius: 999px;
    box-shadow: inset 0 0 0 1px var(--m3d-border-strong);
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .cons__chip--on {
    background: rgba(128, 214, 209, 0.14);
    box-shadow: inset 0 0 0 1px rgba(128, 214, 209, 0.5);
    color: var(--m3d-accent);
  }

  .cons__log {
    position: relative;
    flex: 1 1 0;
    min-height: 160px;
    overflow: hidden;
    border-radius: 22px;
    background: var(--m3d-surface);
  }

  .cons__scroller {
    height: 100%;
    padding: 12px 18px;
  }

  .cons__line {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    column-gap: 14px;
    padding: 2px 0;
    font-family: var(--m3d-font-mono, monospace);
    font-size: 12.5px;
    line-height: 1.6;

    time {
      color: var(--m3d-text-subtle);
      white-space: nowrap;
    }
  }

  .cons__msg {
    min-width: 0;
    color: var(--m3d-text-muted);
    overflow-wrap: anywhere;
    white-space: pre-wrap;

    :deep(.cons__cmd) {
      color: var(--m3d-accent);
      cursor: pointer;
      text-decoration: none;
    }
  }

  .cons__line--command .cons__msg {
    color: var(--m3d-accent);
  }

  .cons__line--error .cons__msg {
    color: var(--m3d-danger);
  }

  .cons__line--warning .cons__msg {
    color: var(--m3d-warning, #ff9f0a);
  }

  .cons__why {
    grid-column: 2;
    margin: 4px 0 6px;
    padding: 8px 12px;
    border-radius: 10px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-family: var(--m3d-font-sans, inherit);
    font-size: 13px;
    line-height: 1.45;
  }

  .cons__empty {
    position: absolute;
    top: 16px;
    left: 18px;
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .cons__latest {
    position: absolute;
    right: 16px;
    bottom: 14px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 34px;
    padding: 0 14px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    box-shadow: var(--m3d-shadow-float, 0 4px 16px rgb(0 0 0 / 40%));
    color: var(--m3d-text);
    font-size: 13px;
    font-weight: 600;
  }

  .cons__input {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .cons__field {
    position: relative;
  }

  .cons__suggest {
    position: absolute;
    right: 0;
    bottom: calc(100% + 6px);
    left: 0;
    z-index: 3;
    margin: 0;
    padding: 6px;
    border-radius: 16px;
    background: var(--m3d-surface-2);
    box-shadow: var(--m3d-shadow-float, 0 8px 24px rgb(0 0 0 / 45%));
    list-style: none;
  }

  .cons__option {
    display: flex;
    align-items: baseline;
    gap: 14px;
    padding: 7px 10px;
    border-radius: 10px;
    cursor: pointer;

    code {
      overflow: hidden;
      background: none;
      color: var(--m3d-text);
      font-size: 13px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      flex: none;
      margin-left: auto;
      color: var(--m3d-text-muted);
      font-size: 12px;
    }
  }

  .cons__option--on {
    background: rgba(128, 214, 209, 0.12);
  }

  .cons__help {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;

    code {
      background: none;
      color: var(--m3d-accent);
    }
  }

  .cons__send {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 6px 6px 16px;
    border-radius: 16px;
    background: var(--m3d-surface);
    color: var(--m3d-text-subtle);
    font-family: var(--m3d-font-mono, monospace);

    input {
      flex: 1 1 auto;
      min-width: 0;
      height: 40px;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--m3d-text);
      font: inherit;
      font-size: 14px;
    }
  }

  // The ring goes round the well, not the text box in it.
  .cons__send input:focus-visible,
  .cons__find input:focus-visible {
    outline: none;
  }

  .cons__send:focus-within,
  .cons__find:focus-within {
    box-shadow: 0 0 0 2px var(--m3d-accent);
  }

  .cons__keys {
    margin: 0;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  // A phone has no page title here, and a tab bar under the page.
  .cons--phone {
    height: calc(100svh - 190px);
    min-height: 380px;

    .cons__find {
      flex: 1 1 auto;
      width: auto;
    }

    .cons__scroller {
      padding: 10px 12px;
    }

    .cons__keys {
      display: none;
    }
  }
</style>
