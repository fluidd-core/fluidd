import type { ForeignKind, FormFactor } from './types'

export interface ForeignBrand {
  kind: ForeignKind
  label: string
  formFactor: FormFactor
  model?: string
  via: 'direct' | 'm1'
  steps: string[]
  docs?: string
}

export const FOREIGN_BRANDS: ForeignBrand[] = [
  {
    kind: 'moonraker',
    label: 'Klipper (Moonraker)',
    formFactor: 'bed-slinger',
    via: 'direct',
    steps: ['Enable browser access in Moonraker’s authorization settings.']
  },
  {
    kind: 'octoprint',
    label: 'OctoPrint',
    formFactor: 'bed-slinger',
    via: 'direct',
    steps: ['In Settings > API, enable Allow Cross Origin Resource Sharing, then restart OctoPrint.']
  },
  {
    kind: 'creality',
    label: 'Creality (stock firmware)',
    formFactor: 'open-frame',
    via: 'direct',
    steps: ['Connect the printer and this browser to the same local network.']
  },
  {
    kind: 'elegoo-cc',
    label: 'Elegoo Centauri Carbon',
    formFactor: 'enclosed',
    model: 'Centauri Carbon',
    via: 'direct',
    steps: ['Connect the printer and this browser to the same local network.']
  },
  {
    kind: 'bambu',
    label: 'Bambu Lab',
    formFactor: 'enclosed',
    via: 'm1',
    steps: ['Enable LAN Only mode on the printer.', 'Enable Developer Mode and LAN mode liveview if desired.', 'Connect it through an M1 bridge.'],
    docs: 'https://wiki.bambulab.com/en/knowledge-sharing/enable-lan-mode'
  },
  {
    kind: 'prusalink',
    label: 'Prusa (PrusaLink)',
    formFactor: 'bed-slinger',
    via: 'm1',
    steps: ['Enable and configure PrusaLink on the printer.', 'Connect it through an M1 bridge.'],
    docs: 'https://help.prusa3d.com/article/prusa-connect-and-prusalink-explained_302608?product=prusa-connect'
  },
  {
    kind: 'anycubic',
    label: 'Anycubic',
    formFactor: 'bed-slinger',
    via: 'm1',
    steps: ['Bind the printer to your local network using its setup guide.', 'Connect it through an M1 bridge.'],
    docs: 'https://wiki.anycubic.com/en/fdm-3d-printer/kobra-3-combo/network-connection-guide'
  }
]

export const foreignBrand = (kind: ForeignKind) => FOREIGN_BRANDS.find(brand => brand.kind === kind)!
