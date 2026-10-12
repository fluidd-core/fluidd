<template>
  <div
    class="hist"
    :class="{ 'hist--phone': isMobileViewport }"
    data-tid="history-page"
  >
    <dl
      class="hist__totals"
      data-tid="history-totals"
    >
      <div>
        <dt>Prints</dt>
        <dd>{{ rollup.total_jobs || 0 }}</dd>
        <span>{{ items.length ? finished : 'none yet' }}</span>
      </div>
      <div>
        <dt>Printing time</dt>
        <dd>{{ duration(rollup.total_print_time) }}</dd>
        <span v-if="rollup.total_jobs">about {{ duration(rollup.print_avg) }} each</span>
      </div>
      <div>
        <dt>Filament</dt>
        <dd>{{ length(rollup.total_filament_used) }}</dd>
        <span v-if="rollup.total_jobs">about {{ length(rollup.filament_avg) }} each</span>
      </div>
      <div>
        <dt>Longest print</dt>
        <dd>{{ duration(rollup.longest_print) }}</dd>
        <span v-if="rollup.longest_job">{{ duration(rollup.longest_job) }} with the warm-up</span>
      </div>
    </dl>

    <div class="hist__bar">
      <seg-picker
        :options="filterOptions"
        :value="filter"
        label="Show"
        @input="filter = $event"
      />
      <span class="hist__grow" />
      <label class="hist__find">
        <frame-icon
          name="search"
          small
        />
        <input
          v-model="query"
          type="search"
          placeholder="Find a print"
          aria-label="Find a print"
          data-tid="history-find"
        >
      </label>
    </div>

    <p
      v-if="!items.length"
      class="hist__note"
    >
      Nothing has printed yet. Prints appear here as they finish, stop or fail.
    </p>
    <p
      v-else-if="!groups.length"
      class="hist__note"
    >
      {{ query ? `No print matches "${query}".` : 'None here.' }}
    </p>

    <section
      v-for="group in groups"
      :key="group.label"
      class="hist__day"
    >
      <h2>{{ group.label }}</h2>
      <div class="hist__list">
        <div
          v-for="row in group.items"
          :key="row.id"
          class="hist__item"
          :class="{ 'hist__item--open': open === row.id, 'hist__item--gone': !row.exists }"
          :data-job="row.id"
        >
          <button
            type="button"
            class="hist__row"
            :aria-expanded="open === row.id ? 'true' : 'false'"
            @click="open = open === row.id ? null : row.id"
          >
            <span class="hist__thumb">
              <img
                v-if="row.thumbnail"
                :src="row.thumbnail"
                alt=""
                loading="lazy"
                @error="dropThumbnail(row.id)"
              >
              <frame-icon
                v-else
                name="jobs"
                small
              />
            </span>
            <span class="hist__names">
              <b>{{ row.title }}</b>
              <span>{{ row.file }}</span>
            </span>
            <tone-pill
              :tone="row.status.tone"
              :dot="false"
            >
              {{ row.status.text }}
            </tone-pill>
            <span class="hist__cell hist__time">{{ row.started }}</span>
            <span class="hist__cell">{{ row.took }}</span>
            <span class="hist__cell hist__used">{{ row.used }}</span>
            <frame-icon
              :name="open === row.id ? 'chevronUp' : 'chevronDown'"
              small
            />
          </button>

          <div
            v-if="open === row.id"
            class="hist__detail"
            data-tid="history-detail"
          >
            <dl class="hist__facts">
              <div
                v-for="fact in row.facts"
                :key="fact.label"
              >
                <dt>{{ fact.label }}</dt>
                <dd>{{ fact.value }}</dd>
              </div>
            </dl>
            <p
              v-if="!row.exists"
              class="hist__gone"
            >
              The file is no longer on {{ printerName }}, so it can't print again from here.
            </p>
            <div class="hist__actions">
              <button
                v-if="row.exists"
                type="button"
                class="cbtn cbtn--primary"
                :disabled="!klippyReady || busy"
                data-tid="history-print-again"
                @click="printAgain(row.filename)"
              >
                Print again
              </button>
              <button
                type="button"
                class="cbtn cbtn--ghost"
                data-tid="history-remove"
                @click="remove(row.id)"
              >
                Remove from history
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="hist__foot">
      <span v-if="items.length < saved">
        Showing the last {{ items.length }} of {{ saved }}.
        <button
          type="button"
          class="hist__link"
          data-tid="history-load-all"
          @click="loadAll"
        >
          Load them all
        </button>
      </span>
      <span class="hist__grow" />
      <button
        v-if="items.length"
        type="button"
        class="cbtn cbtn--ghost"
        data-tid="history-clear"
        @click="clearAll"
      >
        Clear history
      </button>
      <button
        v-if="rollup.total_jobs"
        type="button"
        class="cbtn cbtn--ghost"
        data-tid="history-reset-totals"
        @click="resetTotals"
      >
        Reset the totals
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from '@/mixins/overview'
import BrowserMixin from '@/mixins/browser'
import { SocketActions } from '@/api/socketActions'
import type { HistoryItem } from '@/store/history/types'
import { jobTitle } from '@/services/jobs/model'
import { longDuration } from '@/services/overview/model'
import { filterHistory, finishedShare, groupByDay, historyStatus, metres, slicerFacts, type HistoryFilter, type HistoryStatus } from '@/services/history/model'
import getFilePaths from '@/util/get-file-paths'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import TonePill from '@/components/printers/TonePill.vue'

