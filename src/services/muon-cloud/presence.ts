import type { CloudPrinter } from './api'

export type CloudPresence = 'online' | 'reconnecting' | 'offline'

/** The console timestamps last_seen in seconds, not browser milliseconds. */
export function consolePresence (printer: Pick<CloudPrinter, 'online' | 'last_seen'>, now = Date.now()): CloudPresence {
  if (printer.online) return 'online'
  return Number.isFinite(printer.last_seen) && printer.last_seen > 0 && now - printer.last_seen * 1000 < 120_000
    ? 'reconnecting'
    : 'offline'
}
