<template>
  <div
    class="library"
    :class="{ 'library--phone': isMobileViewport }"
    data-tid="library-page"
  >
    <header class="library__head">
      <div class="library__titles">
        <h1>Library</h1>
        <p>Everything you've sliced and saved, ready on any of your printers.</p>
        <a
          href="https://library.muon3d.com/library"
          target="_blank"
          rel="noopener"
          class="lib-btn lib-btn--sm lib-btn--ghost"
          data-tid="library-full"
        >Open full Library ↗</a>
      </div>
      <label
        v-if="listing"
        class="lib-field library__find"
      >
        <frame-icon
          name="search"
          small
        />
        <input
          ref="search"
          v-model="query"
          type="search"
          placeholder="Search your Library"
          aria-label="Search your Library"
          data-tid="library-find"
        >
        <span
          v-if="!isMobileViewport"
          class="lib-kbd"
        >/</span>
      </label>
    </header>

    <div
      v-if="signedIn && state.enabled"
      class="library__tabs"
      role="tablist"
      aria-label="Library sections"
    >
      <button
        v-for="tab in sectionTabs"
        :key="tab.id"
        type="button"
        role="tab"
        class="library__tab"
        :class="{ 'library__tab--on': section === tab.id }"
        :aria-selected="section === tab.id ? 'true' : 'false'"
        :data-tid="`library-section-${tab.id}`"
        @click="selectSection(tab.id)"
      >
        {{ tab.label }}
        <span
          class="lib-pill"
        >{{ tab.count }}</span>
      </button>
      <span class="library__grow" />
      <span
        v-if="listing && storage"
        class="library__storage"
        data-tid="library-summary"
      >{{ storage }}</span>
    </div>

    <section
      v-if="signedIn && state.error"
      class="lib-empty lib-surface library__state"
      role="alert"
    >
      <h2>Your Library didn't answer</h2>
      <p>{{ state.error }}</p>
      <div class="lib-empty__actions">
        <button
          type="button"
          class="lib-btn"
          @click="refresh"
        >
          Try again
        </button>
      </div>
    </section>

    <!-- Signed out: the Library is the account's. -->
    <section
      v-if="!signedIn"
      class="lib-empty lib-surface library__state"
      data-tid="library-signed-out"
    >
      <span class="lib-empty__icon"><frame-icon
        name="user"
        large
      /></span>
      <h2>Sign in to keep a Library</h2>
      <p>
        Your Library lives in your Muon3D account, so it's the same on every printer, phone and computer. Printing and
        saving to a printer work without it.
      </p>
      <div class="lib-empty__actions">
        <button
          type="button"
          class="lib-btn lib-btn--pri"
          data-tid="library-sign-in"
          @click="accountDialog = true"
        >
          Sign in
        </button>
      </div>
    </section>

    <section
      v-else-if="!state.error && (!state.checked || (state.enabled && !state.synced))"
      class="lib-empty lib-surface library__state"
    >
      <p>
        Reading your Library…
      </p>
    </section>

    <!-- Off: what it keeps, and turning it on. -->
    <section
      v-else-if="state.checked && !state.enabled && !state.error"
      class="lib-empty lib-surface library__state"
      data-tid="library-off"
    >
      <span class="lib-empty__icon lib-empty__icon--accent"><frame-icon
        name="library"
        large
      /></span>
      <h2>Your Library is off</h2>
      <p>
        Turn it on and we keep what you save: the project, the sliced file and a picture, in your account and nowhere
        else. You can download or delete all of it whenever you like.
      </p>
      <p
        v-if="purgeDay"
        class="library__warn"
      >
        What was in it is deleted on {{ purgeDay }} unless you turn it back on.
      </p>
      <div class="lib-empty__actions">
        <button
          type="button"
          class="lib-btn lib-btn--pri"
          :disabled="busy || !promise"
          data-tid="library-turn-on"
          @click="turnOn"
        >
          Turn it on
        </button>
        <a
          class="lib-btn lib-btn--ghost"
          :href="promiseUrl"
          target="_blank"
          rel="noopener"
        >What we keep</a>
      </div>
      <p v-if="!promise">
        The Library has a promise this version of Control cannot show. Update Control before turning it on.
      </p>
    </section>

    <!-- On, and nothing in it yet. -->
    <section
      v-else-if="section === 'all' && state.synced && !everything.length && !state.error"
      class="lib-empty lib-surface library__state"
      data-tid="library-empty"
    >
      <span class="lib-empty__icon"><frame-icon
        name="slice"
        large
      /></span>
      <h2>Nothing here yet</h2>
      <p>Slice something and press Save. It appears here, ready to print on any of your printers.</p>
      <div class="lib-empty__actions">
        <router-link
          to="/slice"
          class="lib-btn lib-btn--pri"
          data-tid="library-go-slice"
        >
          Open Slice
        </router-link>
        <a
          href="https://library.muon3d.com/library"
          target="_blank"
          rel="noopener"
          class="lib-btn lib-btn--ghost"
        >Open full Library ↗</a>
      </div>
    </section>

    <section
      v-else-if="section !== 'all'"
      class="library__section"
      :data-tid="`library-${section}`"
    >
      <div
        v-if="sectionBusy"
        class="lib-empty lib-surface library__state"
      >
        Reading {{ section }}…
      </div>
      <div
        v-else-if="sectionError"
        class="lib-empty lib-surface library__state"
        role="alert"
      >
        <h2>This section didn't answer</h2>
        <p>{{ sectionError }}</p>
        <button
          class="lib-btn"
          type="button"
          @click="loadSection"
        >
          Try again
        </button>
      </div>
      <div
        v-else-if="section === 'printed' && runs.length"
        class="library__runs lib-surface"
      >
        <article
          v-for="run in runs"
          :key="run.id"
          class="library__run"
          :data-outcome="run.outcome"
        >
          <div class="library__run-main">
            <b>{{ run.item && run.item.name ? run.item.name : run.file_name }}</b>
            <span>{{ run.printer_name }} · {{ relativeTime(run.started_at) }}</span>
            <small v-if="!run.in_library">Not in your Library</small>
          </div>
          <span
            class="lib-chip library__outcome"
            :class="`library__outcome--${run.outcome}`"
          >{{ run.outcome }}</span>
          <router-link
            v-if="run.item_id"
            class="lib-btn lib-btn--sm lib-btn--pri"
            :to="printAgain(run)"
          >
            Print again
          </router-link>
          <a
            v-else
            class="lib-btn lib-btn--sm lib-btn--ghost"
            href="https://library.muon3d.com/library/printed"
            target="_blank"
            rel="noopener"
          >Open full Library ↗</a>
        </article>
      </div>
      <div
        v-else-if="section === 'saved' && savedItems.length"
        class="library__grid"
      >
        <article
          v-for="item in savedItems"
          :key="item.id"
          class="library__saved lib-surface"
          :data-tid="`library-saved-${item.id}`"
        >
          <a
            v-if="item.available && item.url"
            :href="item.url"
            target="_blank"
            rel="noopener"
          >
            <img
              v-if="item.thumbnailUrl"
              :src="item.thumbnailUrl"
              alt=""
            >
            <b>{{ item.title }}</b>
          </a>
          <div v-else>
            <img
              v-if="item.thumbnailUrl"
              :src="item.thumbnailUrl"
              alt=""
            >
            <b>{{ item.title }}</b>
            <span>No longer available</span>
          </div>
          <small v-if="item.creator">{{ item.creator }}</small>
        </article>
      </div>
      <div
        v-else-if="sectionItems.length"
        class="library__grid"
      >
        <library-card
          v-for="item in sectionItems"
          :key="item.id"
          :item="item"
          @print="printOn(item)"
          @open="openInSlice(item)"
        />
      </div>
      <div
        v-else
        class="lib-empty lib-surface library__state"
        data-tid="library-section-empty"
      >
        <h2>Nothing here yet</h2>
        <p>Use the full Library to discover and save models.</p>
        <a
          class="lib-btn lib-btn--ghost"
          href="https://library.muon3d.com/library"
          target="_blank"
          rel="noopener"
        >Open full Library ↗</a>
      </div>
    </section>

    <template v-else-if="state.synced && everything.length > 0">
      <section
        v-if="recent.length"
        class="library__recent"
        aria-label="Pick up where you left off"
      >
        <div class="library__section-head">
          <h2>Pick up where you left off</h2>
          <span>From Slice and your printers</span>
        </div>
        <div class="library__recent-row">
          <library-recent-card
            v-for="item in recent"
            :key="item.id"
            :item="item"
            :to="printTo(item)"
            :fit="activeFit(item)"
            :printer-name="activePrinter ? activePrinter.name : ''"
            @print="printOn(item, $event && activePrinter ? activePrinter.id : null)"
          />
        </div>
      </section>

      <div class="library__bar">
        <div
          class="library__chips"
          role="group"
          aria-label="Show"
        >
          <button
            v-for="chip in chips"
            :key="chip.id"
            type="button"
            class="lib-chip"
            :class="{ 'lib-chip--on': filter === chip.id }"
            :aria-pressed="filter === chip.id ? 'true' : 'false'"
            :data-tid="`library-chip-${chip.id}`"
            @click="filter = chip.id"
          >
            {{ chip.label }}<span
              v-if="chip.count !== null"
              class="lib-chip__n"
            >{{ chip.count }}</span>
          </button>
        </div>
        <label class="library__sort">
          <select
            v-model="sort"
            aria-label="Sort"
            data-tid="library-sort"
          >
            <option value="recent">Recently changed</option>
            <option value="name">By name</option>
          </select>
          <frame-icon
            name="chevronDown"
            small
          />
        </label>
      </div>

      <div
        class="library__grid"
        data-tid="library-grid"
      >
        <library-card
          v-for="item in shown"
          :key="item.id"
          :item="item"
          @print="printOn(item)"
          @open="openInSlice(item)"
          @rename="rename(item)"
          @copy="copy(item)"
          @download-gcode="downloadGcode(item, $event)"
          @download-project="downloadProject(item)"
          @delete="remove(item)"
        />
        <router-link
          v-if="!query && filter === 'all'"
          to="/slice"
          class="library__add"
          data-tid="library-add"
        >
          <frame-icon
            name="slice"
            large
          />
          <b>Add from Slice</b>
          <span>Slice a model and press Save. Saving again keeps a new version of the same print.</span>
        </router-link>
      </div>
      <p
        v-if="!shown.length"
        class="library__note"
      >
        {{ query ? `Nothing in your Library matches "${query}".` : 'Nothing here.' }}
      </p>
    </template>

    <p
      v-if="error"
      class="library__note library__note--error"
      role="alert"
    >
      {{ error }}
    </p>

    <print-on-dialog
      :item="printing"
      :prefer="preferPrinter"
      @close="printing = null"
    />

    <file-name-dialog
      v-if="naming"
      :value="true"
      :title="naming.mode === 'rename' ? 'Rename' : 'Save as copy'"
      :label="naming.mode === 'rename' ? 'Name' : 'Name of the copy'"
      :name="naming.mode === 'rename' ? naming.item.name : `${naming.item.name} copy`"
      @input="!$event && (naming = null)"
      @save="saveName"
    />

    <cloud-account-dialog
      v-if="accountDialog"
      v-model="accountDialog"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins, Watch } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import LibraryPageMixin, { type LibraryFilter } from '@/mixins/library-page'
