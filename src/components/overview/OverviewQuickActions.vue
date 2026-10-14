<template>
  <section
    class="ov-card ov-quick"
    data-tid="overview-quick-actions"
  >
    <h2 class="ov-card__title">
      Quick actions
    </h2>
    <div class="ov-quick__grid">
      <button
        v-if="firstMaterial"
        type="button"
        class="ov-quick__btn"
        :disabled="!klippyReady"
        data-tid="quick-preheat"
        @click="applyMaterial(firstMaterial)"
      >
        <frame-icon
          name="flame"
          small
        />
        Preheat {{ firstMaterial.name }}
      </button>
      <button
        type="button"
        class="ov-quick__btn"
        :disabled="!klippyReady || busy"
        data-tid="quick-home"
        @click="home()"
      >
        <frame-icon
          name="home"
          small
        />
        Home
      </button>
      <router-link
        class="ov-quick__btn"
        :to="pagePath('/control')"
        data-tid="quick-filament"
      >
        <frame-icon
          name="spool"
          small
        />
        Change filament
      </router-link>
      <button
        type="button"
        class="ov-quick__btn"
        :disabled="!klippyReady"
        data-tid="quick-cool"
        @click="coolDown"
      >
        <frame-icon
          name="snow"
          small
        />
        Cool down
      </button>
    </div>
    <p class="ov-quick__note">
      Everything else is in Control. Pro adds your macros here.
    </p>
  </section>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import type { Material } from '@/services/control/model'

/** Four things people do before a print, a press each. */
@Component({})
export default class OverviewQuickActions extends Mixins(OverviewMixin) {
  /**
   * The material to offer: the one the heaters are set to, else PLA, the
   * one most prints use, else the first. Fluidd keeps the table sorted by
   * name, so "first" alone would mean ABS.
   */
  get firstMaterial (): Material | null {
    return this.material ?? this.materials.find(m => /^pla$/i.test(m.name)) ?? this.materials[0] ?? null
  }
}
</script>

<style lang="scss" scoped>
  .ov-quick__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  .ov-quick__btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 48px;
    padding: 0 12px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
    color: var(--m3d-text) !important;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    white-space: nowrap;

    &:hover:not(:disabled) {
      filter: brightness(1.12);
    }

    &:disabled {
      opacity: 0.45;
      cursor: default;
    }
  }

  .ov-quick__note {
    margin: 0;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }
</style>
