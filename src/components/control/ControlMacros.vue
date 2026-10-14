<template>
  <control-card
    title="Macros"
    :locked="klippyReady ? '' : notReadyReason"
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

    <template v-for="group in shownGroups">
      <component
        :is="group.id === 'printer' && !query ? 'details' : 'section'"
        :key="group.id"
        class="macros__group"
        :data-tid="`macro-group-${group.id}`"
      >
        <component
          :is="group.id === 'printer' && !query ? 'summary' : 'h3'"
          class="macros__group-title"
        >
          {{ group.label }}
          <span>{{ group.macros.length }}</span>
        </component>
        <p
          v-if="group.id === 'printer'"
          class="macros__group-note"
        >
          Prompt buttons, hooks and replacements for standard commands. They run by themselves; press one only if you know why.
        </p>
        <div class="macros__grid">
          <button
            v-for="macro in group.macros"
            :key="macro.name"
            type="button"
            class="macros__macro"
            :disabled="!klippyReady || (macro.disabledWhilePrinting && busy) || macro.needsParams"
            :title="tooltipOf(macro)"
            :data-tid="`macro-${macro.name}`"
            @click="run(macro)"
          >
            <span class="macros__title">{{ macro.title }}</span>
            <span class="macros__name">{{ macro.name }}</span>
            <span
              v-if="macro.needsParams"
              class="macros__hint"
            >needs {{ macro.params.join(', ') }}: run it from the console</span>
            <span
              v-else-if="macro.description"
              class="macros__hint"
            >{{ macro.description }}</span>
          </button>
        </div>
      </component>
    </template>
    <p
      v-if="!shownGroups.length"
      class="macros__none"
    >
      {{ query ? `No macro matches "${query}".` : 'This printer has no macros to show.' }}
    </p>
  </control-card>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import ControlMixin from '@/mixins/control'
import MacrosMixin, { type ShownMacro, type ShownMacroGroup } from '@/mixins/macros'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import ControlCard from './ControlCard.vue'

/**
 * Pro: every macro the printer has, in groups by what it is for (filament,
 * moving, the nozzle, calibration...), the ones you'd press first at the
 * front of each. The ones the printer runs by itself sit folded at the end.
 * A macro that needs a value to run says so instead of running half-asked.
 */
@Component({ components: { ControlCard } })
export default class ControlMacros extends Mixins(ControlMixin, MacrosMixin) {
  query = ''

  get shownGroups (): ShownMacroGroup[] {
    const q = this.query.trim().toLowerCase()
    if (!q) return this.macroGroups
    const match = (m: ShownMacro) => [m.name, m.title, m.description].some(s => s.toLowerCase().includes(q))
    return this.macroGroups
      .map(g => ({ ...g, macros: g.macros.filter(match) }))
      .filter(g => g.macros.length)
  }

  get note (): string {
    const all = this.arrangedMacros.length
    const own = this.arrangedMacros.filter(m => m.group === 'printer').length
    return `${all} ${all === 1 ? 'macro' : 'macros'}, ${own} run by the printer itself. Grouped automatically; a group set under Settings › Macros wins.`
  }

  get arrangeLink (): string {
    return `${scopedPath('/settings', activeSlug())}#macros`
  }

  tooltipOf (macro: ShownMacro): string {
    return [macro.name, macro.description, macro.internal].filter(Boolean).join(' · ')
  }

  run (macro: ShownMacro) {
    if (macro.needsParams) return
    this.sendGcode(macro.name)
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
    color: var(--m3d-text-muted);
    font-family: var(--m3d-font-mono);
    font-size: 10px;
    font-weight: 600;
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

  .macros__group {
    display: flex;
    flex-direction: column;
    gap: 8px;

    & + & {
      margin-top: 14px;
    }
  }

  .macros__group-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
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

  summary.macros__group-title {
    cursor: pointer;
  }

  .macros__group-note {
    margin: 0;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .macros__title {
    max-width: 100%;
    overflow: hidden;
    font-size: 13px;
    font-weight: 600;
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