import LibraryCard from '@/components/library/LibraryCard.vue'
import LibraryRecentCard from '@/components/library/LibraryRecentCard.vue'
import PrintOnDialog from '@/components/library/PrintOnDialog.vue'
import FileNameDialog from '@/components/widgets/filesystem/FileNameDialog.vue'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'
import { describeLibraryError, LibraryError, savedRows, type LibraryItem, type LibraryRun, type LibrarySections, type SavedRow } from '@/services/library/api'
import { libraryClient } from '@/services/library/store'

type Section = 'all' | 'printed' | 'sliced' | 'saved'

/**
 * Your Library (`/library`): every print saved from Slice, and the models
 * the phone app keeps, in the account, whichever printer Fluidd is on. A
 * card opens the print's own page; its menu prints it, opens it in Slice,
 * renames, copies, downloads or deletes it. Signed out, off, or empty, the
 * page says what to do instead.
 *
 * Only the look is here: what the page does is mixins/library-page.ts, a
 * card is LibraryCard, Print on… is PrintOnDialog.
 */
@Component({ components: { LibraryCard, LibraryRecentCard, PrintOnDialog, FileNameDialog, CloudAccountDialog } })
export default class Library extends Mixins(LibraryPageMixin, BrowserMixin) {
  section: Section = 'all'
  sections: LibrarySections | null = null
  runs: LibraryRun[] = []
  sectionItems: LibraryItem[] = []
  savedItems: SavedRow[] = []
  sectionBusy = false
  sectionError = ''
  savedAvailable = true

