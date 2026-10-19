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

    <div class="library__tabs">
      <span
        class="library__tab library__tab--on"
        aria-current="page"
      >
        Yours
        <span
          v-if="listing"
          class="lib-pill"
          data-tid="library-count"
        >{{ everything.length }}</span>
      </span>
      <span class="library__grow" />
      <span
        v-if="listing && storage"
        class="library__storage"
        data-tid="library-summary"
      >{{ storage }}</span>
    </div>

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
      v-else-if="!state.checked"
      class="lib-empty lib-surface library__state"
    >
      <template v-if="state.error">
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
      </template>
      <p v-else>
        Reading your Library…
      </p>
    </section>

    <!-- Off: what it keeps, and turning it on. -->
    <section
      v-else-if="!state.enabled"
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
      v-else-if="!everything.length"
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
      </div>
    </section>

    <template v-else>
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
import { Component, Mixins } from 'vue-property-decorator'
import BrowserMixin from '@/mixins/browser'
import LibraryPageMixin, { type LibraryFilter } from '@/mixins/library-page'
import LibraryCard from '@/components/library/LibraryCard.vue'
import LibraryRecentCard from '@/components/library/LibraryRecentCard.vue'
import PrintOnDialog from '@/components/library/PrintOnDialog.vue'
import FileNameDialog from '@/components/widgets/filesystem/FileNameDialog.vue'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'

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
    align-items: center;
    gap: 24px;
    border-bottom: 1px solid var(--m3d-border);
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
  }

  .library__tab--on {
    border-bottom-color: var(--m3d-accent);
    color: var(--m3d-text);
  }

  .library__grow {
    flex: 1 1 auto;
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
