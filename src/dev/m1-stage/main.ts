import { accessoriesFrom, type PromptFacts } from '@/services/m1-3d/accessories'
import { LiveSync } from '@/services/m1-3d/live-sync'
import { createViewer } from '@/services/m1-3d/viewer'
import type { Toolpath } from '@/services/m1-3d/toolpath'

const steps = [
  'plate-off-print',
  'plate-on-print',
  'plate-off-empty',
  'plate-on-empty',
  'tube-unlock',
  'tube-detach',
  'tube-attach',
  'filament-load',
  'autoload-grabbed',
  'autoload-done',
  'filament-unload'
]

const printer: Record<string, any> = {
  bed_removal_detector: { bedRemoved: false, restoreTarget: 0 },
  'mcu toolhead': { non_critical_disconnected: false, mcu_version: 'v0.12.0' },
  'gcode_button toolhead_umbilical_unlock_button': { state: 'RELEASED' },
  'filament_switch_sensor filament_sensor_toolhead': { filament_detected: false, enabled: true }
}
let prompt: PromptFacts = { open: false }

function printPath (): Toolpath {
  const rings = 40
  const positions = new Float32Array(rings * 4 * 6)
  const ends = new Float64Array(rings * 4)
  const ring = [[80, 70], [120, 70], [120, 110], [80, 110], [80, 70]]
  let segment = 0
  for (let layer = 0; layer < rings; layer++) {
    const z = (layer + 1) * 0.3
    for (let edge = 0; edge < 4; edge++) {
      const from = ring[edge]
      const to = ring[edge + 1]
      positions.set([from[0], from[1], z, to[0], to[1], z], segment * 6)
      ends[segment] = segment + 1
      segment++
    }
  }
  return { positions, ends, count: segment }
}

const canvas = document.querySelector('canvas.m1-live__canvas') as HTMLCanvasElement
const viewer = createViewer(canvas)
const sync = new LiveSync()
sync.setPose({ x: 100, y: 90, z: 40, led: true, progress: 0 })
sync.setAccessories(accessoriesFrom(printer, prompt), performance.now(), true)
if (new URLSearchParams(location.search).get('reduced') === '1') sync.accessories.reducedMotion = true
viewer.follow(sync)
const path = printPath()
viewer.setPrint(path, 0xc00a66)
sync.setFileDone(path.count)

let resolveReady!: () => void
const ready = new Promise<void>(resolve => { resolveReady = resolve })
viewer.onFrame = () => {
  viewer.onFrame = null
  resolveReady()
}

function step (name: string): void {
  switch (name) {
    case 'plate-off-print':
      printer.bed_removal_detector.bedRemoved = true
      break
    case 'plate-on-print':
      printer.bed_removal_detector.bedRemoved = false
      break
    case 'plate-off-empty':
      printer.bed_removal_detector.bedRemoved = true
      break
    case 'plate-on-empty':
      printer.bed_removal_detector.bedRemoved = false
      break
    case 'tube-unlock':
      printer['gcode_button toolhead_umbilical_unlock_button'].state = 'PRESSED'
      break
    case 'tube-detach':
      printer['mcu toolhead'].non_critical_disconnected = true
      break
    case 'tube-attach':
      printer['mcu toolhead'].non_critical_disconnected = false
      printer['gcode_button toolhead_umbilical_unlock_button'].state = 'RELEASED'
      break
    case 'filament-load':
      printer['filament_switch_sensor filament_sensor_toolhead'].filament_detected = true
      prompt = { open: true, title: 'Filament Load' }
      break
    case 'autoload-grabbed':
      prompt = { open: true, title: 'Load Mode' }
      break
    case 'autoload-done':
      prompt = { open: false }
      break
    case 'filament-unload':
      printer['filament_switch_sensor filament_sensor_toolhead'].filament_detected = false
      break
    default:
      throw new Error(`Unknown M1 stage step: ${name}`)
  }
  sync.setAccessories(accessoriesFrom(printer, prompt), performance.now(), true)
  viewer.wake()
}

declare global {
  interface Window {
    m1Stage: {
      ready: Promise<void>;
      step: (name: string) => void;
      steps: string[];
      sync: LiveSync;
    };
  }
}

window.m1Stage = { ready, step, steps, sync }
