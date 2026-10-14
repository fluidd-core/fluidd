<template>
  <v-dialog
    v-model="open"
    max-width="660"
    :fullscreen="isMobileViewport"
    content-class="command-bar__dialog"
    @keydown.esc="open = false"
  >
    <div
      class="command-bar"
      data-tid="command-bar"
    >
      <div class="command-bar__field">
        <frame-icon name="search" />
        <input
          ref="input"
          v-model="query"
          type="text"
          placeholder="Search or run a command"
          aria-label="Search or run a command"
          autocomplete="off"
          spellcheck="false"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="runAt(selected)"
        >
        <span
          v-if="printerName"
          class="command-bar__chip"
        >{{ printerName }}</span>
        <button
          type="button"
          class="command-bar__close"
          aria-label="Close"
          @click="open = false"
        >
          <kbd v-if="!isMobileViewport">Esc</kbd>
          <frame-icon
            v-else
            name="x"
          />
        </button>
      </div>

      <div
        ref="list"
        class="command-bar__list"
        role="listbox"
        aria-label="Commands"
      >
        <template v-for="(command, i) in results">
          <div
            v-if="i === 0 || results[i - 1].group !== command.group"
            :key="`${command.group}-head`"
            class="command-bar__group"
          >
            {{ command.group }}
          </div>
          <button
            :key="command.id"
            type="button"
            role="option"
            class="command-bar__row"
            :class="{ 'command-bar__row--on': i === selected }"
            :aria-selected="i === selected ? 'true' : 'false'"
            :data-tid="`command-${command.id}`"
            @mousemove="selected = i"
            @click="runAt(i)"
          >
            <span class="command-bar__icon">
              <frame-icon
                :name="command.icon || 'chevronRight'"
                small
              />
            </span>
            <span class="command-bar__label">
              <template v-for="(segment, s) in segmentsOf(command)">
                <b
                  v-if="segment.match"
                  :key="s"
                >{{ segment.text }}</b>
                <template v-else>{{ segment.text }}</template>
              </template>
              <span
                v-if="command.hint"
                class="command-bar__hint"
              > · {{ command.hint }}</span>
            </span>
            <span class="command-bar__right">
              <template v-if="command.keys && keysOn && !isMobileViewport">
                <kbd
                  v-for="key in command.keys"
                  :key="key"
                >{{ key }}</kbd>
              </template>
              <span
                v-else-if="command.verb"
                class="command-bar__verb"
              >{{ command.verb }}</span>
            </span>
          </button>
        </template>
        <p
          v-if="!results.length"
          class="command-bar__empty"
        >
          Nothing matches "{{ query }}".
        </p>
      </div>

      <div
        v-if="!isMobileViewport"
        class="command-bar__foot"
      >
        <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
        <span><kbd>Enter</kbd> run</span>
        <span class="command-bar__grow" />
        <span v-if="inPrinter">Pro: start with <kbd>&gt;</kbd> to send G-code</span>
      </div>
    </div>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import FrameMixin from '@/mixins/frame'
import BrowserMixin from '@/mixins/browser'
import ServicesMixin from '@/mixins/services'
import { EventBus } from '@/eventBus'
import { SocketActions } from '@/api/socketActions'
import type { TemperaturePreset } from '@/store/config/types'
import { visibleMacros, type MacroGroup } from '@/util/visible-macros'
import type { MoonrakerRootFile } from '@/store/files/types'
import { highlight, rankCommands, type Command, type Segment } from '@/services/command-bar/rank'
import { ALL_PRINTERS_KEY, SECTIONS, visiblePages } from '@/router/printerSections'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug, knownPrinters, printerHomePath, printerPath, samePageFor } from '@/services/printer-pages'
import { cloudState } from '@/services/muon-cloud/state'
import { savedName } from '@/services/muon-cloud/directory'
import { setProMode } from '@/services/pro-mode'
import { jobName } from '@/services/printers-page/model'
import { plateCheckNeeded } from '@/services/jobs/plate'
import { printerNameParts } from '@/util/printer-name'
import { presetCommands, presetSummary } from '@/util/temperature-preset'

