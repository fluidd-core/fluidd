<template>
  <!--
    What's printing and next, the files, and what printed. Simple shows the
    files as pictures; Pro as a table with its folders, beside a G-code viewer.
  -->
  <div
    class="jobs"
    :class="{ 'jobs--phone': isMobileViewport, 'jobs--pro': proLayout }"
    :data-tid="proLayout ? 'jobs-pro' : 'jobs-simple'"
  >
    <div
      v-if="busy || queue.length"
      class="jobs__now"
    >
      <router-link
        v-if="busy"
        :to="pagePath('/')"
        class="jobs__printing"
        data-tid="jobs-printing-now"
      >
        <span class="jobs__printing-picture">
          <img
            v-if="jobThumbnail"
            :src="jobThumbnail"
            alt=""
          >
          <frame-icon
            v-else
            name="jobs"
          />
        </span>
        <span class="jobs__printing-text">
          <span class="jobs__caps">{{ printerPaused ? 'Paused' : 'Printing now' }}</span>
          <b>{{ printingTitle }}</b>
          <span class="jobs__printing-numbers">
            <span class="jobs__percent">{{ Math.floor(progress) }}%</span>
            <span v-if="leftText">{{ leftText }}<template v-if="doneAt"> · {{ doneAt }}</template></span>
          </span>
          <span class="jobs__bar"><i :style="{ width: `${Math.min(100, progress)}%` }" /></span>
        </span>
      </router-link>

      <section
        v-if="queue.length"
        class="jobs__next"
        data-tid="jobs-up-next"
      >
        <div class="jobs__next-head">
          <h2>Up next</h2>
          <span class="jobs__count">{{ queue.length }}</span>
          <span class="jobs__hint">Starts when the plate is lifted off and put back</span>
          <button
            v-if="proLayout && queue.length > 1"
            type="button"
            class="jobs__link"
            data-tid="jobs-queue-clear"
            @click="clearQueue"
          >
            Clear
          </button>
        </div>
        <div class="jobs__next-list">
          <div
            v-for="queued in proLayout ? queue : queue.slice(0, 3)"
            :key="queued.job_id"
            class="jobs__queued"
          >
            <span class="jobs__queued-picture">
              <img
                v-if="thumbnailOf(queued.filename)"
                :src="thumbnailOf(queued.filename)"
                alt=""
              >
            </span>
            <span class="jobs__queued-text">
              <b>{{ titleOf(queued.filename) }}</b>
              <span>{{ factsOf(queued.filename) }}</span>
            </span>
            <button
              v-if="proLayout"
              type="button"
              class="jobs__unqueue"
              :aria-label="`Take ${titleOf(queued.filename)} out of the queue`"
              @click="unqueue(queued)"
            >
              <frame-icon
                name="x"
                small
              />
            </button>
          </div>
        </div>
      </section>
    </div>

    <div
      v-if="proLayout"
      class="jobs__pro"
    >
      <jobs-table
        :current="viewing ? viewing.key : null"
        @view="viewing = $event"
        @open="open"
        @files="tableFiles = $event"
      />
      <job-viewer
        class="jobs__viewer"
        :job="viewing"
        :busy="busy"
        :can-queue="canQueue"
        :can-print="klippyReady && (!busy || canQueue)"
        :printer-name="printerName"
        @open="open"
        @print="printOrQueue"
      />
    </div>

    <section
      v-else
      class="jobs__files"
      data-tid="jobs-on-printer"
    >
      <div class="jobs__files-head">
        <h2>On the printer</h2>
        <seg-picker
          :options="filterOptions"
          :value="filter"
          label="Show"
          @input="filter = $event"
        />
        <span class="jobs__grow" />
        <label class="jobs__find">
          <frame-icon
            name="search"
            small
          />
          <input
            v-model="query"
            type="search"
            placeholder="Find a job"
            aria-label="Find a job"
            data-tid="jobs-find"
          >
        </label>
        <select
          v-if="!isMobileViewport"
          v-model="sort"
          class="jobs__sort"
          aria-label="Sort"
        >
          <option value="newest">
            Newest first
          </option>
          <option value="name">
            By name
          </option>
          <option value="time">
            Quickest first
          </option>
        </select>
        <seg-picker
          v-if="!isMobileViewport"
          :options="viewOptions"
          :value="view"
          label="View"
          @input="setView"
        />
        <button
          type="button"
          class="cbtn cbtn--primary"
          data-tid="jobs-upload"
          @click="pickUpload"
        >
          <frame-icon
            name="upload"
            small
          />
          Upload
        </button>
      </div>

      <p
        v-if="!loaded"
        class="jobs__note"
      >
        Reading the printer's files…
      </p>
      <div
        v-else
        :class="rows ? 'jobs__rows' : 'jobs__grid'"
      >
        <job-card
          v-for="job in shown"
          :key="job.key"
          :job="job"
          :row="rows"
          :busy="busy"
          :can-print="klippyReady && (!busy || canQueue)"
          @open="open(job)"
          @print="printOrQueue(job)"
        />
        <div
          v-if="!rows"
          class="jobs__drop"
        >
          <frame-icon name="upload" />
          <b>Drop files here</b>
          <span>G-code goes straight in. STL, 3MF and OBJ open in Slice.</span>
        </div>
      </div>
      <p
        v-if="loaded && !shown.length"
        class="jobs__note"
      >
        {{ query ? `No job matches "${query}".` : filter === 'all' ? 'No G-code on the printer yet. Upload a file, or slice one in Slice.' : 'None here.' }}
      </p>
      <p
        v-if="folders"
        class="jobs__note"
      >
        {{ folders }} {{ folders === 1 ? 'folder' : 'folders' }} too: open them in the file table with Pro on.
      </p>
    </section>

    <section
      v-if="history.length"
      class="jobs__history"
      data-tid="jobs-history"
    >
      <div class="jobs__files-head">
        <h2>History</h2>
        <span class="jobs__grow" />
        <router-link
          class="jobs__link"
          :to="pagePath('/history')"
        >
          See all {{ historyCount }} prints
        </router-link>
      </div>
      <div class="jobs__history-list">
        <div
          v-for="item in history"
          :key="item.job_id"
          class="jobs__history-row"
        >
          <span class="jobs__queued-picture">
            <img
              v-if="item.thumbnail"
              :src="item.thumbnail"
              alt=""
            >
          </span>
          <b class="jobs__history-name">{{ item.title }}</b>
          <tone-pill
            :tone="item.tone"
            :dot="false"
          >
            {{ item.status }}
          </tone-pill>
          <span
            v-if="!isMobileViewport"
            class="jobs__history-when"
          >{{ item.when }}</span>
          <button
            v-if="item.exists"
            type="button"
            class="jobs__again"
            :disabled="!klippyReady || busy"
            @click="printAgain(item.filename)"
          >
            Print again
          </button>
        </div>
      </div>
    </section>

    <input
      ref="upload"
      type="file"
      :accept="gcodeAccept"
      class="jobs__upload"
      @change="onPicked"
    >

    <job-detail
      :job="detail"
      :busy="busy"
      :can-queue="canQueue"
      :can-print="klippyReady && (!busy || canQueue)"
      :has-prev="detailIndex > 0"
      :has-next="detailIndex >= 0 && detailIndex < detailList.length - 1"
      :material="material ? material.name : null"
      :printer-name="printerName"
      @close="detail = null"
      @step="step"
      @print="detail && printOrQueue(detail)"
      @queue="detail && addToQueue(detail)"
      @download="detail && downloadJob(detail)"
      @delete="deleteDetail"
    />
  </div>
