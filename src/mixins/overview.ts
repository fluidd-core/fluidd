import { Component, Mixins } from 'vue-property-decorator'
import ControlMixin from './control'
import FilesMixin from './files'
import { SocketActions } from '@/api/socketActions'
import type { TimeEstimates } from '@/store/printer/types'
import type { HistoryItem } from '@/store/history/types'
import type { QueuedJob } from '@/store/jobQueue/types'
import { jobName } from '@/services/printers-page/model'
import { filamentFact, heaterTile, longDuration, type HeaterTile } from '@/services/overview/model'
import { activeSlug, printerHomePath } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import getFilePaths from '@/util/get-file-paths'
import { shortDuration } from '@/util/short-duration'
import { printerNameParts } from '@/util/printer-name'

/** A recent job, to print again from Overview. */
export interface RecentJob {
  filename: string;
  name: string;
  thumbnail: string;
  facts: string;
}

/**
 * What Overview's panels share: the print running now and its facts, the
 * heaters as tiles, the queue, recent jobs, and the links to Control and
 * Jobs. The commands are Control's.
 */
@Component
export default class OverviewMixin extends Mixins(ControlMixin, FilesMixin) {
  get printerName (): string {
    return printerNameParts(this.$store.getters['config/getDisplayName'] as string).name
  }

  get printStats () {
    return this.$store.state.printer.printer.print_stats ?? {}
  }

  get currentFile () {
    return this.$store.state.printer.printer.current_file ?? {}
  }

  get jobFile (): string {
    return (this.printStats.filename as string | undefined) || ''
  }

  get jobName (): string {
    return jobName(this.jobFile) ?? ''
  }

  get progress (): number {
    return (this.$store.getters['printer/getPrintProgress'] as number) * 100
  }

  get secondsLeft (): number | null {
    if (!this.printerPrinting) return null
    const estimates = this.$store.getters['printer/getTimeEstimates'] as TimeEstimates
    const left = (estimates.eta - Date.now()) / 1000
    return left > 0 ? left : null
  }

  get leftText (): string | null {
    return this.secondsLeft ? `${shortDuration(this.secondsLeft)} left` : null
  }

  get doneAt (): string | null {
    if (!this.secondsLeft) return null
    const at = new Date(Date.now() + this.secondsLeft * 1000)
    return `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`
  }

  get startedAt (): string | null {
    const duration = this.printStats.total_duration as number | undefined
    if (!duration || !this.jobFile) return null
    const at = new Date(Date.now() - duration * 1000)
    return `${String(at.getHours()).padStart(2, '0')}:${String(at.getMinutes()).padStart(2, '0')}`
  }

  get layer (): number | null {
    return (this.$store.getters['printer/getPrintLayer'] as number) || null
  }

  get layers (): number | null {
    return (this.$store.getters['printer/getPrintLayers'] as number) || null
  }

  get layerFact (): string | null {
    if (!this.layer || !this.layers) return null
    return `${this.layer} of ${this.layers} · ${this.position[2].toFixed(1)} mm`
  }

  get filamentFact (): string | null {
    const used = (this.printStats.filament_used as number | undefined) ?? 0
    const total = (this.currentFile.filament_total as number | undefined) ?? null
    const grams = (this.currentFile.filament_weight_total as number | undefined) ?? null
    return filamentFact(used, total, grams)
  }

  get runningFor (): string | null {
    const d = this.printStats.print_duration as number | undefined
    return d ? longDuration(d) : null
  }

  get slicerSaid (): string | null {
    const t = this.currentFile.estimated_time as number | undefined
    return t ? `${longDuration(t)} total` : null
  }

  /** The part's own picture, from its G-code. */
  get jobThumbnail (): string | null {
    const f = this.currentFile
    if (!f?.thumbnails?.length) return null
    return this.getThumbUrl(f, 'gcodes', f.path, true, f.modified) || null
  }

  get nozzleTile (): HeaterTile | null {
    return this.nozzle ? heaterTile(this.nozzle.temperature, this.nozzle.target) : null
  }

  get bedTile (): HeaterTile | null {
    return this.bed ? heaterTile(this.bed.temperature, this.bed.target) : null
  }

  get queue (): QueuedJob[] {
    return (this.$store.getters['jobQueue/getQueuedJobs'] as QueuedJob[]) ?? []
  }

  get recentJobs (): RecentJob[] {
    const history = (this.$store.getters['history/getUniqueHistory'](3) as HistoryItem[]) ?? []
    return history.map(job => {
      const meta = job.metadata
      const facts: string[] = []
      if (meta?.estimated_time) facts.push(shortDuration(meta.estimated_time))
      if (meta?.filament_weight_total) facts.push(`${Math.round(meta.filament_weight_total)} g${meta.filament_type ? ` ${meta.filament_type}` : ''}`)
      facts.push(this.whenPrinted(job))
      return {
        filename: job.filename,
        name: jobName(job.filename) ?? job.filename,
        thumbnail: meta ? this.getThumbUrl(meta, 'gcodes', getFilePaths(job.filename, 'gcodes').path, false, (meta as { modified?: number }).modified) : '',
        facts: facts.join(' · ')
      }
    })
  }

  whenPrinted (job: HistoryItem): string {
    const days = Math.floor((Date.now() / 1000 - job.start_time) / 86400)
    if (days < 1) return 'printed today'
    if (days < 2) return 'printed yesterday'
    return `printed ${days} days ago`
  }

  pagePath (page: string): string {
    return scopedPath(page, activeSlug())
  }

  async printAgain (filename: string) {
    const name = jobName(filename) ?? filename
    if (!(await this.$confirm(`Print ${name} on ${this.printerName}?`, { title: 'Print', color: 'card-heading', icon: '$printer' }))) return
    const spoolman = this.$store.getters['spoolman/getAvailable'] && this.$store.state.config.uiSettings.spoolman.autoSpoolSelectionDialog
    if (spoolman) {
      this.$store.commit('spoolman/setDialogState', { show: true, filename })
      return
    }
    SocketActions.printerPrintStart(filename)
    if (this.$route.path !== printerHomePath()) this.$router.push(printerHomePath()).catch(() => {})
  }
}