interface Row {
  id: string;
  filename: string;
  file: string;
  title: string;
  exists: boolean;
  status: HistoryStatus;
  thumbnail: string;
  started: string;
  took: string;
  used: string;
  facts: Array<{ label: string, value: string }>;
  start_time: number;
}

/**
 * History: the printer's totals, then every print by the day it started,
 * filtered to how it ended and searched by name. A print opens to its
 * times, its filament and what the slicer set, with Print again and
 * Remove from history.
 */
@Component({ components: { SegPicker, TonePill } })
export default class History extends Mixins(OverviewMixin, BrowserMixin) {
  filter: HistoryFilter = 'all'
  query = ''
  open: string | null = null

  get items (): HistoryItem[] {
    return (this.$store.getters['history/getHistory'] as HistoryItem[]) ?? []
  }

  /** How many prints Moonraker keeps, loaded or not. The totals can be reset apart from it. */
  get saved (): number {
    return Number(this.$store.state.history.count ?? 0) || this.items.length
  }

  get rollup () {
    return this.$store.getters['history/getRollUp'] as {
      total_jobs: number, total_print_time: number, total_filament_used: number, longest_job: number,
      longest_print: number, print_avg: number, filament_avg: number
    }
  }

  get finished (): string {
    return finishedShare(this.items)
  }

  get filterOptions (): SegOption[] {
    const count = (kind: HistoryFilter) => filterHistory(this.items, kind, '').length
    return [
      { value: 'all', label: 'All' },
      { value: 'finished', label: 'Finished' },
      { value: 'stopped', label: 'Stopped' },
      { value: 'failed', label: count('failed') ? `Failed · ${count('failed')}` : 'Failed' }
    ]
  }

  get groups (): Array<{ label: string, items: Row[] }> {
    return groupByDay(filterHistory(this.items, this.filter, this.query)).map(g => ({
      label: g.label,
      items: g.items.map(item => this.row(item))
    }))
  }

  row (item: HistoryItem): Row {
    const meta = item.metadata as (Record<string, unknown> & { thumbnails?: unknown[], modified?: number, filament_total?: number, size?: number }) | undefined
    const start = new Date(item.start_time * 1000)
    const end = item.end_time ? new Date(Number(item.end_time) * 1000) : null
    const clock = (d: Date) => d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    const facts = [
      { label: 'Started', value: `${start.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} ${clock(start)}` },
      ...(end ? [{ label: 'Ended', value: clock(end) }] : []),
      { label: 'Printing', value: longDuration(item.print_duration) },
      { label: 'With the warm-up', value: longDuration(item.total_duration) },
      { label: 'Filament used', value: metres(item.filament_used) },
      ...slicerFacts(meta),
      ...(meta?.size ? [{ label: 'File', value: `${(meta.size / 1e6).toFixed(1)} MB` }] : [])
    ]
    return {
      id: item.job_id,
      filename: item.filename,
      file: item.filename.split('/').pop() ?? item.filename,
      title: jobTitle(item.filename),
      exists: item.exists,
      status: historyStatus(item.status, item.filament_used, meta?.filament_total),
      thumbnail: meta?.thumbnails?.length
        ? this.getThumbUrl(meta as never, 'gcodes', getFilePaths(item.filename, 'gcodes').path, false, meta.modified) || ''
        : '',
      started: clock(start),
      took: longDuration(item.print_duration),
      used: metres(item.filament_used),
      facts,
      start_time: item.start_time
    }
  }

