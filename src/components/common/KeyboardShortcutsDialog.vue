<template>
  <v-dialog
    v-model="open"
    max-width="1080"
    :fullscreen="isMobileViewport"
    content-class="keys-sheet__dialog"
  >
    <div
      class="keys-sheet"
      data-tid="keyboard-shortcuts"
    >
      <div class="keys-sheet__head">
        <div class="keys-sheet__titles">
          <h2 class="keys-sheet__title">
            Keyboard shortcuts
          </h2>
          <span class="keys-sheet__about">
            Keys never fire while you're typing in a box, except E-STOP. Also in your account menu.
          </span>
        </div>
        <div class="keys-sheet__tools">
          <button
            type="button"
            role="switch"
            class="keys-sheet__switch"
            :aria-checked="enableKeyboardShortcuts ? 'true' : 'false'"
            data-tid="shortcuts-on"
            @click="toggleShortcuts"
          >
            Shortcuts on
            <span
              class="keys-sheet__toggle"
              :class="{ 'keys-sheet__toggle--on': enableKeyboardShortcuts }"
            />
          </button>
          <button
            type="button"
            class="keys-sheet__close"
            aria-label="Close"
            @click="open = false"
          >
            <frame-icon name="x" />
          </button>
        </div>
      </div>

      <div class="keys-sheet__columns">
        <section
          v-for="column in columns"
          :key="column.title"
          class="keys-sheet__column"
        >
          <span class="keys-sheet__caps">{{ column.title }}</span>
          <div
            v-for="row in column.rows"
            :key="row.what"
            class="keys-sheet__row"
          >
            <span class="keys-sheet__keys">
              <template v-for="(key, i) in row.keys">
                <span
                  v-if="key === '–' || key === '·'"
                  :key="i"
                  class="keys-sheet__sep"
                >{{ key }}</span>
                <kbd
                  v-else
                  :key="i"
                >{{ key }}</kbd>
              </template>
            </span>
            <span
              class="keys-sheet__what"
              :class="{ 'keys-sheet__what--strong': row.strong }"
            >
              {{ row.what }}
              <span
                v-if="row.note"
                class="keys-sheet__note"
              >{{ row.note }}</span>
            </span>
          </div>
        </section>
      </div>
    </div>
  </v-dialog>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import { EventBus } from '@/eventBus'
import BrowserMixin from '@/mixins/browser'
import { SECTIONS } from '@/router/printerSections'
import { eventTargetIsContentEditable, keyboardEventToKeyboardShortcut } from '@/util/event-helpers'

interface KeyRow {
  keys: string[];
  what: string;
  note?: string;
  strong?: boolean;
}

/** G and a section's key, as the sheet writes it. */
function goKeys (id: string): string[] {
  const section = SECTIONS.find(s => s.id === id)
  return section ? ['G', section.key.toUpperCase()] : []
}

/**
 * Every key on one sheet (`?`): those that work anywhere, those that go to
 * a printer's pages, and those that act on the printer. The switch turns
 * them all on or off for this printer.
 */
@Component({})
export default class KeyboardShortcutsDialog extends Mixins(BrowserMixin) {
  open = false

  get enableKeyboardShortcuts (): boolean {
    return this.$store.state.config.uiSettings.general.enableKeyboardShortcuts
  }

  toggleShortcuts () {
    this.$store.dispatch('config/saveByPath', {
      path: 'uiSettings.general.enableKeyboardShortcuts',
      value: !this.enableKeyboardShortcuts,
      server: true
    })
  }

  get commandKeys (): string[] {
    return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? ['⌘', 'K'] : ['Ctrl', 'K']
  }

