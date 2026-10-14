<template>
  <div
    class="lprint"
    :class="{ 'lprint--phone': isMobileViewport }"
    data-tid="library-print-page"
  >
    <div class="lprint__crumbs">
      <nav aria-label="Breadcrumb">
        <router-link :to="libraryTo">
          Library
        </router-link>
        <frame-icon
          name="chevronRight"
          small
        />
        <span>{{ item ? item.name : '' }}</span>
      </nav>
      <v-menu
        v-if="item"
        left
        offset-y
      >
        <template #activator="{ on, attrs }">
          <button
            type="button"
            class="lib-btn lib-btn--sm lib-btn--ghost lib-btn--sq"
            aria-label="More"
            data-tid="library-print-more"
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
            data-tid="library-copy"
            @click="copy(item)"
          >
            <v-list-item-title>Save as copy</v-list-item-title>
          </v-list-item>
          <v-list-item
            v-for="setup in item.setups || []"
            :key="setup.file_id"
            data-tid="library-download-gcode"
            @click="downloadGcode(item, setup)"
          >
            <v-list-item-title>
              {{ (item.setups || []).length > 1 ? `Download G-code (${setup.material}, ${setup.nozzle_mm} mm)` : 'Download G-code' }}
            </v-list-item-title>
          </v-list-item>
          <v-list-item
            v-if="item.project_file_id"
            data-tid="library-download-project"
            @click="downloadProject(item)"
          >
            <v-list-item-title>Download project (.3mf)</v-list-item-title>
          </v-list-item>
          <v-divider />
          <v-list-item
            data-tid="library-delete"
            @click="removeHere"
          >
            <v-list-item-title class="lprint__danger">
              Delete
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <section
      v-if="!signedIn"
      class="lib-empty lib-surface"
    >
      <h2>Sign in to see your Library</h2>
      <div class="lib-empty__actions">
        <button
          type="button"
          class="lib-btn lib-btn--pri"
          @click="accountDialog = true"
        >
          Sign in
        </button>
      </div>
    </section>
    <section
      v-else-if="missing"
      class="lib-empty lib-surface"
      data-tid="library-print-missing"
    >
      <h2>This print isn't in your Library</h2>
      <p>It may have been deleted, on this or another device.</p>
      <div class="lib-empty__actions">
        <router-link
          :to="libraryTo"
          class="lib-btn"
        >
          Back to your Library
        </router-link>
      </div>
    </section>
    <p
      v-else-if="!item"
      class="lprint__note"
    >
      Reading the print…
    </p>

    <div
      v-else
      class="lprint__layout"
    >
      <div class="lprint__left">
        <div class="lib-stage lprint__stage">
          <img
            v-if="picture"
            :src="picture"
            :alt="item.name"
          >
          <frame-icon
            v-else
            name="library"
            large
          />
          <span
            v-if="firstSetup"
            class="lib-ov lib-ov--tr"
          ><span class="lib-pill lib-pill--glass">{{ firstSetup }}</span></span>
          <span
            v-if="item.versioned"
            class="lib-ov lib-ov--br"
          >
            <button
              type="button"
              class="lib-btn lib-btn--sm"
              @click="openInSlice(item)"
            >
              <frame-icon
                name="slice"
                small
              />
              Open in Slice
            </button>
          </span>
        </div>
      </div>

      <div class="lprint__right">
        <div class="lprint__titles">
          <span class="lib-caps">{{ item.versioned ? 'Print · saved from Slice' : 'Model · from the app' }}</span>
          <div class="lprint__name">
            <h1 data-tid="library-print-name">
              {{ item.name }}
            </h1>
            <button
              type="button"
              class="lib-btn lib-btn--sm lib-btn--ghost lib-btn--sq"
              aria-label="Rename"
              data-tid="library-rename"
              @click="rename(item)"
            >
              <frame-icon
                name="pencil"
                small
              />
            </button>
          </div>
          <div class="lprint__meta">
            <span
              v-if="item.version"
              class="lib-pill lib-pill--run"
            >v{{ item.version }}</span>
            <span>Saved {{ savedAgo }}</span>
            <span class="lprint__dot">·</span>
            <span>{{ printedTimes }}</span>
          </div>
        </div>

        <div
          v-if="item.versioned"
          class="lprint__actions"
        >
          <button
            type="button"
            class="lib-btn lib-btn--lg lib-btn--pri"
            data-tid="library-print-on"
            @click="printOn(item, readyHere && activePrinter ? activePrinter.id : null)"
          >
            {{ readyHere && activePrinter ? `Print on ${activePrinter.name}` : 'Print on…' }}
          </button>
          <button
            type="button"
            class="lib-btn lib-btn--lg"
            data-tid="library-open-slice"
            @click="openInSlice(item)"
          >
            Open in Slice
          </button>
        </div>

        <section
          v-if="item.versioned"
          class="lib-surface lprint__card"
          aria-label="Your printers"
        >
          <div class="lprint__card-head">
            <h2 class="lib-card-title">
              Your printers
            </h2>
            <span>Checked against what each has loaded now</span>
          </div>
          <printer-fit-list
            :item="item"
            @print="printOn(item, $event.id)"
            @reslice="reslice"
          />
        </section>

        <section
          v-if="versionRows.length"
          class="lib-surface lprint__card"
          aria-label="Versions"
          data-tid="library-versions"
        >
          <div class="lprint__card-head">
            <h2 class="lib-card-title">
              Versions
            </h2>
            <span>The last 10 are kept</span>
          </div>
          <div class="lprint__spine">
            <div
              v-for="row in versionRows"
              :key="row.number"
              class="lprint__ver"
            >
              <span
                class="lprint__node"
                :class="{ 'lprint__node--now': row.current }"
              />
              <span class="lprint__ver-text">
                <b>{{ row.when }}<span
                  v-if="row.current"
                  class="lib-pill lib-pill--run lprint__current"
                >Current</span></b>
                <span>{{ row.line || row.origin }}</span>
              </span>
              <span
                v-if="row.current"
                class="lprint__origin"
              >{{ row.origin }}</span>
              <button
                v-else
                type="button"
                class="lib-btn lib-btn--sm lib-btn--ghost"
                :disabled="busy"
                data-tid="library-restore"
                @click="restore(row)"
              >
                Restore
              </button>
            </div>
          </div>
        </section>

        <section
          class="lib-surface lprint__card"
          aria-label="History"
        >
          <h2 class="lib-card-title">
            {{ printedTimes }}
          </h2>
          <div
            v-if="item.last_printer_name"
            class="lprint__history"
          >
            <frame-icon
              name="check"
              small
            />
            <span>Last on {{ item.last_printer_name }}</span>
            <span class="lprint__when">{{ lastPrinted }}</span>
          </div>
          <p
            v-else
            class="lprint__note"
          >
            Print it on any of your printers, and each print is counted here.
          </p>
        </section>

        <p
          v-if="error"
          class="lprint__note lprint__note--error"
          role="alert"
        >
          {{ error }}
        </p>
      </div>
    </div>

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
import LibraryPrintMixin from '@/mixins/library-print'
import PrinterFitList from '@/components/library/PrinterFitList.vue'
import PrintOnDialog from '@/components/library/PrintOnDialog.vue'
import FileNameDialog from '@/components/widgets/filesystem/FileNameDialog.vue'
import CloudAccountDialog from '@/components/muon-cloud/CloudAccountDialog.vue'

