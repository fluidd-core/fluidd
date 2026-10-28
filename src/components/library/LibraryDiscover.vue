<template>
  <section
    class="ldisc"
    aria-label="Discover"
    data-tid="library-discover"
  >
    <div
      v-if="busy"
      class="ldisc__grid"
      role="status"
      aria-busy="true"
    >
      <span class="ldisc__hidden">Loading Discover</span>
      <span
        v-for="n in 6"
        :key="n"
        class="ldisc__skeleton lib-surface"
      />
    </div>

    <section
      v-else-if="error"
      class="lib-empty lib-surface"
      role="alert"
    >
      <h2>Discover didn't answer</h2>
      <p>{{ error }}</p>
      <div class="lib-empty__actions">
        <button
          type="button"
          class="lib-btn"
          @click="load"
        >
          Try again
        </button>
        <!-- From a printer's own address the model service may not answer this page at all. -->
        <a
          :href="libraryUrl"
          target="_blank"
          rel="noopener"
          class="lib-btn"
          data-tid="library-discover-open"
        >Open Discover on library.muon3d.com ↗</a>
      </div>
    </section>

    <section
      v-else-if="!shelves.length"
      class="lib-empty lib-surface"
      data-tid="library-discover-empty"
    >
      <span class="lib-empty__icon lib-empty__icon--accent"><frame-icon
        name="library"
        large
      /></span>
      <h2>Nothing to discover yet</h2>
      <p>Prints people share, and the ones we test on the M1, appear here.</p>
    </section>

    <template v-else>
      <section
        v-for="shelf in shelves"
        :key="shelf.id"
        class="ldisc__shelf"
        :aria-labelledby="`ldisc-${shelf.id}`"
        :data-tid="`library-discover-${shelf.id}`"
      >
        <div class="ldisc__head">
          <h2 :id="`ldisc-${shelf.id}`">
            {{ shelf.title }}
          </h2>
        </div>
        <div class="ldisc__grid">
          <a
            v-for="card in shelf.cards"
            :key="card.key"
            :href="card.href"
            target="_blank"
            rel="noopener"
            class="lcard lib-surface"
            :data-tid="`library-discover-card-${card.key}`"
          >
            <span class="lib-stage lcard__stage">
              <img
                v-if="card.picture"
                :src="card.picture"
                alt=""
                loading="lazy"
              >
              <frame-icon
                v-else
                name="library"
                large
              />
              <span
                v-if="card.tested"
                class="lib-ov lib-ov--tl"
              ><span class="lib-pill lib-pill--glass">Tested on M1</span></span>
            </span>
            <span class="lcard__body">
              <span class="lcard__title">{{ card.title }}</span>
              <span class="lcard__facts">{{ card.byline }}</span>
              <span
                v-if="card.facts"
                class="lcard__facts"
              >{{ card.facts }}</span>
            </span>
          </a>
        </div>
      </section>
    </template>
  </section>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import { LIBRARY_URL, discoverShelves, loadDiscover, type DiscoverShelf } from '@/services/library/discover'

/**
 * Discover (KAN-735): the public shelves library.muon3d.com opens on, in
 * Control's Library, in LibraryCard's look. Signed in or not.
 */
@Component({})
export default class LibraryDiscover extends Vue {
  shelves: DiscoverShelf[] = []
  busy = true
  error = ''
  readonly libraryUrl = `${LIBRARY_URL}/`
  private controller: AbortController | null = null

  created () {
    this.load()
  }

  beforeDestroy () {
    this.controller?.abort()
  }

  async load () {
    this.controller?.abort()
    const controller = new AbortController()
    this.controller = controller
    this.busy = true
    this.error = ''
    try {
      const feed = await loadDiscover(fetch, controller.signal)
      if (controller.signal.aborted) return
      this.shelves = discoverShelves(feed)
    } catch (error) {
      if (controller.signal.aborted) return
      this.error = error instanceof Error && error.name !== 'TypeError' ? error.message : 'Check your connection, then try again.'
    } finally {
      if (!controller.signal.aborted) this.busy = false
    }
  }
}
</script>

<style lang="scss" scoped>
  .ldisc {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .ldisc__head h2 {
    margin: 0 0 12px;
    font-size: 18px;
    font-weight: 600;
  }

  .ldisc__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 14px;
  }

  .ldisc__hidden {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .ldisc__skeleton {
    height: 240px;
    opacity: 0.6;
  }

  // The same card as LibraryCard.vue (its scoped styles), for a public print.
  .lcard {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: var(--m3d-text) !important;
    text-decoration: none;
    transition: border-color var(--m3d-duration-fast) var(--m3d-ease);

    &:hover,
    &:focus-visible {
      border-color: var(--m3d-accent-line);
    }
  }

  .lcard__stage {
    height: 168px;
    border-radius: 0;
  }

  .lcard__body {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0;
    padding: 10px 12px 12px;
  }

  .lcard__title {
    overflow: hidden;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .lcard__facts {
    overflow: hidden;
    color: var(--m3d-text-muted);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