</template>

<script lang="ts">
import { Component, Mixins } from 'vue-property-decorator'
import JobsMixin, { type JobFile } from '@/mixins/jobs'
import BrowserMixin from '@/mixins/browser'
import { EventBus } from '@/eventBus'
import { SocketActions } from '@/api/socketActions'
import type { HistoryItem } from '@/store/history/types'
import type { QueuedJob } from '@/store/jobQueue/types'
import { filterJobs, jobFacts, jobTitle, sortJobs, type JobFilter, type JobSort } from '@/services/jobs/model'
import { historyStatus } from '@/services/history/model'
import type { TileTone } from '@/services/printers-page/model'
import getFilePaths from '@/util/get-file-paths'
import JobCard from '@/components/jobs/JobCard.vue'
import JobDetail from '@/components/jobs/JobDetail.vue'
import JobsTable from '@/components/jobs/JobsTable.vue'
import JobViewer from '@/components/jobs/JobViewer.vue'
import SegPicker, { type SegOption } from '@/components/control/SegPicker.vue'
import TonePill from '@/components/printers/TonePill.vue'

const VIEW_KEY = 'muon3d.jobs.view'

function readView (): 'cards' | 'list' {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'cards'
  } catch {
    return 'cards'
  }
}

/**
 * Jobs: what is printing and up next, the files on the printer, and what
 * printed lately. Simple shows the files as pictures, each opening its
 * detail (its picture or its layers, and what to know before printing it).
 * Pro shows them as a table with their folders, beside a G-code viewer,
 * and lets the whole queue be seen and trimmed.
 */