  duration (seconds?: number): string {
    return seconds ? longDuration(seconds) : '—'
  }

  length (mm?: number): string {
    return mm ? metres(mm) : '—'
  }

  dropThumbnail (id: string) {
    this.$store.dispatch('history/clearHistoryThumbnails', id)
  }

  remove (id: string) {
    SocketActions.serverHistoryDeleteJob(id)
    if (this.open === id) this.open = null
  }

  loadAll () {
    SocketActions.serverHistoryList({ limit: 0 })
  }

  async clearAll () {
    const ok = await this.$confirm('The files stay, and so do the totals.', { title: `Remove all ${this.items.length} prints from ${this.printerName}'s history?`, buttonTrueText: 'Clear history', danger: true })
    if (ok) SocketActions.serverHistoryDeleteJob('all')
  }

  async resetTotals () {
    const ok = await this.$confirm('The prints listed here stay.', { title: `Set ${this.printerName}'s totals back to zero?`, buttonTrueText: 'Reset the totals', danger: true })
    if (ok) SocketActions.serverHistoryResetTotals()
  }
}
</script>

<style lang="scss" scoped>
  .hist {
    display: flex;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }

  .hist__totals {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin: 0;

    > div {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 14px 18px;
      border-radius: 18px;
      background: var(--m3d-surface);
    }

    dt {
      color: var(--m3d-text-subtle);
      font-size: 11px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    dd {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 12px;
    }
  }

  .hist__bar,
  .hist__foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .hist__foot {
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .hist__grow {
    flex: 1 1 auto;
  }

  .hist__find {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: 240px;
    height: 40px;
    padding: 0 12px;
    border-radius: 12px;
    background: var(--m3d-surface);
    color: var(--m3d-text-muted);

    input {
      flex: 1 1 0;
      min-width: 0;
      border: 0;
      outline: none;
      background: transparent;
      color: var(--m3d-text);
      font: inherit;
      font-size: 14px;
    }

    input:focus-visible {
      outline: none;
    }

    &:focus-within {
      box-shadow: 0 0 0 2px var(--m3d-accent);
    }
  }

  .hist__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .hist__day h2 {
    margin: 0 0 8px 4px;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .hist__list {
    overflow: hidden;
    border-radius: 20px;
    background: var(--m3d-surface);

    > .hist__item + .hist__item {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .hist__row {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr) auto 64px 90px 80px 16px;
    align-items: center;
    gap: 14px;
    width: 100%;
    min-height: 62px;
    padding: 8px 16px 8px 10px;
    color: var(--m3d-text);
    text-align: left;

    &:hover {
      background: var(--m3d-hover, rgba(255, 255, 255, 0.03));
    }
  }

  .hist__thumb {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    overflow: hidden;
    border-radius: 10px;
    background: radial-gradient(100% 100% at 50% 35%, #2f3133 0%, #1f2022 70%);
    color: var(--m3d-text-subtle);

    img {
      width: 86%;
      height: 86%;
      object-fit: contain;
    }
  }

  .hist__names {
    display: flex;
    flex-direction: column;
    min-width: 0;

    b,
    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    b {
      font-size: 15px;
    }

    span {
      color: var(--m3d-text-subtle);
      font-family: var(--m3d-font-mono, monospace);
      font-size: 11.5px;
    }
  }

  .hist__cell {
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
    text-align: right;
    white-space: nowrap;
  }

  .hist__item--gone .hist__names b {
    color: var(--m3d-text-muted);
  }

  .hist__item--open {
    background: rgba(255, 255, 255, 0.02);
  }

  .hist__detail {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 4px 16px 16px 68px;
  }

  .hist__facts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 8px;
    margin: 0;

    div {
      padding: 8px 12px;
      border-radius: 12px;
      background: var(--m3d-surface-2);
    }

    dt {
      color: var(--m3d-text-subtle);
      font-size: 11px;
    }

    dd {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }
  }

  .hist__gone {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 13px;
  }

  .hist__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .hist__link {
    color: var(--m3d-accent);
    font-weight: 600;
  }

  @media (max-width: 1100px) {
    .hist__totals {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .hist--phone {
    .hist__find {
      flex: 1 1 auto;
      width: auto;
    }

    .hist__row {
      grid-template-columns: 44px minmax(0, 1fr) auto 16px;
    }

    .hist__cell {
      display: none;
    }

    .hist__detail {
      padding-left: 16px;
    }
  }
</style>
