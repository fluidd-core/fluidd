<template>
  <section
    class="ov-card ov-plate"
    data-tid="overview-plate"
  >
    <template v-if="objects.length">
      <div class="ov-card__head">
        <h2 class="ov-card__title">
          Objects on the plate
        </h2>
        <span class="ov-card__aside">skip one if it fails</span>
      </div>
      <div class="ov-plate__objects">
        <div
          v-for="o in objects"
          :key="o.name"
          class="ov-plate__object"
          :class="{ 'ov-plate__object--skipped': o.skipped }"
        >
          <span
            class="ov-plate__dot"
            :class="{ 'ov-plate__dot--now': o.current }"
          />
          <span class="ov-plate__name">{{ o.label }}</span>
          <button
            v-if="!o.skipped"
            type="button"
            class="ov-plate__skip"
            :disabled="!klippyReady || !busy"
            @click="skip(o.name)"
          >
            Skip
          </button>
          <span
            v-else
            class="ov-plate__skipped"
          >skipped</span>
        </div>
      </div>
    </template>

    <div class="ov-card__head">
      <h2 class="ov-card__title">
        Macros
      </h2>
      <router-link
        class="ov-card__link"
        :to="pagePath('/control')"
      >
        All {{ macros.length }}
      </router-link>
    </div>
    <div class="ov-plate__macros">
      <button
        v-for="m in pinned"
        :key="m"
        type="button"
        class="ov-plate__macro"
        :disabled="!klippyReady"
        @click="sendGcode(m)"
      >
        {{ m }}
      </button>
      <span
        v-if="!macros.length"
        class="ov-plate__none"
      >No macros on this printer.</span>
    </div>
  </section>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import { visibleMacros, type MacroGroup } from '@/util/visible-macros'

/** How many macros Overview shows; the rest are on Control. */
const PINNED = 6

/**
 * Pro: the objects on the plate, to skip one that fails (exclude_object),
 * and the printer's macros, the first few here and every one on Control.
 */
@Component({})
export default class OverviewPlate extends Mixins(OverviewMixin) {
  get excludeObject () {
    return this.$store.state.printer.printer.exclude_object ?? {}
  }

  get objects (): Array<{ name: string, label: string, skipped: boolean, current: boolean }> {
    const objects = (this.excludeObject.objects as Array<{ name: string }> | undefined) ?? []
    const excluded = (this.excludeObject.excluded_objects as string[] | undefined) ?? []
    const current = this.excludeObject.current_object as string | null | undefined
    return objects.map(o => ({
      name: o.name,
      label: o.name.replace(/\.(stl|3mf|obj|step)/ig, '').replace(/_id_\d+_copy_\d+$/i, ''),
      skipped: excluded.includes(o.name),
      current: o.name === current
    }))
  }

  async skip (name: string) {
    const ok = await this.$confirm(`Stop printing ${name}? The rest of the plate carries on.`, { title: 'Skip an object', color: 'card-heading', icon: '$error' })
    if (ok) this.sendGcode(`EXCLUDE_OBJECT NAME=${name}`)
  }

  get macros (): string[] {
    return visibleMacros(this.$store.getters['macros/getVisibleMacros'] as MacroGroup[])
      .map(m => m.name.toUpperCase())
  }

  get pinned (): string[] {
    return this.macros.slice(0, PINNED)
  }
}
</script>

<style lang="scss" scoped>
  .ov-plate__objects {
    display: flex;
    flex-direction: column;
    margin-bottom: 8px;

    > * + * {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .ov-plate__object {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 48px;
  }

  .ov-plate__object--skipped .ov-plate__name {
    color: var(--m3d-text-subtle);
    text-decoration: line-through;
  }

  .ov-plate__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--m3d-text-subtle);
  }

  .ov-plate__dot--now {
    background: var(--m3d-accent);
  }

  .ov-plate__name {
    flex: 1 1 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ov-plate__skip {
    height: 32px;
    padding: 0 14px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-size: 13px;
    font-weight: 600;

    &:disabled {
      opacity: 0.45;
      cursor: default;
    }
  }

  .ov-plate__skipped {
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .ov-plate__macros {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .ov-plate__macro {
    height: 34px;
    padding: 0 12px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text);
    font-family: var(--m3d-font-mono);
    font-size: 12px;
    font-weight: 700;

    &:disabled {
      opacity: 0.45;
      cursor: default;
    }
  }

  .ov-plate__none {
    color: var(--m3d-text-muted);
    font-size: 13px;
  }
</style>