  get sectionTabs (): Array<{ id: Section, label: string, count: number }> {
    const counts = this.sections
    return [
      { id: 'all' as Section, label: 'All', count: counts?.all ?? this.everything.length },
      { id: 'printed' as Section, label: 'Printed', count: counts?.printed ?? 0 },
      { id: 'sliced' as Section, label: 'Sliced', count: counts?.sliced ?? 0 },
      ...(this.savedAvailable ? [{ id: 'saved' as Section, label: 'Saved', count: counts?.saved ?? 0 }] : [])
    ]
  }

  @Watch('state.enabled', { immediate: true })
  onLibraryEnabled (enabled: boolean) {
    if (enabled) this.loadSections()
  }

  async loadSections () {
    try {
      this.sections = await libraryClient().sections()
    } catch (error) {
      // The item list remains useful if an older service has no section summary.
    }
  }

  selectSection (section: Section) {
    this.section = section
    if (section !== 'all') this.loadSection()
  }

  async loadSection () {
    this.sectionBusy = true
    this.sectionError = ''
    this.sectionItems = []
    this.savedItems = []
    this.runs = []
    try {
      if (this.section === 'printed') {
        const page = await libraryClient().runs()
        this.runs = Array.isArray(page.runs) ? page.runs : []
      } else if (this.section === 'sliced') {
        const page = await libraryClient().sliced()
        this.sectionItems = Array.isArray(page.items) ? page.items : []
      } else if (this.section === 'saved') this.savedItems = savedRows(await libraryClient().saved())
    } catch (error) {
      if (this.section === 'saved' && error instanceof LibraryError && error.status === 404) {
        this.savedAvailable = false
        this.section = 'all'
      } else this.sectionError = describeLibraryError(error)
    } finally {
      this.sectionBusy = false
    }
  }

