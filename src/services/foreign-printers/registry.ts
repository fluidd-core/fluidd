import Vue from 'vue'
import type { ForeignPrinterRecord } from './types'
import { slugForAddress } from '@/services/printer-pages/slug'

export const foreignRegistry = Vue.observable({
  records: [] as ForeignPrinterRecord[]
})

export function setForeignRecords (records: ForeignPrinterRecord[]) {
  foreignRegistry.records.splice(0, foreignRegistry.records.length, ...records)
}

export function foreignSlug (record: ForeignPrinterRecord): string {
  return slugForAddress(record.name, `http://${record.host}`)
}
