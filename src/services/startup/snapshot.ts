/**
 * What the printers page and the active printer last showed, kept in
 * localStorage (KAN-525). While the socket connects, the loader draws it in
 * plain DOM — before Vue mounts — so a load isn't a wait on a blank screen.
 * Names are the person's own data: everything renders through textContent,
 * never innerHTML.
 */

import { slugForCloudPrinter, slugForInstance } from '@/services/printer-pages'
import type { DirectoryEntry } from '@/services/muon-cloud/directory'

export const SNAPSHOT_KEY = 'muon3d.lastSeen'
const MAX_PRINTERS = 50
const MAX_STRING = 120

export interface SnapshotPrinter {
  name: string;
  slug: string | null;
  state: string;
  label: string;
  detail: string;
}

export interface SnapshotStatus {
  name: string;
  state: string;
  label: string;
  file: string | null;
  progress: number | null;
  nozzle: number | null;
  bed: number | null;
  savedAt: number;
}

export interface Snapshot {
  v: 1;
  savedAt: number;
  printers: SnapshotPrinter[];
  status: Record<string, SnapshotStatus>;
}

const trunc = (s: unknown): string => String(s ?? '').slice(0, MAX_STRING)
const empty = (): Snapshot => ({ v: 1, savedAt: 0, printers: [], status: {} })

export function readSnapshot (): Snapshot | null {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Snapshot
    if (s?.v !== 1 || !Array.isArray(s.printers) || typeof s.status !== 'object' || s.status === null) return null
    return s
  } catch {
    return null
  }
}

const write = (s: Snapshot): void => {
  try {
    s.savedAt = Date.now()
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(s))
  } catch {}
}

/** The slug a tile's entry opens under, when one is known (a found printer may have none). */
export const slugForEntry = (e: DirectoryEntry): string | null => {
  if (e.cloud) return slugForCloudPrinter(e.cloud)
  const saved = e.saved?.[0]
  return saved ? slugForInstance(saved) : null
}

/** What one tile keeps for next time's load. */
export const snapshotPrinter = (tile: { name: string; state: string; label: string; detail: string; entry: DirectoryEntry }): SnapshotPrinter => ({
  name: trunc(tile.name),
  slug: slugForEntry(tile.entry),
  state: trunc(tile.state),
  label: trunc(tile.label),
  detail: trunc(tile.detail)
})

export function saveSnapshotPrinters (printers: SnapshotPrinter[]): void {
  const s = readSnapshot() ?? empty()
  s.printers = printers.slice(0, MAX_PRINTERS)
  write(s)
}

export function saveSnapshotStatus (slug: string, status: Omit<SnapshotStatus, 'savedAt'>): void {
  if (!slug) return
  const s = readSnapshot() ?? empty()
  s.status = {
    ...s.status,
    [slug]: {
      name: trunc(status.name),
      state: trunc(status.state),
      label: trunc(status.label),
      file: status.file == null ? null : trunc(status.file),
      progress: typeof status.progress === 'number' ? status.progress : null,
      nozzle: typeof status.nozzle === 'number' ? status.nozzle : null,
      bed: typeof status.bed === 'number' ? status.bed : null,
      savedAt: Date.now()
    }
  }
  write(s)
}

// -- drawing (plain DOM; the app isn't up yet) ------------------------------

const el = (doc: Document, tag: string, cls: string, text?: string): HTMLElement => {
  const e = doc.createElement(tag)
  e.className = cls
  if (text != null) e.textContent = text
  return e
}

const connectingBar = (doc: Document): HTMLElement => {
  const bar = el(doc, 'div', 'muon-loader__connecting')
  bar.appendChild(el(doc, 'span', 'muon-loader__connecting-text', 'Connecting…'))
  bar.appendChild(el(doc, 'i', 'muon-loader__connecting-line'))
  return bar
}

const printerRow = (doc: Document, p: SnapshotPrinter): HTMLElement => {
  const row = el(doc, 'div', 'muon-loader__printer')
  row.appendChild(el(doc, 'span', 'muon-loader__printer-name', p.name))
  row.appendChild(el(doc, 'span', `muon-loader__pill muon-loader__pill--${p.state}`, p.label))
  if (p.detail) row.appendChild(el(doc, 'span', 'muon-loader__printer-detail', p.detail))
  return row
}

const drawStatus = (doc: Document, slot: HTMLElement, slug: string, st: SnapshotStatus): void => {
  const box = el(doc, 'div', 'muon-loader__status')
  const head = el(doc, 'div', 'muon-loader__printer')
  head.appendChild(el(doc, 'span', 'muon-loader__printer-name', st.name))
  head.appendChild(el(doc, 'span', `muon-loader__pill muon-loader__pill--${st.state}`, st.label))
  box.appendChild(head)
  if (st.file) box.appendChild(el(doc, 'div', 'muon-loader__status-file', st.file))
  if (st.progress != null) {
    const track = el(doc, 'div', 'muon-loader__progress')
    const fill = el(doc, 'div', 'muon-loader__progress-fill')
    fill.style.width = `${Math.max(0, Math.min(100, st.progress))}%`
    track.appendChild(fill)
    box.appendChild(track)
  }
  const temps = [
    st.nozzle != null ? `Nozzle ${st.nozzle}°C` : null,
    st.bed != null ? `Bed ${st.bed}°C` : null
  ].filter(Boolean).join(' · ')
  if (temps) box.appendChild(el(doc, 'div', 'muon-loader__status-temps', temps))
  const when = new Date(st.savedAt).toLocaleTimeString()
  box.appendChild(el(doc, 'div', 'muon-loader__status-when', `${slug} · as of ${when}`))
  slot.appendChild(box)
}

/**
 * Draws the last-known state into the loader's cached slot. Returns whether
 * anything was drawn — nothing for /setup, /sign-in, an unknown slug or no
 * snapshot, where the loader keeps its wordmark.
 */
export function renderCachedState (slot: HTMLElement, snap: Snapshot | null, pathname: string): boolean {
  if (!snap || /^\/(?:setup|sign-in)(?:\/|$)/.test(pathname)) return false

  if (pathname === '/') {
    const printers = snap.printers.slice(0, 12)
    if (!printers.length) return false
    const box = el(slot.ownerDocument, 'div', 'muon-loader__printers')
    for (const p of printers) box.appendChild(printerRow(slot.ownerDocument, p))
    slot.appendChild(box)
  } else {
    const slug = pathname.split('/')[1]
    const st = slug ? snap.status[slug] : undefined
    if (!st) return false
    drawStatus(slot.ownerDocument, slot, slug, st)
  }

  slot.setAttribute('aria-busy', 'true')
  slot.appendChild(connectingBar(slot.ownerDocument))
  slot.classList.add('muon-stale')
  return true
}
