import { Component, Mixins } from 'vue-property-decorator'
import OverviewMixin from './overview'
import { SocketActions } from '@/api/socketActions'
import type { AppFileWithMeta, FileBrowserEntry } from '@/store/files/types'
import { jobFacts, jobTitle, isGcodeFile, printedBefore } from '@/services/jobs/model'

/** A G-code file on the printer, as Jobs shows it. */
export interface JobFile {
  key: string;
  /** Its path in gcodes/, as the printer prints it. */
  path: string;
  filename: string;
  title: string;
  facts: string;
  thumbnail: string;
  printed: boolean;
  printing: boolean;
  modified: number;
  size: number;
  estimated_time?: number;
  /** Its last print, when it has one: the store gives an empty one when it hasn't. */
  history?: { job_id?: string };
  print_start_time?: number | null;
  file: AppFileWithMeta;
}

/**
 * What Jobs' panels share: the G-code files on the printer (loaded when
 * the page opens), their pictures and facts, and printing, queueing and
 * removing them. Printing goes the way the file browser's does, Spoolman
 * dialog included.
 */
@Component
export default class JobsMixin extends Mixins(OverviewMixin) {
  get root (): string {
    return 'gcodes'
  }

  loadFiles () {
    SocketActions.serverFilesGetDirectory(this.root, this.root)
  }

  get entries (): FileBrowserEntry[] {
    return (this.$store.getters['files/getDirectory'](this.root) as FileBrowserEntry[] | undefined) ?? []
  }

  get loaded (): boolean {
    return !!this.$store.getters['files/getDirectory'](this.root)
  }

  get jobFiles (): JobFile[] {
    const printing = this.busy ? this.jobFile : ''
    return this.entries
      .filter((e): e is AppFileWithMeta => e.type === 'file' && isGcodeFile(e.filename))
      .map(f => {
        const path = f.path ? `${f.path}/${f.filename}` : f.filename
        return {
          key: path,
          path,
          filename: f.filename,
          title: jobTitle(f.filename),
          facts: jobFacts(f),
          thumbnail: this.getThumbUrl(f, this.root, f.path, true, f.modified) || '',
          printed: printedBefore(f as never),
          printing: !!printing && printing === path,
          modified: f.modified,
          size: f.size,
          estimated_time: f.estimated_time,
          history: f.history as { job_id?: string } | undefined,
          print_start_time: (f as { print_start_time?: number | null }).print_start_time,
          file: f
        }
      })
  }

  get folders (): number {
    return this.entries.filter(e => e.type === 'directory' && e.name !== '..').length
  }

  get freeSpace (): string | null {
    const usage = this.$store.getters['files/getUsage'] as { free?: number } | undefined
    const free = usage?.free
    if (!free) return null
    return free > 1e9 ? `${(free / 1e9).toFixed(1)} GB free` : `${Math.round(free / 1e6)} MB free`
  }

  get canQueue (): boolean {
    return this.$store.getters['server/componentSupport']('job_queue') as boolean
  }

  /** Print now, or into the queue when the printer is busy and it has one. */
  async printOrQueue (job: JobFile) {
    if (this.busy) {
      if (this.canQueue) await this.addToQueue(job)
      return
    }
    await this.printAgain(job.path)
  }

  async addToQueue (job: JobFile) {
    await SocketActions.serverJobQueuePostJob([job.path])
  }

  async removeJob (job: JobFile): Promise<boolean> {
    const ok = await this.$confirm(`Delete ${job.title} from ${this.printerName}? This can't be undone.`, { title: 'Delete', color: 'card-heading', icon: '$error' })
    if (!ok) return false
    SocketActions.serverFilesDeleteFile(`${this.root}/${job.path}`)
    return true
  }

  downloadJob (job: JobFile) {
    this.downloadFile(job.filename, job.file.path ? `${this.root}/${job.file.path}` : this.root)
  }
}
