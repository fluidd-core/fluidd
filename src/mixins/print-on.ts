import { Component, Mixins, Prop, Watch } from 'vue-property-decorator'
import { printerPath } from '@/services/printer-pages'
import { describeLibraryError } from '@/services/library/api'
import { sendToPrinter, type SendMode } from '@/services/library/print-on'
import type { TargetRow } from '@/services/library/print-targets'
import PrinterRowsMixin from './printer-rows'

/**
 * What Print on… does, apart from how it looks: the account's printers as
 * rows to choose from (printer-rows.ts), the one chosen, the plate check
 * for Print now, and Print now, Add to queue, Save to the printer (all
 * print-on.ts) or Re-slice (Slice on that printer, with the print).
 */
@Component
export default class PrintOnMixin extends Mixins(PrinterRowsMixin) {
  /** The printer to choose first, when it fits (a print's page's "Print on Boxwood"). */
  @Prop({ type: String, default: null })
  readonly prefer!: string | null

  chosen: string | null = null
  plateClear = false
  sending = false
  step = ''
  error = ''

  @Watch('item')
  onItem () {
    this.error = ''
    this.step = ''
    this.plateClear = false
    this.chosen = null
  }

  /** The chosen row; at first the preferred printer, else the one Fluidd is on, else the first that can take it. */
  get chosenRow (): TargetRow | null {
    const can = (row: TargetRow) => row.action === 'print' || row.action === 'queue'
    const picked = this.rows.find(row => row.id === this.chosen)
    if (picked) return picked
    return this.rows.find(row => row.id === this.prefer && can(row)) ??
      this.rows.find(row => row.active && can(row)) ??
      this.rows.find(can) ??
      null
  }

  choose (row: TargetRow) {
    if (this.sending || (row.action !== 'print' && row.action !== 'queue')) return
    if (row.id !== this.chosen) this.plateClear = false
    this.chosen = row.id
  }

  /** Print now needs the plate check; a queued print starts once the plate is cleared anyway. */
  get asksPlate (): boolean {
    return this.chosenRow?.action === 'print'
  }

  get canGo (): boolean {
    const row = this.chosenRow
    if (!row || this.sending) return false
    return row.action === 'queue' || (row.action === 'print' && this.plateClear)
  }

  close () {
    if (this.sending) return
    this.$emit('close')
  }

  go (mode: SendMode) {
    const row = this.chosenRow
    if (!row || (mode !== 'save' && !this.canGo)) return
    return this.send(row, mode === 'save' ? 'save' : row.action === 'queue' ? 'queue' : 'print')
  }

  async send (row: TargetRow, mode: SendMode) {
    const item = this.item
    if (!item || row.fit.kind !== 'ready' || this.sending) return
    this.sending = true
    this.error = ''
    try {
      await sendToPrinter({
        router: this.$router,
        store: this.$store,
        item,
        setup: row.fit.setup,
        target: row,
        mode,
        model: this.modelOf(row.id),
        step: (text) => { this.step = text }
      })
      this.$emit('close')
    } catch (error) {
      this.error = describeLibraryError(error)
    } finally {
      this.sending = false
      this.step = ''
    }
  }

  reslice (row: TargetRow) {
    const item = this.item
    if (!item) return
    this.$emit('close')
    this.$router.push({ path: printerPath(row.slug, 'slice'), query: { library: item.id } }).catch(() => {})
  }
}
