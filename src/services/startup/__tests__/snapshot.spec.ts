import { describe, expect, it } from 'vitest'
import {
  readSnapshot,
  renderCachedState,
  saveSnapshotPrinters,
  saveSnapshotStatus,
  SNAPSHOT_KEY,
  type Snapshot
} from '../snapshot'

const status = {
  name: 'Boxwood · 367A',
  state: 'printing',
  label: '42%',
  file: 'benchy.gcode',
  progress: 42,
  nozzle: 210,
  bed: 60
}

const snap = (extra: Partial<Snapshot> = {}): Snapshot => ({
  v: 1,
  savedAt: Date.now(),
  printers: [{ name: 'Boxwood', slug: 'boxwood-367a', state: 'ready', label: 'Ready', detail: 'On this network' }],
  status: { 'boxwood-367a': { ...status, savedAt: Date.now() } },
  ...extra
})

const slot = () => {
  const el = document.createElement('div')
  el.className = 'muon-loader__cached'
  return el
}

describe('readSnapshot', () => {
  it('reads what was saved', () => {
    saveSnapshotStatus('boxwood-367a', status)
    const s = readSnapshot()
    expect(s?.status['boxwood-367a'].name).toBe('Boxwood · 367A')
    expect(s?.status['boxwood-367a'].progress).toBe(42)
  })

  it('ignores garbage, the wrong version and nothing saved', () => {
    localStorage.setItem(SNAPSHOT_KEY, 'not json')
    expect(readSnapshot()).toBeNull()
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify({ v: 2, printers: [], status: {} }))
    expect(readSnapshot()).toBeNull()
    localStorage.removeItem(SNAPSHOT_KEY)
    expect(readSnapshot()).toBeNull()
  })

  it('truncates strings and keeps at most 50 printers', () => {
    saveSnapshotStatus('a-1234', { ...status, name: 'x'.repeat(300) })
    saveSnapshotPrinters(Array.from({ length: 60 }, (_, i) => ({ name: `p${i}`, slug: null, state: 'ready', label: 'Ready', detail: '' })))
    const s = readSnapshot()
    expect(s?.status['a-1234'].name).toHaveLength(120)
    expect(s?.printers).toHaveLength(50)
  })
})

describe('renderCachedState', () => {
  it('draws the printers list and a Connecting bar at /', () => {
    const el = slot()
    expect(renderCachedState(el, snap(), '/')).toBe(true)
    expect(el.querySelectorAll('.muon-loader__printer')).toHaveLength(1)
    expect(el.querySelector('.muon-loader__printer-name')?.textContent).toBe('Boxwood')
    expect(el.querySelector('.muon-loader__pill')?.textContent).toBe('Ready')
    expect(el.querySelector('.muon-loader__connecting')).not.toBeNull()
    expect(el.getAttribute('aria-busy')).toBe('true')
  })

  it('draws the printer status at /<slug>', () => {
    const el = slot()
    expect(renderCachedState(el, snap(), '/boxwood-367a/jobs')).toBe(true)
    expect(el.querySelector('.muon-loader__status-file')?.textContent).toBe('benchy.gcode')
    expect(el.querySelector('.muon-loader__status-temps')?.textContent).toContain('210')
    expect(el.querySelector('.muon-loader__status-when')?.textContent).toContain('as of')
  })

  it('draws nothing without a snapshot, for an unknown slug or on /setup and /sign-in', () => {
    const a = slot()
    expect(renderCachedState(a, null, '/')).toBe(false)
    expect(a.children).toHaveLength(0)
    const b = slot()
    expect(renderCachedState(b, snap(), '/other-0000')).toBe(false)
    expect(b.children).toHaveLength(0)
    for (const path of ['/setup', '/sign-in']) {
      const el = slot()
      expect(renderCachedState(el, snap(), path)).toBe(false)
      expect(el.children).toHaveLength(0)
    }
  })

  it('renders names as text, never markup', () => {
    const evil = '<img src=x onerror=alert(1)>'
    const s = snap({ printers: [{ name: evil, slug: null, state: 'ready', label: 'Ready', detail: '' }] })
    const el = slot()
    renderCachedState(el, s, '/')
    expect(el.querySelector('img')).toBeNull()
    expect(el.querySelector('.muon-loader__printer-name')?.textContent).toBe(evil)
  })
})
