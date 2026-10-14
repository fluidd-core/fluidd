import type { TileTone } from '@/services/printers-page/model'

/** A systemd service's state, for people. */
export function serviceState (active: string | undefined, sub: string | undefined): { text: string, tone: TileTone } {
  if (active === 'active') return sub === 'running' || !sub ? { text: 'Running', tone: 'ok' } : { text: sub.charAt(0).toUpperCase() + sub.slice(1), tone: 'ok' }
  if (active === 'activating' || active === 'reloading') return { text: 'Starting', tone: 'run' }
  if (active === 'deactivating') return { text: 'Stopping', tone: 'warn' }
  if (active === 'failed') return { text: 'Failed', tone: 'err' }
  if (active === 'inactive') return { text: 'Stopped', tone: 'off' }
  return { text: active || 'Unknown', tone: 'off' }
}

/**
 * The operating system's name, as Fluidd worked it out: some builds put a
 * version where the name goes (that one is left out), and a name starting
 * with # stands for the id.
 */
export function osName (dist: { name?: string, id?: string, release_info?: { version_id?: string } } | undefined): string | null {
  const name = dist?.name
  if (!name || name.startsWith('0.')) return null
  return `${name.startsWith('#') ? dist?.id : name} ${dist?.release_info?.version_id ?? ''}`.trim()
}

/** Each network interface with its addresses, IPv4 first and IPv6 only when there's no IPv4. */
export function networkLines (network: Record<string, { ip_addresses?: Array<{ family?: string, address?: string }> }> | undefined): string[] {
  return Object.entries(network ?? {}).map(([name, entry]) => {
    const all = entry.ip_addresses ?? []
    const v4 = all.filter(a => a.family === 'ipv4')
    const shown = v4.length ? v4 : all.filter(a => a.family === 'ipv6')
    return shown.length ? `${name} · ${shown.map(a => a.address ?? '').join(', ')}` : name
  })
}

/** "520 MHz", "64 MHz", "12 kHz". */
export function frequency (hz: number): string {
  if (hz >= 1e9) return `${(hz / 1e9).toFixed(1)} GHz`
  if (hz >= 1e6) return `${Math.round(hz / 1e6)} MHz`
  if (hz >= 1e3) return `${Math.round(hz / 1e3)} kHz`
  return `${hz} Hz`
}

/** How full the disk is: a share for the bar and a sentence. */
export function diskUse (usage: { total?: number, used?: number, free?: number } | undefined, size: (bytes: number) => string): { share: number, text: string } | null {
  if (!usage?.total) return null
  const used = usage.used ?? usage.total - (usage.free ?? 0)
  const share = Math.min(1, Math.max(0, used / usage.total))
  return { share, text: `${size(used)} of ${size(usage.total)} used · ${size(usage.free ?? usage.total - used)} free` }
}

/** The latest number of a chart series, which the chart store keeps as strings. */
export function latest (points: Array<Record<string, unknown>> | undefined, key: string): number | null {
  const last = points?.[points.length - 1]
  if (!last) return null
  const value = Number(last[key])
  return Number.isFinite(value) ? value : null
}
