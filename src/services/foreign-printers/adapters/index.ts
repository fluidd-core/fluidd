import type { AdapterDeps, ForeignAdapter, ForeignCredentials, ForeignPrinterRecord } from '../types'
import { defaultAdapterDeps } from './base'
import MoonrakerAdapter from './moonraker'
import OctoPrintAdapter from './octoprint'
import CrealityAdapter from './creality'
import ElegooCentauriAdapter from './elegoo-cc'

export function createAdapter (
  record: ForeignPrinterRecord,
  creds: ForeignCredentials | null,
  deps: AdapterDeps = defaultAdapterDeps()
): ForeignAdapter {
  switch (record.kind) {
    case 'moonraker': return new MoonrakerAdapter(record, creds, deps)
    case 'octoprint': return new OctoPrintAdapter(record, creds, deps)
    case 'creality': return new CrealityAdapter(record, deps)
    case 'elegoo-cc': return new ElegooCentauriAdapter(record, deps)
    default: throw new Error(`${record.kind} requires an M1 bridge`)
  }
}
