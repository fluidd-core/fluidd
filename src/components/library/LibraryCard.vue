<template>
  <article
    class="lcard lib-surface"
    :data-tid="`library-card-${item.id}`"
  >
    <router-link
      :to="to"
      class="lcard__link"
      :aria-label="item.name"
    >
      <span class="lib-stage lcard__stage">
        <img
          v-if="picture"
          :src="picture"
          alt=""
          loading="lazy"
        >
        <frame-icon
          v-else
          name="library"
          large
        />
        <span
          v-if="!item.versioned"
          class="lib-ov lib-ov--tl"
        ><span class="lib-pill lib-pill--glass">Model</span></span>
        <span
          v-if="versions > 1"
          class="lib-ov lib-ov--tr"
        ><span
          class="lib-pill lib-pill--glass"
          :title="`${versions} versions kept`"
        >v{{ item.version }}</span></span>
      </span>
      <span class="lcard__body">
        <span
          class="lcard__title"
          data-tid="library-card-name"
        >{{ item.name }}</span>
        <span
          class="lcard__facts"
          data-tid="library-card-setup"
        >{{ facts }}</span>
        <span
          class="lcard__printed"
          :class="{ 'lcard__printed--yes': printedCount > 0 }"
          data-tid="library-card-printed"
        >
          <frame-icon
            v-if="printedCount > 0"
            name="check"
            small
          />
          {{ printed }}
        </span>
      </span>
    </router-link>

    <v-menu
      left
      offset-y
      content-class="lcard__menu"
    >
      <template #activator="{ on, attrs }">
        <button
          type="button"
          class="lcard__more"
          :aria-label="`More for ${item.name}`"
          :data-tid="`library-more-${item.id}`"
          v-bind="attrs"
          v-on="on"
        >
          <frame-icon
            name="more"
            small
          />
        </button>
      </template>
      <v-list dense>
        <v-list-item
          v-if="item.versioned"
          data-tid="library-print"
          @click="$emit('print')"
        >
          <v-list-item-icon class="mr-3">
            <frame-icon
              name="jobs"
              small
            />
          </v-list-item-icon>
          <v-list-item-title>Print on…</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="item.versioned"
          data-tid="library-open"
          @click="$emit('open')"
        >
          <v-list-item-icon class="mr-3">
            <frame-icon
              name="slice"
              small
            />
          </v-list-item-icon>
          <v-list-item-title>Open in Slice</v-list-item-title>
        </v-list-item>
        <v-list-item
          data-tid="library-rename"
          @click="$emit('rename')"
        >
          <v-list-item-icon class="mr-3">
            <frame-icon
              name="pencil"
              small
            />
          </v-list-item-icon>
          <v-list-item-title>Rename</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-if="item.versioned"
          data-tid="library-copy"
          @click="$emit('copy')"
        >
          <v-list-item-icon class="mr-3">
            <frame-icon
              name="copy"
              small
            />
          </v-list-item-icon>
          <v-list-item-title>Save as copy</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-for="setup in setups"
          :key="setup.file_id"
          data-tid="library-download-gcode"
          @click="$emit('download-gcode', setup)"
        >
          <v-list-item-icon class="mr-3">
            <frame-icon
              name="download"
              small
            />
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title>Download G-code</v-list-item-title>
            <v-list-item-subtitle v-if="setups.length > 1">
              {{ setupText(setup) }}
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>
        <v-list-item
          v-if="item.project_file_id"
          data-tid="library-download-project"
          @click="$emit('download-project')"
        >
          <v-list-item-icon class="mr-3">
            <frame-icon
              name="download"
              small
            />
          </v-list-item-icon>
          <v-list-item-title>Download project (.3mf)</v-list-item-title>
        </v-list-item>
        <v-divider />
        <v-list-item
          data-tid="library-delete"
          @click="$emit('delete')"
        >
          <v-list-item-icon class="mr-3">
            <frame-icon
              name="trash"
              small
              class="lcard__danger"
            />
          </v-list-item-icon>
          <v-list-item-title class="lcard__danger">
            Delete
          </v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </article>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import type { ItemSetup, LibraryItem } from '@/services/library/api'
import { cardFacts, printedLine, setupLine } from '@/services/library/format'
import { loadThumbnail, thumbnailFor, thumbnailKey } from '@/services/library/thumbnails'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'

/**
 * A saved print: its picture (with its version), its name, what it was
 * sliced with and how long and how much, and where it last printed. It
 * opens the print's own page; its menu has the rest.
 */
@Component({})
export default class LibraryCard extends Vue {
  @Prop({ type: Object, required: true })
  readonly item!: LibraryItem

  get to (): string {
    return scopedPath(`/library/${this.item.id}`, activeSlug())
  }

  get setups (): ItemSetup[] {
    return this.item.setups ?? []
  }

  get facts (): string {
    return cardFacts(this.item)
  }

  get printedCount (): number {
    return this.item.printed_count ?? 0
  }

  get printed (): string {
    if (!this.item.versioned || !this.setups.length) return this.printedCount ? printedLine(this.item) : 'Not sliced yet'
    return printedLine(this.item)
  }

  get versions (): number {
    return this.item.versions ?? 0
  }

  get picture (): string | null {
    return thumbnailFor(this.item)
  }

  setupText (setup: ItemSetup): string {
    return setupLine(setup)
  }

  @Watch('item', { immediate: true })
  onItem (item: LibraryItem, before?: LibraryItem) {
    if (!before || thumbnailKey(before) !== thumbnailKey(item)) loadThumbnail(item)
  }
}
</script>

<style lang="scss" scoped>
  .lcard {
    position: relative;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    color: var(--m3d-text);
    transition: border-color var(--m3d-duration-fast) var(--m3d-ease);

    &:hover,
    &:focus-within {
      border-color: var(--m3d-accent-line);
    }
  }

  .lcard__link {
    display: flex;
    flex-direction: column;
    min-width: 0;
    color: inherit !important;
    text-decoration: none;

    &:focus-visible {
      outline: none;
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
    min-height: 17px;
    color: var(--m3d-text-muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .lcard__printed {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .lcard__printed--yes {
    color: var(--m3d-success);
  }

  // The menu sits on the picture, shown on hover and focus (always on a touch screen).
  .lcard__more {
    position: absolute;
    right: 8px;
    top: 130px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 999px;
    background: rgb(10 13 14 / 72%);
    color: #e8ecee;
    opacity: 0;
    transition: opacity var(--m3d-duration-fast) var(--m3d-ease);
  }

  .lcard:hover .lcard__more,
  .lcard:focus-within .lcard__more,
  .lcard__more[aria-expanded='true'] {
    opacity: 1;
  }

  @media (hover: none) {
    .lcard__more {
      opacity: 1;
    }
  }

  .lcard__danger {
    color: var(--m3d-danger) !important;
  }
</style>