@Component({ components: { JobCard, JobDetail, JobsTable, JobViewer, SegPicker, TonePill } })
export default class Jobs extends Mixins(JobsMixin, BrowserMixin) {
  filter: JobFilter = 'all'
  sort: JobSort = 'newest'
  view: 'cards' | 'list' = readView()
  query = ''
  detail: JobFile | null = null
  /** Pro: the file the viewer shows, and the table's files in order, for the detail's arrows. */
  viewing: JobFile | null = null
  tableFiles: JobFile[] = []

  /** Pro's table and viewer need a desktop's width; a phone gets Simple's page. */
  get proLayout (): boolean {
    return this.pro && !this.isMobileViewport
  }

  /** What Upload takes: the G-code root's own list, as the header's upload button uses. */
  get gcodeAccept (): string {
    const root = this.$store.getters['files/getRootProperties']('gcodes') as { accepts?: string[] } | undefined
    return (root?.accepts ?? []).join(',')
  }

  mounted () {
    this.loadFiles()
  }

  get printingTitle (): string {
    return jobTitle(this.jobFile)
  }

  get filterOptions (): SegOption[] {
    return [
      { value: 'all', label: `All ${this.jobFiles.length}` },
      { value: 'never', label: 'Never printed' },
      { value: 'before', label: 'Printed before' }
    ]
  }

  get viewOptions (): SegOption[] {
    return [{ value: 'cards', label: 'Cards' }, { value: 'list', label: 'List' }]
  }

  setView (view: 'cards' | 'list') {
    this.view = view
    try {
      localStorage.setItem(VIEW_KEY, view)
    } catch {
      // The choice holds for this visit.
    }
  }

  get rows (): boolean {
    return this.isMobileViewport || this.view === 'list'
  }

  get shown (): JobFile[] {
    const q = this.query.trim().toLowerCase()
    const found = q ? this.jobFiles.filter(j => j.title.toLowerCase().includes(q) || j.filename.toLowerCase().includes(q)) : this.jobFiles
    return sortJobs(filterJobs(found, this.filter), this.sort)
  }

  fileFor (filename: string): JobFile | undefined {
    return this.jobFiles.find(j => j.path === filename)
  }

  thumbnailOf (filename: string): string {
    return this.fileFor(filename)?.thumbnail ?? ''
  }

  titleOf (filename: string): string {
    return jobTitle(filename)
  }

  factsOf (filename: string): string {
    return this.fileFor(filename)?.facts ?? ''
  }

  // -- the detail ------------------------------------------------------------

  open (job: JobFile) {
    this.detail = job
  }

  get detailList (): JobFile[] {
    return this.proLayout ? this.tableFiles : this.shown
  }