/**
 * A print's own page (`/library/<id>`): its picture, Print on and Open in
 * Slice, how it fits each of your printers now, its versions (an older one
 * can be restored), and how often it has printed. What it does is
 * mixins/library-print.ts; only the look is here.
 */
@Component({ components: { PrinterFitList, PrintOnDialog, FileNameDialog, CloudAccountDialog } })
export default class LibraryPrint extends Mixins(LibraryPrintMixin, BrowserMixin) {}
</script>

<style lang="scss" scoped>
  .lprint {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 1440px;
    margin: 0 auto;
    padding: 6px 12px 40px;
    color: var(--m3d-text);
  }

  .lprint--phone {
    padding: 4px 0 24px;
  }

  .lprint__crumbs {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;

    nav {
      display: flex;
      align-items: center;
      gap: 6px;
      min-width: 0;
      color: var(--m3d-text-muted);
      font-size: 13px;

      a {
        color: var(--m3d-text-muted) !important;
        text-decoration: none;
      }

      span {
        overflow: hidden;
        color: var(--m3d-text);
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .lprint__layout {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
    gap: 24px;
    align-items: start;
  }

  @media (max-width: 1100px) {
    .lprint__layout {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .lprint__stage {
    height: 560px;
    border-radius: 10px;

    > img {
      width: 70%;
      height: 70%;
    }
  }

  .lprint--phone .lprint__stage {
    height: 300px;
  }

  .lprint__right {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;
  }

  .lprint__titles {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .lprint__name {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;

    h1 {
      margin: 0;
      overflow-wrap: anywhere;
      font-size: 28px;
      font-weight: 600;
      line-height: 1.15;
    }
  }

  .lprint--phone .lprint__name h1 {
    font-size: 22px;
  }

  .lprint__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .lprint__dot {
    color: var(--m3d-text-subtle);
  }

  .lprint__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .lprint__card {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 14px 16px;
  }

  .lprint__card-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 4px 12px;

    span {
      color: var(--m3d-text-subtle);
      font-size: 12px;
    }
  }

  .lprint__spine {
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 14px;
      bottom: 14px;
      left: 7px;
      width: 2px;
      background: var(--m3d-border);
    }
  }

  .lprint__ver {
    position: relative;
    display: grid;
    grid-template-columns: 16px minmax(0, 1fr) auto;
    gap: 12px;
    align-items: start;
    padding: 10px 0;
  }

  .lprint__node {
    width: 10px;
    height: 10px;
    margin: 5px 0 0 3px;
    border: 2px solid var(--m3d-border-strong);
    border-radius: 50%;
    background: var(--m3d-surface);
  }

  .lprint__node--now {
    border-color: var(--m3d-accent);
    background: var(--m3d-accent);
  }

  .lprint__ver-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    b {
      font-weight: 600;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 12px;
    }
  }

  .lprint__current {
    margin-left: 6px;
    vertical-align: 1px;
  }

  .lprint__origin {
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .lprint__history {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 0;
    font-size: 13px;

    .frame-icon {
      color: var(--m3d-success);
    }

    span:first-of-type {
      flex: 1 1 auto;
    }
  }

  .lprint__when {
    color: var(--m3d-text-muted);
  }

  .lprint__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .lprint__note--error {
    color: var(--m3d-danger);
  }

  .lprint__danger {
    color: var(--m3d-danger) !important;
  }
</style>
