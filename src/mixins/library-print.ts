import { Component, Mixins, Watch } from 'vue-property-decorator'
import { scopedPath } from '@/router/printerPagePaths'
import { activeSlug, printerPath } from '@/services/printer-pages'
import type { LibraryItem, Version } from '@/services/library/api'
import { agoText, setupLine, versionLine, versionOrigin, versionWhen } from '@/services/library/format'
import { loadThumbnail, thumbnailFor } from '@/services/library/thumbnails'
import { libraryState, loadItem, printVersions, restoreVersion } from '@/services/library/store'
import type { TargetRow } from '@/services/library/print-targets'
import LibraryPageMixin from './library-page'

export interface VersionRow {
  number: number;
  when: string;
  line: string;
  origin: string;
  current: boolean;
}

/**
 * What a print's own page does, apart from how it looks: the print the
 * address names, its versions (and restoring one), its history, and the
 * actions the Library page's card has. The page itself
 * (views/LibraryPrint.vue) is only its template and styles.
 */
@Component
export default class LibraryPrintMixin extends Mixins(LibraryPageMixin) {
  /** The print, once read; null when the Library has no such print. */
  loaded: LibraryItem | null = null
  missing = false
  versions: Version[] = []

  get itemId (): string {
    return String(this.$route.params.item ?? '')
  }

  /** The print as the list has it now (a rename, a print elsewhere), else as it was read. */
  get item (): LibraryItem | null {
    return libraryState.items[this.itemId] ?? this.loaded
  }

  @Watch('itemId', { immediate: true })
  async onItemId (id: string) {
    this.missing = false
    this.loaded = null
    this.versions = []
    if (!id) return
    try {
      await this.readyLibrary()
      const item = await loadItem(id)
      if (id !== this.itemId) return
      this.loaded = item
      this.missing = !item && libraryState.enabled
    } catch {
      this.missing = libraryState.enabled
    }
  }

  /** Waits until the Library has answered for this account (or there is none). */
  async readyLibrary () {
    const ready = () => libraryState.checked || !libraryState.account
    if (ready()) return
    await new Promise<void>(resolve => {
      const stop = this.$watch(ready, (now: boolean) => {
        if (!now) return
        stop()
        resolve()
      })
    })
  }

  @Watch('item.version')
  async readVersions () {
    const item = this.item
    if (!item?.versioned) return
    try {
      const versions = await printVersions(item.id)
      if (item.id === this.itemId) this.versions = versions
    } catch { /* the page shows what the item says */ }
  }

  @Watch('item', { immediate: true })
  onItemPicture (item: LibraryItem | null, before?: LibraryItem | null) {
    if (!item) return
    loadThumbnail(item)
    if (item.id !== before?.id) this.readVersions()
  }

  /** It fits the printer open here as it is. */
  get readyHere (): boolean {
    return !!this.item && !!this.activeFit(this.item)?.ready
  }

  get picture (): string | null {
    return this.item ? thumbnailFor(this.item) : null
  }

  get libraryTo (): string {
    return scopedPath('/library', activeSlug())
  }

  get firstSetup (): string {
    const setup = this.item?.setups?.[0]
    return setup ? setupLine(setup) : ''
  }

  get savedAgo (): string {
    return agoText(this.item?.updated_at)
  }

  get printedTimes (): string {
    const n = this.item?.printed_count ?? 0
    return n === 0 ? 'Not printed yet' : n === 1 ? 'Printed once' : `Printed ${n} times`
  }

  get lastPrinted (): string {
    const item = this.item
    if (!item?.last_printed_at) return ''
    return agoText(item.last_printed_at)
  }

  get versionRows (): VersionRow[] {
    const current = this.item?.version ?? null
    return this.versions.map(v => ({
      number: v.number,
      when: versionWhen(v.created_at),
      line: versionLine(v),
      origin: versionOrigin(v.origin),
      current: v.number === current
    }))
  }

  restore (row: VersionRow) {
    const item = this.item
    if (!item) return
    return this.act(() => restoreVersion(item.id, row.number))
  }

  /** Re-slice on one printer: Slice on that printer, with this print. */
  reslice (row: TargetRow) {
    const item = this.item
    if (!item) return
    this.$router.push({ path: printerPath(row.slug, 'slice'), query: { library: item.id } }).catch(() => {})
  }

  async removeHere () {
    const item = this.item
    if (!item) return
    await this.remove(item)
    if (!libraryState.items[item.id]) this.$router.push(this.libraryTo).catch(() => {})
  }
}
