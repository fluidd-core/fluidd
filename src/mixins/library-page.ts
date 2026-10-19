import { Component, Vue } from 'vue-property-decorator'
import { activeSlug } from '@/services/printer-pages'
import { scopedPath } from '@/router/printerPagePaths'
import { cloudState } from '@/services/muon-cloud/state'
import { isManagedApiUrl } from '@/services/muon-cloud/origin'
import type { InstanceConfig } from '@/store/config/types'
import { bridgeModel } from '@/services/slicer-bridge/selection'
import { printerNameParts } from '@/util/printer-name'
import { describeLibraryError, type ItemSetup, type LibraryItem } from '@/services/library/api'
import { dayText, findPrints, librarySummary, storageLine, type PrintSort } from '@/services/library/format'
import { fitText, printerFit } from '@/services/library/fit'
import { activePrinterFacts, downloadGcode, downloadProject, gcodeFileName, saveToComputer } from '@/services/library/print-on'
import { libraryPromise, PROMISE_URL } from '@/services/library/promise'
import { fileName } from '@/services/library/save'
import {
  copyPrint,
  deletePrint,
  libraryItems,
  libraryPrints,
  libraryState,
  refreshLibrary,
  renamePrint,
  syncLibrary,
  turnLibraryOn,
  watchLibraryAccount
} from '@/services/library/store'

/** How often the list is brought up to date while the page is open. */
export const SYNC_MS = 30_000

/** What the chips show: everything, the prints, the models the phone keeps, or what fits the printer open here. */
export type LibraryFilter = 'all' | 'prints' | 'models' | 'fits'

/** How a print stands on the printer Fluidd is on: "Ready on Boxwood", "Boxwood has PETG loaded". */
export interface ActiveFit {
  text: string;
  tone: 'ok' | 'warn' | 'off';
  ready: boolean;
}

/**
 * What the Library page does, apart from how it looks: which state it is in
 * (signed out, off, empty, or listing), the prints found and sorted, and the
 * card's actions (Open in Slice, Rename, Save as copy, Download, Delete).
 * Print on… is the dialog's own (mixins/print-on.ts). The page itself
 * (views/Library.vue) is only its template and styles.
 */
@Component
export default class LibraryPageMixin extends Vue {
  query = ''
  sort: PrintSort = 'recent'
  filter: LibraryFilter = 'all'
  /** The print Print on… is open for. */
  printing: LibraryItem | null = null
  /** The print being renamed or copied, and which. */
  naming: { item: LibraryItem, mode: 'rename' | 'copy' } | null = null
  accountDialog = false
  busy = false
  error = ''
  syncTimer = 0

  promiseUrl = PROMISE_URL

  get promise () {
    return libraryState.checked ? libraryPromise(libraryState.promiseVersion) : null
  }

  created () {
    watchLibraryAccount()
    this.refresh()
    this.syncTimer = window.setInterval(this.syncNow, SYNC_MS)
    window.addEventListener('focus', this.syncNow)
    window.addEventListener('keydown', this.onSlash)
  }

  beforeDestroy () {
    window.clearInterval(this.syncTimer)
    window.removeEventListener('focus', this.syncNow)
    window.removeEventListener('keydown', this.onSlash)
  }