  get detailIndex (): number {
    return this.detail ? this.detailList.findIndex(j => j.key === this.detail?.key) : -1
  }

  step (by: number) {
    const next = this.detailList[this.detailIndex + by]
    if (next) this.detail = next
  }

  // -- the queue (Pro) ---------------------------------------------------------

  unqueue (job: QueuedJob) {
    SocketActions.serverJobQueueDeleteJobs([job.job_id])
  }

  async clearQueue () {
    const ok = await this.$confirm(`Take all ${this.queue.length} jobs out of the queue? The files stay on ${this.printerName}.`, { title: 'Clear the queue', color: 'card-heading', icon: '$error' })
    if (ok) SocketActions.serverJobQueueDeleteJobs(this.queue.map(j => j.job_id))
  }

  async deleteDetail () {
    if (this.detail && await this.removeJob(this.detail)) this.detail = null
  }

  // -- upload ----------------------------------------------------------------

  pickUpload () {
    (this.$refs.upload as HTMLInputElement).click()
  }

  /** An upload here only adds the file; the dialog after it offers to print. */
  async onPicked (event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    await this.uploadFile(file, '/', 'gcodes', false)
    EventBus.bus.$emit('job-ready', file.name)
  }

  // -- history ---------------------------------------------------------------

  get historyCount (): number {
    return ((this.$store.getters['history/getHistory'] as HistoryItem[]) ?? []).length
  }

  get history () {
    const items = ((this.$store.getters['history/getHistory'] as HistoryItem[]) ?? []).slice(0, this.isMobileViewport ? 3 : 5)
    return items.map(item => {
      const status = this.statusOf(item)
      const meta = item.metadata
      const when = new Date(item.start_time * 1000)
      return {
        job_id: item.job_id,
        filename: item.filename,
        exists: item.exists,
        title: jobTitle(item.filename),
        status: status.text,
        tone: status.tone,
        when: `${when.toLocaleDateString(undefined, { weekday: 'short' })} ${when.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`,
        thumbnail: meta ? this.getThumbUrl(meta, 'gcodes', getFilePaths(item.filename, 'gcodes').path, false, (meta as { modified?: number }).modified) : '',
        facts: jobFacts(meta)
      }
    })
  }

  statusOf (item: HistoryItem): { text: string, tone: TileTone } {
    return historyStatus(item.status, item.filament_used, item.metadata?.filament_total)
  }
}
</script>

