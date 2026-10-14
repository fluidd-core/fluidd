<template>
  <article
    class="lrecent lib-surface"
    :data-tid="`library-recent-${item.id}`"
  >
    <router-link
      :to="to"
      class="lib-stage lrecent__stage"
      :aria-label="item.name"
    >
      <img
        v-if="picture"
        :src="picture"
        alt=""
      >
      <frame-icon
        v-else
        name="library"
        large
      />
    </router-link>
    <div class="lrecent__text">
      <span
        class="lib-caps lrecent__caps"
        :class="last.printed ? 'lrecent__caps--printed' : 'lrecent__caps--saved'"
      >{{ last.text }}</span>
      <router-link
        :to="to"
        class="lrecent__name"
      >
        {{ item.name }}
      </router-link>
      <span class="lrecent__facts">{{ facts }}</span>
      <span
        v-if="fit"
        class="lrecent__fit"
        :class="`lrecent__fit--${fit.tone}`"
      ><span class="lib-dot" />{{ fit.text }}</span>
      <div class="lrecent__actions">
        <button
          type="button"
          class="lib-btn lib-btn--sm"
          :class="{ 'lib-btn--pri': fit && fit.ready }"
          :data-tid="`library-recent-print-${item.id}`"
          @click="$emit('print', fit && fit.ready)"
        >
          {{ fit && fit.ready ? `Print on ${printerName}` : 'Print on…' }}
        </button>
        <router-link
          :to="to"
          class="lib-btn lib-btn--sm"
        >
          Open
        </router-link>
      </div>
    </div>
  </article>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import type { LibraryItem } from '@/services/library/api'
import { lastEvent, nozzleText, printFacts } from '@/services/library/format'
import { loadThumbnail, thumbnailFor, thumbnailKey } from '@/services/library/thumbnails'
import type { ActiveFit } from '@/mixins/library-page'

/**
 * One print in "Pick up where you left off": what happened to it last, what
 * it was sliced with, and how it stands on the printer open here, with
 * Print on that printer when it fits.
 */
@Component({})
export default class LibraryRecentCard extends Vue {
  @Prop({ type: Object, required: true })
  readonly item!: LibraryItem

  @Prop({ type: String, required: true })
  readonly to!: string

  @Prop({ type: Object, default: null })
  readonly fit!: ActiveFit | null

  @Prop({ type: String, default: '' })
  readonly printerName!: string

  get last () {
    return lastEvent(this.item)
  }

  get facts (): string {
    const setup = this.item.setups?.[0]
    if (!setup) return 'Not sliced yet'
    return [setup.material, nozzleText(setup.nozzle_mm), printFacts(setup)].filter(Boolean).join(' · ')
  }

  get picture (): string | null {
    return thumbnailFor(this.item)
  }

  @Watch('item', { immediate: true })
  onItem (item: LibraryItem, before?: LibraryItem) {
    if (!before || thumbnailKey(before) !== thumbnailKey(item)) loadThumbnail(item)
  }
}
</script>

<style lang="scss" scoped>
  .lrecent {
    display: flex;
    gap: 14px;
    padding: 12px;
    color: var(--m3d-text);
  }

  .lrecent__stage {
    width: 128px;
    height: 128px;
  }

  .lrecent__text {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
  }

  .lrecent__caps {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .lrecent__caps--saved {
    color: var(--m3d-accent);
  }

  .lrecent__caps--printed {
    color: var(--m3d-success);
  }

  .lrecent__name {
    overflow: hidden;
    color: var(--m3d-text) !important;
    font-size: 16px;
    font-weight: 600;
    text-decoration: none;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .lrecent__facts {
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .lrecent__fit {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
  }

  .lrecent__fit--ok { color: var(--m3d-success); }
  .lrecent__fit--warn { color: var(--m3d-warning); }
  .lrecent__fit--off { color: var(--m3d-text-muted); }

  .lrecent__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 4px;
  }
</style>