  /** "/" goes to the search, unless something is being typed already. */
  onSlash (event: KeyboardEvent) {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return
    const target = event.target as HTMLElement | null
    if (target && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return
    const search = this.$refs.search as HTMLInputElement | undefined
    if (!search) return
    event.preventDefault()
    search.focus()
  }

  syncNow () {
    if (libraryState.enabled) syncLibrary().catch(() => {})
  }

  get state () {
    return libraryState
  }

  get signedIn (): boolean {
    return libraryState.account !== null
  }

  get prints (): LibraryItem[] {
    return libraryPrints()
  }

  /** Prints and the models the phone app keeps. */
  get everything (): LibraryItem[] {
    return libraryItems()
  }

  get models (): LibraryItem[] {
    return this.everything.filter(item => !item.versioned)
  }

  /** The list shows (rather than one of the states that say what to do instead). */
  get listing (): boolean {
    return this.signedIn && libraryState.enabled && this.everything.length > 0
  }

  get filtered (): LibraryItem[] {
    switch (this.filter) {
      case 'prints': return this.prints
      case 'models': return this.models
      case 'fits': return this.prints.filter(item => this.activeFit(item)?.ready)
      default: return this.everything
    }
  }

  get shown (): LibraryItem[] {
    return findPrints(this.filtered, this.query, this.sort)
  }

  /** "Pick up where you left off": the three prints changed or printed last, while nothing is searched. */
  get recent (): LibraryItem[] {
    if (this.query.trim() || this.filter !== 'all' || this.prints.length < 4) return []
    return this.prints.slice(0, 3)
  }

  /** The account printer Fluidd is on, by its name and id, or null. */
  get activePrinter (): { id: string | null, name: string, model: string | null } | null {
    const apiUrl: string = this.$store.state.config.apiUrl
    if (!apiUrl || !this.$store.getters['socket/getConnectionState']) return null
    const id = isManagedApiUrl(apiUrl)
      ? cloudState.activePrinterId
      : ((this.$store.state.config.instances ?? []) as InstanceConfig[]).find(i => i.apiUrl === apiUrl)?.endpointId ?? null
    const account = id ? cloudState.printers.find(p => p.id === id) : undefined
    const name = printerNameParts(account?.name ?? (this.$store.getters['config/getDisplayName'] as string) ?? '').name
    return { id, name, model: bridgeModel(account?.model) }
  }

  /** How a print stands on the printer open here, or null with none open. */
  activeFit (item: LibraryItem): ActiveFit | null {
    const printer = this.activePrinter
    if (!printer || !item.versioned) return null
    const fit = printerFit(item.setups ?? [], activePrinterFacts(this.$store, printer.model))
    switch (fit.kind) {
      case 'ready': return { text: `Ready on ${printer.name}`, tone: 'ok', ready: true }
      case 'offline': return { text: `${printer.name} isn't ready`, tone: 'off', ready: false }
      case 'material': return { text: `${printer.name} has ${fit.loaded} loaded`, tone: 'warn', ready: false }
      default: return { text: fitText(fit).label, tone: 'warn', ready: false }
    }
  }

  /** The printer Print on… chooses first. */
  preferPrinter: string | null = null

  printOn (item: LibraryItem, prefer: string | null = null) {
    this.preferPrinter = prefer
    this.printing = item
  }

  get storage (): string {
    return storageLine(libraryState.usedBytes, libraryState.quotaBytes)
  }

  get summary (): string {
    if (!this.signedIn || !libraryState.enabled) return ''
    return librarySummary(this.prints.length, libraryState.usedBytes, libraryState.quotaBytes)
  }

  get purgeDay (): string {
    return dayText(libraryState.purgeAfter)
  }

  /** The Library's settings: the account's (KAN-532), under the printer Fluidd is on when there is one. */
  get settingsTo (): string {
    return scopedPath('/account/library', activeSlug())
  }

  refresh () {
    refreshLibrary().catch(() => {})
  }

  async act (what: () => Promise<unknown>) {
    this.busy = true
    this.error = ''
    try {
      await what()
    } catch (error) {
      this.error = describeLibraryError(error)
    } finally {
      this.busy = false
    }
  }

  /** Turning it on is consent to the promise, so the promise is what it asks with. */
  async turnOn () {
    const promise = this.promise
    if (!promise) return
    const ok = await this.$confirm(promise.summary, {
      title: 'Turn on your Library?',
      buttonTrueText: 'Turn it on'
    })
    if (ok) await this.act(() => turnLibraryOn(promise.version))
  }

  /** A print's own page, under the printer open here. */
  printTo (item: LibraryItem): string {
    return scopedPath(`/library/${item.id}`, activeSlug())
  }

  openInSlice (item: LibraryItem) {
    this.$router.push({ path: '/slice', query: { library: item.id } }).catch(() => {})
  }

  rename (item: LibraryItem) {
    this.naming = { item, mode: 'rename' }
  }

  copy (item: LibraryItem) {
    this.naming = { item, mode: 'copy' }
  }

  saveName (name: string) {
    const naming = this.naming
    this.naming = null
    if (!naming) return
    return this.act(() => naming.mode === 'rename' ? renamePrint(naming.item.id, name) : copyPrint(naming.item.id, name))
  }

  downloadGcode (item: LibraryItem, setup: ItemSetup) {
    return this.act(async () => saveToComputer(await downloadGcode(item, setup), gcodeFileName(item), 'text/plain'))
  }

  downloadProject (item: LibraryItem) {
    return this.act(async () => saveToComputer(await downloadProject(item), fileName(item.name, '3mf'), 'model/3mf'))
  }

  async remove (item: LibraryItem) {
    const ok = await this.$confirm('It\'s deleted from your Library on every printer and phone. Files already on a printer stay there. This can\'t be undone.', {
      title: `Delete ${item.name}?`,
      buttonTrueText: 'Delete',
      danger: true
    })
    if (!ok) return
    await this.act(() => deletePrint(item.id))
  }
}
