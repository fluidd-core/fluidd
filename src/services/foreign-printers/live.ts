import Vue from 'vue'
import { createAdapter } from './adapters'
import { foreignRegistry, setForeignRecords } from './registry'
import { forgetForeign, getCredentials, listForeign } from './store'
import type { ForeignAdapter, ForeignPrinterRecord, ForeignStatus } from './types'

const emptyStatus = (): ForeignStatus => ({
  state: 'connecting',
  message: null,
  file: null,
  progress: null,
  timeLeft: null,
  temps: [],
  cameraUrl: null
})

const demoRecords: ForeignPrinterRecord[] = [
  {
    id: 'demo-voron',
    kind: 'moonraker',
    name: 'Workshop Voron',
    model: 'Voron 2.4',
    host: '192.168.1.25',
    via: 'direct',
    formFactor: 'open-frame',
    credentialsRef: null,
    addedAt: 0
  },
  {
    id: 'demo-octoprint',
    kind: 'octoprint',
    name: 'Garden Printer',
    model: 'Ender 3',
    host: '192.168.1.26',
    via: 'direct',
    formFactor: 'bed-slinger',
    credentialsRef: null,
    addedAt: 0
  },
  {
    id: 'demo-bambu',
    kind: 'bambu',
    name: 'Studio X1',
    model: 'X1 Carbon',
    host: '192.168.1.27',
    via: 'm1',
    m1Name: 'Muon M1',
    formFactor: 'enclosed',
    credentialsRef: null,
    addedAt: 0
  }
]

const demoStatuses: Record<string, ForeignStatus> = {
  'demo-voron': {
    state: 'printing',
    message: 'Printing',
    file: 'bracket.gcode',
    progress: 0.62,
    timeLeft: 1800,
    temps: [{ id: 'nozzle', actual: 214, target: 215 }, { id: 'bed', actual: 59, target: 60 }],
    cameraUrl: 'http://192.168.1.25/webcam/?action=stream'
  },
  'demo-octoprint': {
    state: 'idle',
    message: 'Operational',
    file: null,
    progress: null,
    timeLeft: null,
    temps: [{ id: 'nozzle', actual: 24, target: 0 }, { id: 'bed', actual: 23, target: 0 }],
    cameraUrl: null
  },
  'demo-bambu': {
    state: 'offline',
    message: 'Needs an M1 bridge',
    file: null,
    progress: null,
    timeLeft: null,
    temps: [],
    cameraUrl: null
  }
}

export const liveForeign = Vue.observable({
  records: foreignRegistry.records as ForeignPrinterRecord[],
  status: {} as Record<string, ForeignStatus>
})

const adapters = new Map<string, ForeignAdapter>()
let loaded = false
let demo = false

function useRecords (records: ForeignPrinterRecord[]) {
  setForeignRecords(records)
  liveForeign.records = foreignRegistry.records
}

export async function loadForeign (): Promise<void> {
  if (loaded) return
  loaded = true
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('foreignDemo') === '1') {
    demo = true
    useRecords(demoRecords)
    Object.keys(demoStatuses).forEach(id => Vue.set(liveForeign.status, id, demoStatuses[id]))
    return
  }
  useRecords(await listForeign())
  for (const record of liveForeign.records) {
    if (record.via === 'm1') {
      Vue.set(liveForeign.status, record.id, { ...emptyStatus(), state: 'offline', message: 'Needs an M1 bridge' })
    } else {
      Vue.set(liveForeign.status, record.id, emptyStatus())
    }
  }
}

export async function refreshForeign (): Promise<void> {
  if (demo) return
  loaded = true
  const records = await listForeign()
  const known = new Set(records.map(record => record.id))
  Object.keys(liveForeign.status).filter(id => !known.has(id)).forEach(id => Vue.delete(liveForeign.status, id))
  useRecords(records)
  for (const record of records) {
    if (liveForeign.status[record.id]) continue
    Vue.set(liveForeign.status, record.id, record.via === 'm1'
      ? { ...emptyStatus(), state: 'offline', message: 'Needs an M1 bridge' }
      : emptyStatus())
  }
}

export async function connectAll (): Promise<void> {
  await loadForeign()
  if (demo) return
  await Promise.all(liveForeign.records.map(async record => {
    if (record.via !== 'direct' || adapters.has(record.id)) return
    const credentials = await getCredentials(record.credentialsRef)
    const adapter = createAdapter(record, credentials)
    adapters.set(record.id, adapter)
    let persistedSerial = record.serial
    adapter.onStatus(status => {
      Vue.set(liveForeign.status, record.id, status)
      if (record.serial && record.serial !== persistedSerial) {
        persistedSerial = record.serial
        import('./store')
          .then(({ updateForeign }) => updateForeign(record.id, { serial: record.serial }))
          .catch(() => {})
      }
    })
    await adapter.connect().catch(() => {
      Vue.set(liveForeign.status, record.id, { ...liveForeign.status[record.id], state: 'offline' })
    })
  }))
}

export function adapterFor (id: string): ForeignAdapter | undefined {
  return adapters.get(id)
}

export async function forget (id: string): Promise<void> {
  adapters.get(id)?.close()
  adapters.delete(id)
  if (!demo) await forgetForeign(id)
  const index = liveForeign.records.findIndex(item => item.id === id)
  if (index >= 0) liveForeign.records.splice(index, 1)
  const registryIndex = foreignRegistry.records.findIndex(item => item.id === id)
  if (registryIndex >= 0) foreignRegistry.records.splice(registryIndex, 1)
  Vue.delete(liveForeign.status, id)
}

export function isForeignDemo (): boolean {
  return demo
}
