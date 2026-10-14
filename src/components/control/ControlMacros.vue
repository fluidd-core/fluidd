<template>
  <control-card
    title="Macros"
    :locked="klippyReady ? '' : 'Klipper is not ready'"
    :note="klippyReady ? note : ''"
    data-tid="control-macros"
  >
    <template #aside>
      <label class="macros__find">
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
      <a
        class="macros__arrange"
        :href="arrangeLink"
        @click.prevent="$router.push(arrangeLink)"
      >Arrange</a>
    </template>
    <div class="macros__grid">
      <button
        v-for="macro in shown"
        :key="macro.name"
        type="button"
        class="macros__macro"
        :disabled="!klippyReady || (macro.disabledWhilePrinting && busy)"
        :title="macro.description"
        :data-tid="`macro-${macro.name}`"
        @click="sendGcode(macro.name)"
      >
        <span class="macros__name">{{ macro.name }}</span>
        <span
          v-if="macro.hint"
          class="macros__hint"
        >{{ macro.hint }}</span>
      </button>
      <p
        v-if="!shown.length"
        class="macros__none"
      >
        {{ query ? `No macro matches "${query}".` : 'This printer has no macros to show.' }}
      </p>
    </div>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import { visibleMacros, type MacroGroup } from '@/util/visible-macros'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import ControlCard from './ControlCard.vue'

interface MacroButton {
  name: string;
  hint: string;
  description: string;
  disabledWhilePrinting: boolean;
}

/** The parameters a macro reads, with their defaults where it gives them: TEMP=215. */
function paramHint (gcode: string): string {
  const seen = new Map<string, string>()
  const re = /params\.([A-Z_][A-Z0-9_]*)(?:\s*\|\s*default\(\s*([^)]+)\))?/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(gcode)) && seen.size < 2) {
    const name = m[1].toUpperCase()
    if (!seen.has(name)) seen.set(name, (m[2] ?? '').replace(/['"]/g, '').trim())
  }
  return [...seen].map(([k, v]) => (v ? `${k}=${v}` : k)).join(' ')
}

/** Pro: every macro the printer shows, to run with one press, and a box to find one. */
@Component({ components: { ControlCard } })
export default class ControlMacros extends Mixins(ControlMixin) {
  query = ''

  get macros (): MacroButton[] {
    return visibleMacros(this.$store.getters['macros/getVisibleMacros'] as MacroGroup[])
      .map(m => {
        const description = m.config?.description && m.config.description !== 'G-Code macro' ? String(m.config.description) : ''
        return {
          name: m.name.toUpperCase(),
          hint: paramHint(String(m.config?.gcode ?? '')) || description,
          description,
          disabledWhilePrinting: !!m.disabledWhilePrinting
        }
      })
  }

  get shown (): MacroButton[] {
    const q = this.query.trim().toLowerCase()
    return q ? this.macros.filter(m => m.name.toLowerCase().includes(q) || m.hint.toLowerCase().includes(q)) : this.macros
  }

  get note (): string {
    const n = this.macros.length
    return `${n} ${n === 1 ? 'macro' : 'macros'}. Hidden: those starting with _ (Settings › Macros).`
  }

  get arrangeLink (): string {
    return `${scopedPath('/settings', activeSlug())}#macros`
  }
}
</script>

<style lang="scss" scoped>
  .macros__find {
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

  .macros__arrange {
    color: var(--m3d-text-muted) !important;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
  }

  .macros__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 8px;
  }

  .macros__macro {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 52px;
    padding: 6px 10px;
    border-radius: 12px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    text-align: center;

    &:hover:not(:disabled) {
      box-shadow: inset 0 0 0 1px var(--m3d-border-strong);
    }

    &:disabled {
      opacity: 0.45;
      cursor: default;
    }
  }

  .macros__name {
    max-width: 100%;
    overflow: hidden;
    font-family: var(--m3d-font-mono);
    font-size: 12px;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .macros__hint {
    max-width: 100%;
    overflow: hidden;
    color: var(--m3d-text-subtle);
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .macros__none {
    grid-column: 1 / -1;
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }
</style>