  get columns (): Array<{ title: string, rows: KeyRow[] }> {
    return [
      {
        title: 'Anywhere',
        rows: [
          { keys: ['?'], what: 'This sheet' },
          { keys: this.commandKeys, what: 'Search or run a command' },
          { keys: ['G', 'P'], what: 'All printers' },
          { keys: ['[', ']'], what: 'Previous or next printer, same page' },
          { keys: ['1', '–', '9'], what: 'On Printers: open that one' },
          { keys: ['Shift', 'X'], what: 'Pro on or off' },
          { keys: ['Esc'], what: 'Close a sheet or a menu' }
        ]
      },
      {
        title: 'Go to, in a printer',
        rows: [
          { keys: goKeys('overview'), what: 'Overview' },
          { keys: goKeys('jobs'), what: 'Jobs' },
          { keys: goKeys('control'), what: 'Control' },
          { keys: goKeys('slice'), what: 'Slice' },
          { keys: goKeys('camera'), what: 'Camera' },
          { keys: goKeys('maintenance'), what: 'Maintenance' },
          { keys: ['G', 'S', '·', 'W', '·', 'U'], what: 'Settings · Network · Updates' },
          { keys: ['G', 'T', '·', 'F'], what: 'Console · Files', note: '(Pro)' }
        ]
      },
      {
        title: 'Act on this printer',
        rows: [
          { keys: ['U'], what: 'Upload a file to print' },
          { keys: ['F'], what: 'On Camera: full screen' },
          { keys: ['Shift', 'P'], what: 'Pause, or resume' },
          { keys: ['Shift', 'C'], what: 'Stop the print' },
          { keys: ['Shift', 'H'], what: 'Home all' },
          { keys: ['Ctrl', 'Shift', 'E'], what: 'Emergency stop, works everywhere', strong: true }
        ]
      }
    ]
  }

  openFromElsewhere () {
    this.open = true
  }

  handleKeyDown (event: KeyboardEvent) {
    if (!this.enableKeyboardShortcuts) {
      return
    }

    const shortcut = keyboardEventToKeyboardShortcut(event)

    if (
      ['?', 'Shift+?'].includes(shortcut) &&
      !eventTargetIsContentEditable(event)
    ) {
      event.preventDefault()

      this.open = true
    }
  }

  created () {
    window.addEventListener('keydown', this.handleKeyDown, false)
    EventBus.bus.$on('keyboard-shortcuts', this.openFromElsewhere)
  }

  beforeDestroy () {
    window.removeEventListener('keydown', this.handleKeyDown)
    EventBus.bus.$off('keyboard-shortcuts', this.openFromElsewhere)
  }
}
</script>

<style lang="scss" scoped>
  .keys-sheet {
    display: flex;
    flex-direction: column;
    gap: 18px;
    padding: 24px 26px 26px;
    border-radius: 26px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
    box-shadow: var(--m3d-shadow-float), inset 0 0 0 1px var(--m3d-border);
  }

  .keys-sheet__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .keys-sheet__titles {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .keys-sheet__title {
    margin: 0;
    font-size: 22px;
    font-weight: 700;
  }

  .keys-sheet__about {
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .keys-sheet__tools {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .keys-sheet__switch {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .keys-sheet__toggle {
    position: relative;
    width: 36px;
    height: 22px;
    border-radius: 11px;
    background: var(--m3d-switch-off, var(--m3d-border-strong));

    &::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #fff;
      transition: left var(--m3d-duration-fast) var(--m3d-ease);
    }
  }

  .keys-sheet__toggle--on {
    background: var(--m3d-accent);

    &::after {
      left: 16px;
    }
  }

  .keys-sheet__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
  }

  .keys-sheet__columns {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 8px 32px;
  }

  .keys-sheet__column {
    display: flex;
    flex-direction: column;
  }

  .keys-sheet__caps {
    padding: 6px 0 8px;
    color: var(--m3d-text-muted);
    font-family: var(--m3d-font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .keys-sheet__row {
    display: grid;
    grid-template-columns: 128px minmax(0, 1fr);
    align-items: center;
    gap: 12px;
    min-height: 36px;
    font-size: 14px;

    & + & {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .keys-sheet__keys {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;

    kbd {
      min-width: 22px;
      text-align: center;
    }
  }

  .keys-sheet__sep {
    color: var(--m3d-text-subtle);
  }

  .keys-sheet__what--strong {
    font-weight: 600;
  }

  .keys-sheet__note {
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }
</style>

<style lang="scss">
  .v-dialog.keys-sheet__dialog {
    box-shadow: none;
  }
</style>
