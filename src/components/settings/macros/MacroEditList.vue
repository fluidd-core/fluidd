<template>
  <section
    class="medit"
    data-tid="macro-edit-list"
  >
    <header class="medit__head">
      <div>
        <h2>Edit a macro</h2>
        <p>{{ headline }}</p>
      </div>
      <label class="medit__find">
        <frame-icon
          name="search"
          small
        />
        <input
          v-model="query"
          type="search"
          placeholder="Find"
          aria-label="Find a macro"
        >
      </label>
    </header>

    <p
      v-if="!editable"
      class="medit__note"
      data-tid="macro-edit-readonly"
    >
      Developer mode is off, so each macro opens to read. Turn developer mode on to change them.
      <router-link :to="developerTo">
        Developer mode
      </router-link>
    </p>

    <component
      :is="group.id === 'printer' && !query ? 'details' : 'section'"
      v-for="group in groups"
      :key="group.id"
      class="medit__group"
    >
      <component
        :is="group.id === 'printer' && !query ? 'summary' : 'h3'"
        class="medit__group-title"
      >
        {{ group.label }} <span>{{ group.macros.length }}</span>
      </component>
      <div
        v-for="m in group.macros"
        :key="m.name"
        class="medit__row"
      >
        <div class="medit__what">
          <b>{{ m.title }}</b>
          <span>{{ m.name }}{{ placeText(m.name) }}</span>
        </div>
        <button
          type="button"
          class="cbtn"
          :disabled="!placeOf(m.name)"
          :data-tid="`edit-macro-${m.name}`"
          @click="open(m.name)"
        >
          {{ editable ? 'Edit' : 'Read' }}
        </button>
      </div>
    </component>

    <p
      v-if="error"
      class="medit__note"
    >
      {{ error }}
    </p>
  </section>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import MacrosMixin, { type ShownMacroGroup } from '@/mixins/macros'
import { devModeState, refreshDevMode } from '@/services/dev-mode/state'
import { macroPlacesOn } from '@/services/macros/places'
import type { MacroPlace } from '@/services/macros/locate'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug } from '@/services/printer-pages'

/**
 * Settings › Macros, first: every macro in its group with where it is
 * written, and Edit, which opens the Files editor at its [gcode_macro]
 * line. With developer mode off they open to read: the Muon3D defaults
 * can't be changed, and the copy developer mode edits isn't in use.
 */
@Component({})
export default class MacroEditList extends Mixins(MacrosMixin) {
  query = ''
  places: Map<string, MacroPlace> = new Map()
  error = ''
  dev = devModeState

  mounted () {
    refreshDevMode().then(() => this.load())
  }

  get registered (): string[] {
    return (this.$store.state.server.info.registered_directories as string[] | undefined) ?? []
  }

  /** Where the macros are read from: the editable copy in developer mode, else the defaults the printer runs. */
  get root (): string {
    if (this.dev.enabled || !this.registered.includes('defaults')) return 'config'
    return 'defaults'
  }

  /** The config folder is the printer's to change unless developer mode says it's off (an M1's copy is read only then). */
  get editable (): boolean {
    return this.root === 'config' && this.dev.enabled !== false
  }

  get headline (): string {
    const n = this.arrangedMacros.length
    return `${n} ${n === 1 ? 'macro' : 'macros'}, in the groups Control shows them in`
  }

  @Watch('root')
  onRoot () {
    this.load()
  }

  async load () {
    this.error = ''
    try {
      this.places = await macroPlacesOn(this.root)
    } catch {
      this.error = 'The printer didn\'t list its config files. Try again in a moment.'
    }
  }

  get groups (): ShownMacroGroup[] {
    const q = this.query.trim().toLowerCase()
    if (!q) return this.macroGroups
    return this.macroGroups
      .map(g => ({ ...g, macros: g.macros.filter(m => [m.name, m.title, m.description].some(s => s.toLowerCase().includes(q))) }))
      .filter(g => g.macros.length)
  }

  placeOf (name: string): MacroPlace | undefined {
    return this.places.get(name.toUpperCase())
  }

  /** " · macros/filament.cfg:49", or nothing until it's found. */
  placeText (name: string): string {
    const place = this.placeOf(name)
    return place ? ` · ${place.path}:${place.line}` : ''
  }

  get developerTo (): string {
    return `${scopedPath('/settings', activeSlug())}#developer`
  }

  open (name: string) {
    const place = this.placeOf(name)
    if (!place) return
    this.$router.push({
      path: scopedPath('/configure', activeSlug()),
      query: { open: `${place.root}/${place.path}`, line: String(place.line) }
    })
  }
}
</script>

<style lang="scss" scoped>
  .medit {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
    padding: 20px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
  }

  .medit__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }

    p {
      margin: 2px 0 0;
      color: var(--m3d-text-muted);
      font-size: 13px;
    }
  }

  .medit__find {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: 180px;
    height: 32px;
    padding: 0 10px;
    border-radius: 10px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);

    input {
      flex: 1 1 0;
      min-width: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--m3d-text);
      font: inherit;
      font-size: 13px;
    }
  }

  .medit__note {
    margin: 0;
    padding: 10px 12px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text-muted);
    font-size: 13px;

    a {
      color: var(--m3d-accent) !important;
      font-weight: 600;
    }
  }

  .medit__group-title {
    margin: 6px 0 2px;
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;

    span {
      color: var(--m3d-text-subtle);
      font-weight: 500;
    }
  }

  summary.medit__group-title {
    cursor: pointer;
  }

  .medit__row {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;

    & + & {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .medit__what {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    min-width: 0;

    b {
      font-size: 14px;
      font-weight: 600;
    }

    span {
      overflow: hidden;
      color: var(--m3d-text-subtle);
      font-family: var(--m3d-font-mono);
      font-size: 11px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
</style>
