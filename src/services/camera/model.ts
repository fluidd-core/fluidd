/** What the Live line over the picture says about the print. */
export interface LiveJob {
  printing: boolean;
  paused: boolean;
  name: string;
  /** 0 to 100. */
  progress: number;
  layer: number | null;
  layers: number | null;
  /** "14m left", or null when it isn't known. */
  left: string | null;
}

/** "NGMI stamp · 42% · layer 84 of 200 · 14m left"; paused says so; idle says nothing. */
export function liveFacts (job: LiveJob): string {
  if (!job.printing && !job.paused) return ''
  const parts = [job.name || 'Printing', `${Math.floor(job.progress)}%`]
  if (job.layer && job.layers) parts.push(`layer ${job.layer} of ${job.layers}`)
  if (job.paused) parts.push('paused')
  else if (job.left) parts.push(job.left)
  return parts.join(' · ')
}

/** The camera an address names, else the first, or null when there are none. */
export function cameraFor<T extends { uid: string }> (cameras: T[], id: string | undefined): T | null {
  if (id) {
    const named = cameras.find(c => c.uid === id || encodeURI(c.uid) === id)
    if (named) return named
  }
  return cameras[0] ?? null
}

/** A snapshot's file name: printer, camera and when, "boxwood-front-2026-10-10-0012.jpg". */
export function snapshotName (printer: string, camera: string, at: Date): string {
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'camera'
  const two = (n: number) => String(n).padStart(2, '0')
  const when = `${at.getFullYear()}-${two(at.getMonth() + 1)}-${two(at.getDate())}-${two(at.getHours())}${two(at.getMinutes())}`
  return `${slug(printer)}-${slug(camera)}-${when}.jpg`
}

export interface SnapshotPlan {
  width: number;
  height: number;
  /** Canvas calls in order: translate to the middle, flip, rotate; then the frame is drawn centred. */
  steps: Array<['translate', number, number] | ['scale', number, number] | ['rotate', number]>;
}

/**
 * How to draw a frame as it is shown. CameraMixin turns the picture with
 * `scaleX(±) scaleY(±) rotate(deg)`, which rotates first, then flips; the
 * canvas does the same, and a quarter turn swaps width and height.
 */
export function snapshotPlan (width: number, height: number, turn: { rotation?: number, flipX?: boolean, flipY?: boolean }): SnapshotPlan {
  const rotation = (((turn.rotation ?? 0) % 360) + 360) % 360
  const quarter = rotation === 90 || rotation === 270
  const w = quarter ? height : width
  const h = quarter ? width : height
  return {
    width: w,
    height: h,
    steps: [
      ['translate', w / 2, h / 2],
      ['scale', turn.flipX ? -1 : 1, turn.flipY ? -1 : 1],
      ['rotate', rotation * Math.PI / 180]
    ]
  }
}