  printAgain (run: LibraryRun) {
    return { path: '/print', query: { library: run.item_id as string, ...(run.version === null ? {} : { version: String(run.version) }) } }
  }

  relativeTime (value: string): string {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  get chips (): Array<{ id: LibraryFilter, label: string, count: number | null }> {
    const chips: Array<{ id: LibraryFilter, label: string, count: number | null }> = [
      { id: 'all', label: 'All', count: this.everything.length },
      { id: 'prints', label: 'Prints', count: this.prints.length }
    ]
    if (this.models.length) chips.push({ id: 'models', label: 'Models', count: this.models.length })
    if (this.activePrinter) chips.push({ id: 'fits', label: `Fits ${this.activePrinter.name} now`, count: null })
    return chips
  }
}
</script>

<style lang="scss" scoped>
  .library {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 1440px;
    margin: 0 auto;
    padding: 6px 12px 40px;
    color: var(--m3d-text);
  }

  .library--phone {
    gap: 16px;
    padding: 4px 0 24px;
  }

  .library__head {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px 16px;
  }

  .library__titles {
    display: flex;
    flex-direction: column;
    gap: 6px;

    h1 {
      margin: 0;
      font-family: var(--m3d-font-display);
      font-size: 30px;
      font-weight: 400;
      letter-spacing: 0.01em;
      line-height: 1.1;
    }

    p {
      margin: 0;
      color: var(--m3d-text-muted);
      font-size: 14px;
    }

    a {
      align-self: flex-start;
    }
  }

