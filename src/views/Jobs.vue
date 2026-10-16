<template>
  <!--
    What's printing and next, the files, and what printed. Simple shows the
    files as pictures; Pro as a table with its folders, beside a G-code viewer.
  -->
  <div
    class="jobs"
    :class="{ 'jobs--phone': isMobileViewport, 'jobs--table': effectiveView === 'table' }"
    :data-view="effectiveView"
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
            type="button"
            class="jobs__link"
            :disabled="!controlReady"
            data-tid="jobs-queue-start"
            @click="startQueue"
          >
            Start
          </button>
          <button
            v-if="queue.length > 1"
            type="button"
            class="jobs__link"
            data-tid="jobs-queue-clear"
            :disabled="!controlReady"
            @click="clearQueue"
          >
            Clear
          </button>
        </div>
        <div class="jobs__next-list">
          <div
            v-for="queued in queue"
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
              v-if="queue.length > 1"
              type="button"
              class="jobs__unqueue"
              :disabled="!controlReady || queued === queue[0]"
              :aria-label="`Move ${titleOf(queued.filename)} earlier`"
              @click="moveQueued(queued, -1)"
            >
              ↑
            </button>
            <button
              v-if="queue.length > 1"
              type="button"
              class="jobs__unqueue"
              :disabled="!controlReady || queued === queue[queue.length - 1]"
              :aria-label="`Move ${titleOf(queued.filename)} later`"
              @click="moveQueued(queued, 1)"
            >
              ↓
            </button>
            <button
              type="button"
              class="jobs__unqueue"
              :aria-label="`Take ${titleOf(queued.filename)} out of the queue`"
              :disabled="!controlReady"
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

    <control-task-fold
      fold-key="jobs.view.list"
      title="Jobs view"
      summary="Pictures, list or table"
      choice
    >
      <template #default="listChoice">
        <control-task-fold
          fold-key="jobs.view.table"
          title="Jobs view"
          summary="Pictures, list or table"
          choice
        >
          <template #default="tableChoice">
            <seg-picker
              :options="viewOptions"
              :value="selectedView(listChoice.value, tableChoice.value)"
              label="View"
              @input="setView($event, listChoice.choose, tableChoice.choose)"
            />
          </template>
        </control-task-fold>
      </template>
    </control-task-fold>

    <div class="jobs__browser">
      <jobs-table
        :view="effectiveView"
        :control-ready="controlReady"
        :current="viewing ? viewing.key : null"
        @view="viewing = $event"
        @open="open"
        @files="tableFiles = $event"
      />
      <job-viewer
        v-if="effectiveView === 'table'"
        class="jobs__viewer"
        :job="viewing"
        :busy="busy"
        :can-queue="controlReady && canQueue"
        :can-print="controlReady && (!busy || canQueue)"
        :printer-name="printerName"
        @open="open"
        @print="printOrQueue"
      />
    </div>

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
            :disabled="!controlReady || busy"
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
      :can-queue="controlReady && canQueue"
      :can-print="controlReady && (!busy || canQueue)"
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
import ControlTaskFold from '@/components/control/ControlTaskFold.vue'

type JobsView = 'pictures' | 'list' | 'table'

/**
 * Jobs: what is printing and up next, the files on the printer, and what
 * printed lately. Simple shows the files as pictures, each opening its
 * detail (its picture or its layers, and what to know before printing it).
 * Pro shows them as a table with their folders, beside a G-code viewer,
 * and lets the whole queue be seen and trimmed.
 */
@Component({ components: { ControlTaskFold, JobCard, JobDetail, JobsTable, JobViewer, SegPicker, TonePill } })
export default class Jobs extends Mixins(JobsMixin, BrowserMixin) {
  filter: JobFilter = 'all'
  sort: JobSort = 'newest'
  view: JobsView = 'pictures'
  query = ''
  detail: JobFile | null = null
  /** Pro: the file the viewer shows, and the table's files in order, for the detail's arrows. */
  viewing: JobFile | null = null
  tableFiles: JobFile[] = []

  get effectiveView (): JobsView { return this.isMobileViewport && this.view === 'table' ? 'list' : this.view }

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
    return [{ value: 'pictures', label: 'Pictures' }, { value: 'list', label: 'List' }, { value: 'table', label: 'Table' }]
  }

  selectedView (list: boolean, table: boolean): JobsView {
    this.view = table ? 'table' : list ? 'list' : 'pictures'
    return this.view
  }

  setView (view: JobsView, chooseList?: (value: boolean) => void, chooseTable?: (value: boolean) => void) {
    this.view = view
    chooseList?.(view === 'list')
    chooseTable?.(view === 'table')
  }

  get rows (): boolean {
    return this.effectiveView === 'list'
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
    return this.effectiveView === 'table' ? this.tableFiles : this.shown
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
    if (!this.controlReady) return
    SocketActions.serverJobQueueDeleteJobs([job.job_id])
  }

  async clearQueue () {
    if (!this.controlReady) return
    const ok = await this.$confirm(`The files stay on ${this.printerName}.`, { title: `Take all ${this.queue.length} jobs out of the queue?`, buttonTrueText: 'Clear the queue', danger: true })
    if (ok && this.controlReady) SocketActions.serverJobQueueDeleteJobs(this.queue.map(j => j.job_id))
  }

  startQueue () {
    if (this.controlReady) SocketActions.serverJobQueueStart()
  }

  async moveQueued (job: QueuedJob, by: number) {
    if (!this.controlReady) return
    const jobs = [...this.queue]
    const from = jobs.findIndex(item => item.job_id === job.job_id)
    const to = from + by
    if (from < 0 || to < 0 || to >= jobs.length) return
    jobs.splice(to, 0, jobs.splice(from, 1)[0])
    await SocketActions.serverJobQueuePostJob(jobs.map(item => item.filename), true)
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

  .jobs__browser {
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
    .jobs__browser {
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