/** Enough G-code files to find one by name, without listing a whole archive. */
const MAX_JOBS = 300

/**
 * Search or run a command (Ctrl K): printers, pages, jobs, macros and the
 * printer's own actions, in one box. With Pro on, a line starting with >
 * is sent as G-code.
 */
@Component({})
export default class CommandBar extends Mixins(FrameMixin, BrowserMixin, ServicesMixin) {
  open = false
  query = ''
  selected = 0

  created () {
    window.addEventListener('keydown', this.onKey, false)
    EventBus.bus.$on('command-bar', this.show)
  }

  beforeDestroy () {
    window.removeEventListener('keydown', this.onKey)
    EventBus.bus.$off('command-bar', this.show)
  }

  /** Ctrl K or ⌘ K opens it from anywhere, even from a text box, unless shortcuts are off. */
  onKey (event: KeyboardEvent) {
    if (!this.keysOn) return
    if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      if (this.open) this.open = false
      else this.show()
    }
  }

  show () {
    this.query = ''
    this.selected = 0
    this.open = true
    // The job list loads with Jobs; the command bar asks for it when it hasn't.
    if (this.inPrinter && !this.$store.getters['files/getRootFiles']('gcodes')) {
      SocketActions.serverFilesListRoot('gcodes')
    }
    this.$nextTick(() => setTimeout(() => (this.$refs.input as HTMLInputElement | undefined)?.focus(), 50))
  }

  @Watch('query')
  onQuery () {
    this.selected = 0
  }

  get keysOn (): boolean {
    return this.$store.state.config.uiSettings.general.enableKeyboardShortcuts
  }

  get inPrinter (): boolean {
    return !!activeSlug() && this.socketConnected && this.authenticated
  }

  get printerName (): string | null {
    return this.inPrinter ? printerNameParts(this.$store.getters['config/getDisplayName'] as string).name : null
  }

  get gcode (): string | null {
    const q = this.query.trimStart()
    return q.startsWith('>') ? q.slice(1).trim() : null
  }

  get results (): Command[] {
    if (this.gcode !== null) return this.gcodeCommands
    return rankCommands(this.commands, this.query)
  }

  segmentsOf (command: Command): Segment[] {
    return highlight(command.label, this.gcode !== null ? '' : this.query)
  }

  move (by: number) {
    const n = this.results.length
    if (!n) return
    this.selected = (this.selected + by + n) % n
    this.$nextTick(() => {
      const row = (this.$refs.list as HTMLElement | undefined)?.querySelector('.command-bar__row--on')
      row?.scrollIntoView({ block: 'nearest' })
    })
  }

  async runAt (i: number) {
    const command = this.results[i]
    if (!command) return
    this.open = false
    await command.run()
  }

  go (path: string) {
    if (this.$route.fullPath !== path) this.$router.push(path).catch(() => {})
  }

  // -- the commands ----------------------------------------------------------

  get gcodeCommands (): Command[] {
    const gcode = this.gcode ?? ''
    if (!this.inPrinter) return []
    if (!this.pro) {
      return [{ id: 'pro-for-gcode', group: 'Do', label: 'Turn Pro on to send G-code', icon: 'console', run: () => setProMode(true) }]
    }
    if (!gcode) return []
    return [{
      id: 'send-gcode',
      group: 'Do',
      label: `Send ${gcode}`,
      hint: this.printerName ?? undefined,
      icon: 'console',
      verb: 'Send',
      run: () => this.sendGcode(gcode)
    }]
  }

  get commands (): Command[] {
    return [...this.doCommands, ...this.jobCommands, ...this.macroCommands, ...this.goCommands, ...this.printerCommands]
  }

  get doCommands (): Command[] {
    const list: Command[] = []
    const on = this.printerName ? ` on ${this.printerName}` : ''
    if (this.inPrinter && this.klippyReady) {
      if (this.printerPrinting) {
        list.push({ id: 'pause', group: 'Do', label: 'Pause the print', keys: ['Shift', 'P'], icon: 'jobs', suggested: true, run: () => this.pausePrint() })
      }
      if (this.printerPaused) {
        list.push({ id: 'resume', group: 'Do', label: 'Resume the print', keys: ['Shift', 'P'], icon: 'jobs', suggested: true, run: () => this.resumePrint() })
      }
      if (this.printerPrinting || this.printerPaused) {
        list.push({ id: 'cancel', group: 'Do', label: 'Stop the print', words: 'cancel abort', keys: ['Shift', 'C'], icon: 'x', run: () => this.cancelPrint() })
      } else {
        list.push({ id: 'home', group: 'Do', label: `Home all${on}`, words: 'axes g28', keys: ['Shift', 'H'], icon: 'control', suggested: true, run: () => this.homeAll() })
      }
      const presets = (this.$store.getters['config/getTempPresets'] as TemperaturePreset[]) ?? []
      presets.forEach((preset, i) => list.push({
        id: `preheat-${preset.id}`,
        group: 'Do',
        label: `Preheat ${preset.name}${on}`,
        hint: presetSummary(preset) || undefined,
        words: 'heat temperature warm material',
        icon: 'control',
        suggested: i === 0 && !this.printerPrinting,
        run: () => presetCommands(preset).forEach(g => this.sendGcode(g))
      }))
      list.push({
        id: 'cool-down',
        group: 'Do',
        label: `Cool down${on}`,
        words: 'heaters off turn_off_heaters cold',
        icon: 'control',
        run: async () => {
          if (this.printerPrinting && !(await this.$confirm('The printer is printing. With the heaters off, the print will most likely fail.', { title: 'Turn the heaters off?', buttonTrueText: 'Turn them off', buttonFalseText: 'Leave them on', danger: true }))) return
          this.sendGcode('TURN_OFF_HEATERS')
        }
      })
      if (this.pro) {
        list.push({ id: 'restart-klipper', group: 'Do', label: 'Restart Klipper', words: 'restart reload config', icon: 'refresh', run: () => this.restartKlippy() })
        list.push({ id: 'firmware-restart', group: 'Do', label: 'Firmware restart', words: 'firmware_restart mcu', icon: 'refresh', run: () => this.firmwareRestartKlippy() })
      }
    }
    if (this.inPrinter) {
      list.push({ id: 'estop', group: 'Do', label: 'Emergency stop', words: 'estop e-stop halt', keys: ['Ctrl', 'Shift', 'E'], icon: 'estop', run: () => this.emergencyStop() })
      if (!this.printerPrinting && !this.printerPaused) {
        list.push({ id: 'reboot', group: 'Do', label: "Restart the printer's computer", words: 'reboot host power', icon: 'power', run: () => this.hostCommand('reboot') })
        list.push({ id: 'shutdown', group: 'Do', label: "Shut down the printer's computer", words: 'shutdown host power off', icon: 'power', run: () => this.hostCommand('shutdown') })
      }
    }
    list.push({
      id: 'pro',
      group: 'Do',
      label: this.pro ? 'Turn Pro off' : 'Turn Pro on',
      words: 'pro mode advanced exact raw',
      keys: ['Shift', 'X'],
      icon: 'control',
      run: () => setProMode(!this.pro)
    })
    list.push({ id: 'keys', group: 'Do', label: 'Keyboard shortcuts', words: 'keys cheat sheet help', keys: ['?'], icon: 'keyboard', run: () => { EventBus.bus.$emit('keyboard-shortcuts') } })
    return list
  }

  async hostCommand (what: 'reboot' | 'shutdown') {
    const reboot = what === 'reboot'
    const ok = await this.$confirm(
      reboot ? 'The printer is out of reach for a minute or two while it restarts.' : 'It stays off until it is switched off and on again at the printer.',
      {
        title: reboot ? "Restart the printer's computer?" : "Shut down the printer's computer?",
        buttonTrueText: reboot ? 'Restart' : 'Shut down',
        danger: true
      }
    )
    if (!ok) return
    if (reboot) SocketActions.machineReboot()
    else SocketActions.machineShutdown()
  }

  get jobCommands (): Command[] {
    if (!this.inPrinter || !this.klippyReady || this.printerPrinting || this.printerPaused) return []
    const files = (this.$store.getters['files/getRootFiles']('gcodes') as MoonrakerRootFile[] | undefined) ?? []
    return [...files]
      .filter(f => /\.(gcode|g|gco|bgcode)$/i.test(f.path) && !f.path.split('/').some(part => part.startsWith('.')))
      .sort((a, b) => b.modified - a.modified)
      .slice(0, MAX_JOBS)
      .map(f => {
        const folder = f.path.includes('/') ? f.path.slice(0, f.path.lastIndexOf('/')) : ''
        return {
          id: `job-${f.path}`,
          group: 'Jobs' as const,
          label: jobName(f.path) ?? f.path,
          hint: folder || undefined,
          words: 'print',
          verb: 'Print',
          icon: 'jobs',
          run: () => this.printJob(f.path)
        }
      })
  }

  async printJob (path: string) {
    const name = jobName(path) ?? path
    const printer = this.printerName ?? 'The printer'
    const ok = await this.$confirm(`${printer} heats up, homes and starts printing.`, {
      title: `Print ${name} on ${this.printerName ?? 'this printer'}?`,
      buttonTrueText: 'Print now',
      plateCheck: plateCheckNeeded(this.$store.state.history?.jobs)
    })
    if (!ok) return
    const spoolman = this.$store.getters['spoolman/getAvailable'] && this.$store.state.config.uiSettings.spoolman.autoSpoolSelectionDialog
    if (spoolman) {
      this.$store.commit('spoolman/setDialogState', { show: true, filename: path })
      return
    }
    SocketActions.printerPrintStart(path)
    this.go(printerHomePath())
  }

  get macroCommands (): Command[] {
    if (!this.inPrinter || !this.klippyReady) return []
    const macros = visibleMacros(this.$store.getters['macros/getVisibleMacros'] as MacroGroup[])
    return macros.map(m => ({
      id: `macro-${m.name}`,
      group: 'Macros' as const,
      label: m.name.toUpperCase(),
      hint: m.config?.description && m.config.description !== 'G-Code macro' ? m.config.description : undefined,
      words: 'macro run',
      verb: 'Run',
      icon: 'console',
      run: () => this.sendGcode(m.name.toUpperCase())
    }))
  }

  get goCommands (): Command[] {
    const list: Command[] = [{
      id: 'go-printers',
      group: 'Go to',
      label: 'All printers',
      words: 'home fleet printers',
      keys: ['G', ALL_PRINTERS_KEY.toUpperCase()],
      icon: 'printers',
      suggested: !this.printerFrame,
      run: () => this.go('/')
    }]
    if (!activeSlug()) return list
    for (const section of SECTIONS) {
      if (section.shows && !section.shows(this.sectionContext)) continue
      const locked = section.pro && !this.pro
      list.push({
        id: `go-${section.id}`,
        group: 'Go to',
        label: section.label,
        hint: locked ? 'Pro: turns Pro on' : undefined,
        words: section.pages.map(p => p.label).join(' '),
        keys: locked ? undefined : ['G', section.key.toUpperCase()],
        icon: section.icon,
        suggested: section.id === 'jobs' || section.id === 'overview',
        run: () => {
          if (locked) setProMode(true)
          this.go(this.sectionTo(section))
        }
      })
      for (const page of visiblePages(section, this.sectionContext).slice(1)) {
        list.push({
          id: `go-${section.id}-${page.path}`,
          group: 'Go to',
          label: `${section.label} › ${page.label}`,
          icon: section.icon,
          run: () => this.go(scopedPath(page.path, activeSlug()))
        })
      }
    }
    return list
  }

  /** Each printer this browser knows, once; on a printer's page, the same page of the other. */
  get printerCommands (): Command[] {
    const seen = new Set<string>()
    const current = activeSlug()
    const list: Command[] = []
    for (const target of knownPrinters()) {
      if (seen.has(target.slug)) continue
      seen.add(target.slug)
      const raw = target.kind === 'local'
        ? savedName(target.instance)
        : cloudState.printers.find(p => p.id === target.printerId)?.name ?? target.slug
      const parts = printerNameParts(raw)
      const here = target.slug === current
      list.push({
        id: `printer-${target.slug}`,
        group: 'Printers',
        label: parts.name,
        hint: [parts.suffix, here ? 'open now' : target.kind === 'cloud' ? 'through Muon3D' : null].filter(Boolean).join(' · ') || undefined,
        words: `${target.slug} printer switch`,
        verb: 'Open',
        icon: 'printers',
        suggested: !here && list.length < 3,
        run: () => this.go(this.printerFrame ? samePageFor(this.$route, target.slug) : printerPath(target.slug))
      })
    }
    return list
  }
}
</script>