<style lang="scss" scoped>
  .jobs {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .jobs__caps {
    color: var(--m3d-text-muted);
    font-family: var(--m3d-font-mono);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .jobs__now {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 16px;
  }

  .jobs__printing,
  .jobs__next {
    display: flex;
    gap: 16px;
    min-width: 0;
    padding: 14px;
    border-radius: 22px;
    background: var(--m3d-surface);
    color: var(--m3d-text) !important;
    text-decoration: none;
  }

  .jobs__printing-picture {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 110px;
    height: 110px;
    border-radius: 16px;
    background: radial-gradient(90% 80% at 50% 45%, #1d2a2a 0%, #121516 75%);
    color: var(--m3d-text-subtle);

    img {
      width: 86%;
      height: 86%;
      object-fit: contain;
    }
  }

  .jobs__printing-text {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    justify-content: center;
    gap: 6px;
    min-width: 0;

    b {
      overflow: hidden;
      font-size: 17px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .jobs__printing-numbers {
    display: flex;
    justify-content: space-between;
    color: var(--m3d-text-muted);
    font-size: 13px;
    font-variant-numeric: tabular-nums;
  }

  .jobs__percent {
    color: var(--m3d-accent);
    font-weight: 700;
  }

  .jobs__bar {
    height: 6px;
    overflow: hidden;
    border-radius: 3px;
    background: var(--m3d-surface-2);

    i {
      display: block;
      height: 100%;
      background: var(--m3d-accent);
    }
  }

  .jobs__next {
    flex-direction: column;
    gap: 10px;
  }

  .jobs__next-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;

    h2 {
      margin: 0;
      font-size: 17px;
      font-weight: 600;
    }
  }

  .jobs__count {
    padding: 1px 8px;
    border-radius: 999px;
    background: var(--m3d-surface-2);
    font-size: 12px;
    font-weight: 600;
  }

  .jobs__hint {
    margin-left: auto;
    color: var(--m3d-text-subtle);
    font-size: 12px;
  }

  .jobs__next-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
  }

  .jobs__queued {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    padding: 8px;
    border-radius: 14px;
    background: var(--m3d-surface-2);
  }

  .jobs__queued-picture {
    display: flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    overflow: hidden;
    border-radius: 10px;
    background: radial-gradient(100% 100% at 50% 35%, #2f3133 0%, #1f2022 70%);

    img {
      width: 86%;
      height: 86%;
      object-fit: contain;
    }
  }

  .jobs__queued-text {
    display: flex;
    flex-direction: column;
    min-width: 0;

    b {
      overflow: hidden;
      font-size: 14px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      color: var(--m3d-text-muted);
      font-size: 12px;
    }
  }

  .jobs__files,
  .jobs__history {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .jobs__files-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px 12px;

    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 700;
    }
  }

  .jobs__grow {
    flex: 1 1 auto;
  }

  .jobs__find {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    width: 220px;
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
  }

  .jobs__sort {
    height: 40px;
    padding: 0 12px;
    border: 0;
    border-radius: 12px;
    background: var(--m3d-surface);
    color: var(--m3d-text);
    font: inherit;
    font-size: 13px;
  }

  .jobs__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 16px;
  }

  .jobs__rows {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 22px;
    background: var(--m3d-surface);

    > * + * {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .jobs__drop {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 220px;
    padding: 20px;
    border: 1.5px dashed var(--m3d-border-strong);
    border-radius: 22px;
    color: var(--m3d-text-subtle);
    font-size: 13px;
    text-align: center;

    b {
      color: var(--m3d-text-muted);
      font-size: 15px;
    }
  }

  .jobs__note {
    margin: 0;
    color: var(--m3d-text-muted);
    font-size: 14px;
  }

  .jobs__link {
    color: var(--m3d-accent) !important;
    font-size: 14px;
    text-decoration: none;
  }

  .jobs__history-list {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-radius: 22px;
    background: var(--m3d-surface);

    > * + * {
      border-top: 1px solid var(--m3d-border);
    }
  }

  .jobs__history-row {
    display: flex;
    align-items: center;
    gap: 14px;
    min-height: 60px;
    padding: 8px 16px 8px 10px;
  }

  .jobs__history-name {
    flex: 1 1 0;
    min-width: 0;
    overflow: hidden;
    font-size: 15px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .jobs__history-when {
    color: var(--m3d-text-muted);
    font-size: 13px;
    white-space: nowrap;
  }

  .jobs__again {
    color: var(--m3d-text);
    font-size: 14px;
    font-weight: 600;
    white-space: nowrap;

    &:disabled {
      opacity: 0.45;
      cursor: default;
    }
  }

  .jobs__upload {
    display: none;
  }

  .jobs__unqueue {
    display: inline-flex;
    flex: none;
    margin-left: auto;
    padding: 6px;
    border-radius: 8px;
    color: var(--m3d-text-muted);

    &:hover {
      background: var(--m3d-surface);
      color: var(--m3d-text);
    }
  }

  .jobs__pro {
    display: grid;
    grid-template-columns: minmax(0, 1.75fr) minmax(340px, 1fr);
    align-items: start;
    gap: 20px;
  }

  .jobs__viewer {
    position: sticky;
    top: 84px;
  }

  // Under a wide desktop, the viewer goes under the table.
  @media (max-width: 1263px) {
    .jobs__pro {
      grid-template-columns: minmax(0, 1fr);
    }

    .jobs__viewer {
      position: static;
    }
  }

  .jobs--phone {
    gap: 18px;

    .jobs__find {
      flex: 1 1 auto;
      width: auto;
    }
  }
</style>
