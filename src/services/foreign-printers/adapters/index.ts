import type { AdapterDeps, DirectKind, ForeignAdapter, ForeignCapabilities, ForeignCredentials, ForeignPrinterRecord } from '../types'
import { defaultAdapterDeps } from './base'
import MoonrakerAdapter, { MOONRAKER_CAPABILITIES } from './moonraker'
import OctoPrintAdapter, { OCTOPRINT_CAPABILITIES } from './octoprint'
import CrealityAdapter, { CREALITY_CAPABILITIES } from './creality'
import ElegooCentauriAdapter, { ELEGOO_CC_CAPABILITIES } from './elegoo-cc'

export function capabilitiesFor (kind: DirectKind): ForeignCapabilities {
  switch (kind) {
    case 'moonraker': return MOONRAKER_CAPABILITIES
    case 'octoprint': return OCTOPRINT_CAPABILITIES
    case 'creality': return CREALITY_CAPABILITIES
    case 'elegoo-cc': return ELEGOO_CC_CAPABILITIES
  }
}

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
