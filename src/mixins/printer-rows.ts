import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import type { InstanceConfig } from '@/store/config/types'
import type { CloudPrinter } from '@/services/muon-cloud/api'
import { cloudState } from '@/services/muon-cloud/state'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'
import { activeSlug, knownPrinters } from '@/services/printer-pages'
import { slugForCloudPrinter } from '@/services/printer-pages/slug'
import { bridgeModel } from '@/services/slicer-bridge/selection'
import { printerNameParts } from '@/util/printer-name'
import type { LibraryItem } from '@/services/library/api'
import type { PrinterFacts } from '@/services/library/fit'
import { activePrinterFacts, localPrinterFacts, printingNow, remotePrinterFacts } from '@/services/library/print-on'
import { targetRow, type TargetRow } from '@/services/library/print-targets'
import { jobTitle } from '@/services/jobs/model'

type Loaded = { nozzleMm: number | null, material: string | null }

/** How long a printer may take to say what it has loaded. */
export const FACTS_MS = 15_000

/**
 * The account's printers, one row each, with whether `item` can go to it
 * now (print-targets.ts): the printer Fluidd is on, read from Fluidd's own
 * state; every other online one asked what it has loaded, on this network
 * when it is saved here, else through Muon3D. Print on… and a print's
 * "Your printers" share it.
 */
@Component
export default class PrinterRowsMixin extends Vue {
  @Prop({ type: Object, default: null })
  readonly item!: LibraryItem | null

  /** What each other printer has, as it answered: undefined while asked, null when it didn't. */
  loaded: Record<string, Loaded | null> = {}

  @Watch('item', { immediate: true })
  onItemForRows (item: LibraryItem | null, before?: LibraryItem | null) {
    if (item && item.id !== before?.id) this.readPrinters()
  }

  get printers (): CloudPrinter[] {
    return cloudState.printers
  }

  /** The account printer Fluidd is on: the cloud one, or a saved one that said its EndpointId. */
  get activeId (): string | null {
    const apiUrl: string = this.$store.state.config.apiUrl
    if (!apiUrl) return null
    if (isManagedApiUrl(apiUrl)) return cloudState.activePrinterId
    const instances = (this.$store.state.config.instances ?? []) as InstanceConfig[]
    return instances.find(i => i.apiUrl === apiUrl)?.endpointId ?? null
  }

  /** Its page: the one Fluidd is on for the printer open here (it may be reached on this network), else the account's. */
  slugOf (printer: CloudPrinter, active: boolean): string {
    if (active) {
      const slug = activeSlug()
      if (slug) return slug
    }
    return knownPrinters().find(t => t.kind === 'cloud' && t.printerId === printer.id)?.slug ?? slugForCloudPrinter(printer)
  }

  factsOf (printer: CloudPrinter, active: boolean): PrinterFacts | null {
    const model = bridgeModel(printer.model)
    if (active) return activePrinterFacts(this.$store, model)
    const loaded = this.loaded[printer.id]
    if (loaded === undefined && printer.online) return null
    return { online: printer.online, model, nozzleMm: loaded?.nozzleMm ?? null, material: loaded?.material ?? null }
  }

  /** What it is printing now, as a title, or null. */
  busyWith (printer: CloudPrinter, active: boolean): string | null {
    if (active) {
      const file = printingNow(this.$store)
      return file ? jobTitle(file) : null
    }
    const status = cloudState.status[printer.id]
    if (!status?.reachable || (status.state !== 'printing' && status.state !== 'paused')) return null
    return status.filename ? jobTitle(status.filename) : 'a print'
  }

  get rows (): TargetRow[] {
    const item = this.item
    if (!item) return []
    return this.printers.map((printer) => {
      const active = printer.id === this.activeId
      const target = { id: printer.id, name: printerNameParts(printer.name).name, slug: this.slugOf(printer, active), active }
      return targetRow(target, item.setups ?? [], this.factsOf(printer, active), {
        unread: !active && this.loaded[printer.id] === null,
        busy: this.busyWith(printer, active)
      })
    })
  }

  /** The printer's model as the slicer names it, for the check once Fluidd is on it. */
  modelOf (id: string): string | null {
    return bridgeModel(this.printers.find(p => p.id === id)?.model)
  }

  readPrinters () {
    const instances = (this.$store.state.config.instances ?? []) as InstanceConfig[]
    for (const printer of this.printers) {
      if (printer.id === this.activeId || !printer.online) continue
      this.$set(this.loaded, printer.id, undefined)
      const local = window.location.protocol === 'https:' ? undefined : instances.find(i => i.endpointId === printer.id && !isManagedApiUrl(i.apiUrl))
      const read = local ? localPrinterFacts(local.apiUrl) : remotePrinterFacts(printer.id)
      const timeout = new Promise<null>(resolve => setTimeout(() => resolve(null), FACTS_MS))
      Promise.race([read, timeout])
        .then(answer => this.$set(this.loaded, printer.id, answer))
        .catch(() => this.$set(this.loaded, printer.id, null))
    }
  }
}