<style lang="scss" scoped>
  .command-bar {
    display: flex;
    flex-direction: column;
    max-height: min(640px, calc(100vh - 120px));
    overflow: hidden;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
    box-shadow: var(--m3d-shadow-float), inset 0 0 0 1px var(--m3d-border);
  }

  :deep(.command-bar__dialog.v-dialog--fullscreen) .command-bar {
    max-height: 100vh;
    height: 100%;
    border-radius: 0;
  }

  .command-bar__field {
    display: flex;
    flex: none;
    align-items: center;
    gap: 12px;
    padding: 18px 18px 14px 20px;
    border-bottom: 1px solid var(--m3d-border);
    color: var(--m3d-text-muted);

    input {
      flex: 1 1 0;
      min-width: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--m3d-text);
      font: inherit;
      font-size: 20px;

      // The field is the whole bar; a ring round the text box marks nothing.
      &:focus-visible {
        outline: none;
      }
    }
  }

  .command-bar__chip {
    flex: none;
    height: 28px;
    padding: 0 12px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 12px;
    font-weight: 500;
    line-height: 28px;
  }

  .command-bar__close {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 32px;
    border-radius: 8px;
    color: var(--m3d-text-muted);
  }

  .command-bar__list {
    flex: 1 1 auto;
    padding: 8px 10px 10px;
    overflow-y: auto;
  }

  .command-bar__group {
    padding: 12px 12px 6px;
    color: var(--m3d-text-muted);
    font-family: var(--m3d-font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .command-bar__row {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    width: 100%;
    min-height: 48px;
    padding: 0 12px;
    border-radius: 12px;
    color: var(--m3d-text);
    font-size: 14px;
    text-align: left;
  }

  .command-bar__row--on {
    background: var(--m3d-surface-2);
  }

  .command-bar__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 9px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }

  .command-bar__row--on .command-bar__icon {
    background: var(--m3d-accent-soft);
    color: var(--m3d-accent);
  }

  .command-bar__label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    b {
      color: var(--m3d-accent);
      font-weight: 700;
    }
  }

  .command-bar__hint {
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .command-bar__right {
    display: flex;
    align-items: center;
    gap: 4px;

    kbd {
      min-width: 22px;
      text-align: center;
    }
  }

  .command-bar__verb {
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .command-bar__empty {
    margin: 0;
    padding: 24px 12px;
    color: var(--m3d-text-muted);
    text-align: center;
  }

  .command-bar__foot {
    display: flex;
    flex: none;
    align-items: center;
    gap: 16px;
    padding: 12px 20px;
    border-top: 1px solid var(--m3d-border);
    color: var(--m3d-text-muted);
    font-size: 12px;

    kbd + kbd {
      margin-left: 2px;
    }

    kbd {
      margin-right: 4px;
    }
  }

  .command-bar__grow {
    flex: 1 1 auto;
  }
</style>

<style lang="scss">
  .v-dialog.command-bar__dialog:not(.v-dialog--fullscreen) {
    align-self: flex-start;
    margin-top: 12vh;
    overflow: visible;
    box-shadow: none;
  }
</style>