  .library--phone .library__titles h1 {
    font-size: 24px;
  }

  .library__find {
    width: 340px;
  }

  .library--phone .library__find {
    width: 100%;
  }

  .library__tabs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0 24px;
    border-bottom: 1px solid var(--m3d-border);
  }

  // Four tabs and the storage line do not fit a phone side by side: the
  // storage line goes under the tabs instead of widening the page.
  .library--phone .library__tabs {
    gap: 0 16px;
  }

  .library--phone .library__grow {
    display: none;
  }

  .library--phone .library__storage {
    flex: 1 0 100%;
    padding: 2px 0 10px;
  }

  .library__tab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 44px;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    color: var(--m3d-text-subtle);
    font-size: 15px;
    font-weight: 600;
    background: transparent;
    cursor: pointer;
  }

  .library__tab--on {
    border-bottom-color: var(--m3d-accent);
    color: var(--m3d-text);
  }

  .library__grow {
    flex: 1 1 auto;
  }

  .library__section,
  .library__runs {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .library__runs {
    padding: 4px 16px;
  }

  .library__run {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 12px;
    padding: 14px 0;
    border-bottom: 1px solid var(--m3d-border);

    &:last-child { border-bottom: 0; }
  }

  .library__run-main {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 3px;

    b { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    span, small { color: var(--m3d-text-subtle); }
  }

  .library__outcome { text-transform: capitalize; }
  .library__outcome--finished { color: var(--m3d-success); }
  .library__outcome--failed { color: var(--m3d-danger); }
  .library__outcome--running { color: var(--m3d-accent); }

  .library--phone .library__run {
    grid-template-columns: minmax(0, 1fr) auto;

    .lib-btn { grid-column: 1 / -1; }
  }

  .library__storage {
    color: var(--m3d-text-subtle);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .library__state {
    max-width: 560px;
    width: 100%;
    margin: 24px auto 0;
  }

  .library__warn {
    color: var(--m3d-warning) !important;
  }

  .library__recent {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .library__section-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 4px 12px;

    h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
    }

    span {
      color: var(--m3d-text-subtle);
      font-size: 13px;
    }
  }

  .library__recent-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 14px;
  }

  .library--phone .library__recent-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .library__bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
  }

  .library__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .library__sort {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--m3d-text-muted);
    font-size: 13px;

    select {
      appearance: none;
      padding-right: 2px;
      border: 0;
      outline: none;
      background: transparent;
      color: inherit;
      font: inherit;
      cursor: pointer;
    }

    option {
      background: var(--m3d-surface);
      color: var(--m3d-text);
    }
  }

  .library__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 14px;
  }

  .library--phone .library__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .library__add {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 240px;
    padding: 18px;
    border: 1.5px dashed var(--m3d-border-strong);
    border-radius: 10px;
    color: var(--m3d-text-subtle) !important;
    text-align: center;
    text-decoration: none;

    b {
      color: var(--m3d-text-muted);
      font-size: 14px;
    }

    span {
      font-size: 12px;
    }

    &:hover {
      border-color: var(--m3d-accent-line);
    }
  }

  .library__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .library__note--error {
    color: var(--m3d-danger);
  }
</style>
