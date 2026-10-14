import { THREE, m1, type M1Root } from './load'
import { placeModel, type Calibration } from './pose'
import type { Toolpath } from './toolpath'
import type { LiveSync } from './live-sync'
import { middleHeight, stripsLit, tapColour, tapKey, type LedStrip, type PlateTap, type ScreenState } from './live-state'
import { Y_TOWARD_FRONT } from '@/services/machine/orientation'

/**
 * The live M1 on a stage: the photoreal model, lit as its product shots
 * are, in front of the stage's own backdrop. It follows its printer through
 * a LiveSync (live-sync.ts), drawing up to 30 times a second while anything
 * moves and not at all while nothing does, so an idle printer costs nothing.
 * A mouse drag turns it; touch is left to the page, so a phone still
 * scrolls past it.
 *
 * The lighting and the studio environment follow the model's own viewer
 * (m1-model/src/04-viewer.js), which measured them against the photographs.
 */
export interface M1Viewer {
  /** The printer to follow: where its head is, its print, the lines no file drew. */
  follow: (sync: LiveSync) => void;
  /** Something changed that the sync will show: draw. */
  wake: () => void;
  /** The print to draw under the plate, in the printer's millimetres, or null for none; its colour is also the loose lines'. */
  setPrint: (path: Toolpath | null, colour: number) => void;
  /** What the base's round screen shows. */
  setScreen: (screen: ScreenState) => void;
  /** The LED strips (Klipper's color_data for `neopixel Left` and `neopixel Right`), or nulls to go by the light alone. */
  setLeds: (left: LedStrip, right: LedStrip) => void;
  /** The touches of the plate to mark; a new one pulses. */
  setTaps: (taps: PlateTap[]) => void;
  /** Draws while shown; stops drawing while scrolled away or hidden. */
  setActive: (active: boolean) => void;
  /** Reads the stage's colours again, after the theme changes. */
  restyle: () => void;
  /** Moves the machine left by this share of the stage's width, to clear something on the right. */
  setShift: (share: number) => void;
  /** Called after each frame drawn; the first means it can be shown. */
  onFrame: (() => void) | null;
  dispose: () => void;
}

/** Seen from the mast side and a little above, as the s1_1 product shot is. */
const VIEW = { theta: -0.366, phi: 1.033 }
/** From well above down to a little under the plate, where the print hangs. */
const PHI_RANGE = [0.72, 1.62]
/** Following the printer, a frame at most this often (30 a second); a turn by hand draws every frame. */
const FRAME_MS = 1000 / 30
/** A new mark on the plate swells and settles over this long. */
const PULSE_MS = 900
/** The most marks on the plate at once. */
const MAX_TAPS = 256

/** The share of the stage the machine fills, edge to edge. */
const FILL = 0.86

/** The studio the model is lit by: a soft sky, a grey horizon and a darker floor, with softboxes. */
function studioEnv (renderer: THREE.WebGLRenderer): THREE.Texture {
  const W = 1024
  const H = 512
  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const x = c.getContext('2d') as CanvasRenderingContext2D
  const sky = 0.86
  const floor = 1.30
  const lift = (hex: string, w: number) => {
    const n = parseInt(hex.slice(1), 16)
    const k = (v: number) => Math.round(Math.min(255, Math.max(0, v * w)))
    return `rgb(${k(n >> 16 & 255)},${k(n >> 8 & 255)},${k(n & 255)})`
  }
  const g = x.createLinearGradient(0, 0, 0, H)
  const stops: Array<[number, string, number]> = [
    [0.00, '#ffffff', sky], [0.20, '#fcfbf9', sky], [0.245, '#f8f7f4', sky], [0.255, '#c4c3be', sky],
    [0.40, '#9e9d99', floor], [0.46, '#7d7c77', floor], [0.54, '#6a6964', floor], [0.62, '#8a8985', floor],
    [0.72, '#aba9a5', floor], [0.86, '#bfbdb9', floor], [1.00, '#c7c5c1', floor]
  ]
  for (const [at, hex, w] of stops) g.addColorStop(at, lift(hex, w))
  x.fillStyle = g
  x.fillRect(0, 0, W, H)

  const softbox = (cx: number, cy: number, w: number, h: number, level: number, tint?: string) => {
    if (cy < H * 0.45 && !tint) level *= sky
    const r = Math.max(w, h) / 2
    const grad = x.createRadialGradient(cx, cy, 0, cx, cy, r)
    grad.addColorStop(0, tint ?? `rgba(255,255,255,${level})`)
    grad.addColorStop(0.55, `rgba(255,255,255,${level * 0.55})`)
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    x.fillStyle = grad
    x.save()
    x.translate(cx, cy)
    x.scale(w / (2 * r), h / (2 * r))
    x.beginPath()
    x.arc(0, 0, r, 0, Math.PI * 2)
    x.fill()
    x.restore()
  }
  softbox(W * 0.24, H * 0.17, 440, 280, 1.0)
  softbox(W * 0.24, H * 0.15, 190, 120, 1.0)
  softbox(W * 0.72, H * 0.28, 500, 320, 0.66)
  softbox(W * 0.72, H * 0.25, 170, 110, 0.9)
  softbox(W * 0.96, H * 0.13, 180, 120, 0.95)
  softbox(W * 0.02, H * 0.13, 180, 120, 0.95)
  softbox(W * 0.50, H * 0.40, 380, 150, 0.26, 'rgba(244,242,238,0.55)')
  softbox(W * 0.50, H * 0.02, 900, 180, 0.7)

  const texture = new THREE.CanvasTexture(c)
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.colorSpace = THREE.SRGBColorSpace
  const pmrem = new THREE.PMREMGenerator(renderer)
  pmrem.compileEquirectangularShader()
  const env = pmrem.fromEquirectangular(texture).texture
  pmrem.dispose()
  texture.dispose()
  return env
}

/**
 * The box round what is drawn. Box3.setFromObject counts hidden parts too
 * (the spool, the print), and a part is hidden when any group above it is,
 * so each mesh's whole chain is checked.
 */
function shownBox (root: THREE.Object3D): THREE.Box3 {
  root.updateMatrixWorld(true)
  const box = new THREE.Box3()
  const part = new THREE.Box3()
  root.traverse(o => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry) return
    for (let p: THREE.Object3D | null = mesh; p && p !== root.parent; p = p.parent) if (!p.visible) return
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    part.copy(mesh.geometry.boundingBox as THREE.Box3).applyMatrix4(mesh.matrixWorld)
    box.union(part)
  })
  return box
}

/** The distance at which the box fills `FILL` of the view, and how far off-centre it then sits. */
function fit (camera: THREE.PerspectiveCamera, box: THREE.Box3, target: THREE.Vector3, dir: THREE.Vector3) {
  const corners = [0, 1, 2, 3, 4, 5, 6, 7].map(i => new THREE.Vector3(
    i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z))
  const extent = (distance: number) => {
    camera.position.copy(target).addScaledVector(dir, distance)
    camera.lookAt(target)
    camera.updateMatrixWorld(true)
    let x0 = Infinity; let x1 = -Infinity; let y0 = Infinity; let y1 = -Infinity
    for (const c of corners) {
      const p = c.clone().project(camera)
      x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y)
    }
    return { x0, x1, y0, y1 }
  }
  let lo = 100
  let hi = 20000
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    const e = extent(mid)
    if (Math.max(e.x1 - e.x0, e.y1 - e.y0) / 2 > FILL) lo = mid
    else hi = mid
  }
  const e = extent(hi)
  return { distance: hi, centre: [(e.x0 + e.x1) / 2, (e.y0 + e.y1) / 2] }
}

/** The stage's colours, middle out, from the theme (muon3d.scss's --m3d-stage-*). */
function stageColours (el: Element): [string, string, string] {
  const style = getComputedStyle(el)
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
  return [read('--m3d-stage-hi', '#eceef0'), read('--m3d-stage-mid', '#d8dbdf'), read('--m3d-stage-lo', '#c4c8cd')]
}

/**
 * The stage's backdrop (PrinterStage's radial gradient, in the theme's
 * colours), drawn into the scene. The glass plate refracts what's behind
 * it, so the scene needs an opaque background to see through; on a
 * transparent one the plate turns milky white.
 */
function stageBackdrop (width: number, height: number, colours: [string, string, string]): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = Math.max(2, Math.round(width / 4))
  c.height = Math.max(2, Math.round(height / 4))
  const x = c.getContext('2d') as CanvasRenderingContext2D
  // radial-gradient(120% 90% at 50% 40%, hi 0%, mid 62%, lo 100%)
  x.translate(c.width * 0.5, c.height * 0.4)
  x.scale(1.2 * c.width, 0.9 * c.height)
  const g = x.createRadialGradient(0, 0, 0, 0, 0, 1)
  g.addColorStop(0, colours[0])
  g.addColorStop(0.62, colours[1])
  g.addColorStop(1, colours[2])
  x.fillStyle = g
  x.fillRect(-1, -1, 2, 2)
  const texture = new THREE.CanvasTexture(c)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * Measures the built model with the head centred and the bed at the bottom:
 * the plate's edges and underside, and the nozzle tip (the highest brass on
 * the head). From these the printer's millimetres place the head and the
 * bed (pose.ts), and the print hangs from the plate in the same
 * millimetres: `printFrame` takes a point (x, y, z) to the bed's own space,
 * x from the plate's left edge, y from the edge orientation.ts names, z down
 * from its underside.
 */
function calibrate (model: M1Root, mats: Record<string, THREE.Material>) {
  const dim = m1().DIM
  Object.assign(model.userData.state, { headX: 0, headZ: 0, z: 0, fold: 0 })
  model.userData.apply()
  model.updateMatrixWorld(true)

  const plate = new THREE.Box3().setFromObject(model.getObjectByName('glassPlate') as THREE.Object3D)
  let tip: THREE.Box3 | null = null
  ;(model.userData.pod as THREE.Object3D).traverse(o => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || mesh.material !== mats.brass) return
    const box = new THREE.Box3().setFromObject(mesh)
    if (!tip || box.max.y > tip.max.y) tip = box
  })
  const tipBox = (tip ?? new THREE.Box3(new THREE.Vector3(), new THREE.Vector3())) as THREE.Box3
  const tipCentre = tipBox.getCenter(new THREE.Vector3())

  const cal: Calibration = {
    plateLeft: plate.min.x,
    plateFront: plate.max.z,
    plateBack: plate.min.z,
    plateUnderside: plate.min.y,
    nozzleX: tipCentre.x,
    nozzleZ: tipCentre.z,
    tipTop: tipBox.max.y,
    travelX: dim.travelX,
    travelZ: dim.travelZ,
    bedTravel: dim.bedTravel
  }

  const bed = (model.getObjectByName('bedLift') as THREE.Object3D).getWorldPosition(new THREE.Vector3())
  // Y from the plate's back edge toward the front (orientation.ts): with Z
  // building down, that keeps the part as it was sliced rather than mirrored.
  const printFrame = new THREE.Matrix4().set(
    1, 0, 0, plate.min.x - bed.x,
    0, 0, -1, plate.min.y - bed.y,
    0, Y_TOWARD_FRONT ? 1 : -1, 0, (Y_TOWARD_FRONT ? plate.min.z : plate.max.z) - bed.z,
    0, 0, 0, 1
  )
  return { cal, printFrame }
}

/** Puts the live M1 on `canvas`. Throws when the browser can't draw WebGL; the stage then keeps its picture. */
export function createViewer (canvas: HTMLCanvasElement): M1Viewer {
  // Marks for the browser's performance timeline: how long the build, the shaders and the first frame take on this device.
  performance.mark('m1:create')
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'default' })
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.06
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap

  const scene = new THREE.Scene()
  const env = studioEnv(renderer)
  scene.environment = env

  const key = new THREE.DirectionalLight(0xffffff, 2.55)
  key.position.set(-520, 780, 640)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  Object.assign(key.shadow.camera, { near: 20, far: 2600, left: -420, right: 420, top: 480, bottom: -180 })
  key.shadow.bias = -0.0006
  key.shadow.normalBias = 1.35
  key.shadow.radius = 5
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xf6f4f1, 0.52)
  fill.position.set(700, 380, 300)
  scene.add(fill)
  const rim = new THREE.DirectionalLight(0xffffff, 0.60)
  rim.position.set(180, 460, -840)
  scene.add(rim)
  scene.add(new THREE.HemisphereLight(0xfffdf9, 0xa8a6a3, 0.20))

  // Only the shadow is drawn on the floor; the backdrop is the floor.
  const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.16 })
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), shadowMaterial)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.4
  ground.receiveShadow = true
  scene.add(ground)

  const mats = m1().buildMaterials()
  const model: M1Root = m1().build(mats)
  scene.add(model)
  // Materials that lean on scene.environment lose their own envMapIntensity; giving each the map keeps it.
  model.traverse(o => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    for (const m of ([] as THREE.Material[]).concat(mesh.material)) {
      const std = m as THREE.MeshStandardMaterial
      if (std && std.envMapIntensity !== undefined && !std.envMap) {
        std.envMap = env
        std.needsUpdate = true
      }
    }
  })
  const state = model.userData.state
  state.showPrint = false
  state.showSpool = false
  const { cal, printFrame } = calibrate(model, mats)
  const bedLift = model.getObjectByName('bedLift') as THREE.Object3D
  model.userData.apply()
  performance.mark('m1:built')

  /** Hangs `object` from the plate, in the printer's millimetres. */
  const onPlate = <T extends THREE.Object3D>(object: T): T => {
    object.matrixAutoUpdate = false
    object.matrix.copy(printFrame)
    object.frustumCulled = false
    bedLift.add(object)
    return object
  }

  // The part, the lines no file drew, and the line being laid now, all in the filament's colour.
  const partMaterial = new THREE.LineBasicMaterial({ color: 0xc00a66 })
  let print: THREE.LineSegments | null = null
  let toolpath: Toolpath | null = null

  const traceGeometry = new THREE.BufferGeometry()
  let traceAttribute: THREE.BufferAttribute | null = null
  onPlate(new THREE.LineSegments(traceGeometry, partMaterial))
  const traceShown = { trace: null as unknown, version: -1, count: 0 }

  const nibPositions = new Float32Array(6)
  const nibGeometry = new THREE.BufferGeometry()
  nibGeometry.setAttribute('position', new THREE.BufferAttribute(nibPositions, 3).setUsage(THREE.DynamicDrawUsage))
  const nib = onPlate(new THREE.LineSegments(nibGeometry, partMaterial))
  nib.visible = false

  // The touches of the plate: a bead each, just under it, where the nozzle met it.
  const tapGeometry = new THREE.SphereGeometry(2.6, 18, 12)
  const tapMaterial = new THREE.MeshBasicMaterial({ toneMapped: false })
  const tapMarks = onPlate(new THREE.InstancedMesh(tapGeometry, tapMaterial, MAX_TAPS))
  tapMarks.count = 0
  let taps: PlateTap[] = []
  const tapSeen = new Map<string, number>()
  const tapMatrix = new THREE.Matrix4()
  const tapColourOf = new THREE.Color()

  const camera = new THREE.PerspectiveCamera(22.4, 1, 2, 8000)
  const box = shownBox(model)
  const target = box.getCenter(new THREE.Vector3())
  const view = { theta: VIEW.theta, phi: VIEW.phi, goalTheta: VIEW.theta, goalPhi: VIEW.phi }
  let distance = 1300
  let centre = [0, 0]
  let shift = 0
  let width = 0
  let height = 0

  const direction = () => new THREE.Vector3(
    Math.sin(view.phi) * Math.sin(view.theta), Math.cos(view.phi), Math.sin(view.phi) * Math.cos(view.theta))

  const frame = () => {
    camera.position.copy(target).addScaledVector(direction(), distance)
    camera.lookAt(target)
    // Centre the machine itself, not its box's middle, then move it left by `shift`.
    const dx = (centre[0] + shift * 2) * width / 2
    const dy = -centre[1] * height / 2
    camera.setViewOffset(width, height, dx, dy, width, height)
  }

  const refit = () => {
    if (!width || !height) return
    camera.aspect = width / height
    camera.clearViewOffset()
    const f = fit(camera, box, target, direction())
    distance = f.distance
    centre = f.centre
  }

  const restyle = () => {
    const colours = stageColours(canvas)
    if (width && height) {
      const old = scene.background as THREE.Texture | null
      scene.background = stageBackdrop(width, height, colours)
      old?.dispose()
    }
    // A darker stage needs a darker shadow to show one at all.
    const { l } = new THREE.Color(colours[1]).getHSL({ h: 0, s: 0, l: 0 })
    shadowMaterial.opacity = 0.16 + (1 - l) * 0.22
  }

  let sync: LiveSync | null = null
  let lastPlacement = ''
  /** What the screen and the strips last showed, so the printer's unchanged reports draw nothing. */
  let lastScreen = ''
  let lastLeds = ''
  /** The strips' own pixels, when the printer reports them; else the light's switch alone. */
  let strips: { lit: boolean } | null = null
  let raf = 0
  let lastDraw = 0
  let dragging = false
  let active = true
  let ready = false
  let disposed = false

  /** Brings the trace's new lines to the GPU: only those added since the last frame, unless older ones changed. */
  function showTrace () {
    const trace = sync?.trace
    if (!trace) return
    if (!traceAttribute) {
      traceAttribute = new THREE.BufferAttribute(trace.positions, 3).setUsage(THREE.DynamicDrawUsage)
      traceGeometry.setAttribute('position', traceAttribute)
    }
    if (traceShown.trace === trace && traceShown.version === trace.version && traceShown.count === trace.count) return
    traceAttribute.clearUpdateRanges()
    if (traceShown.trace === trace && traceShown.version === trace.version && trace.count > traceShown.count) {
      traceAttribute.addUpdateRange(traceShown.count * 6, (trace.count - traceShown.count) * 6)
    }
    traceAttribute.needsUpdate = true
    traceGeometry.setDrawRange(0, trace.count * 2)
    Object.assign(traceShown, { trace, version: trace.version, count: trace.count })
  }

  /** Puts everything where the printer has it now; whether it is still moving. */
  function follow (now: number): boolean {
    if (!sync) return false
    const f = sync.frame(now)
    const placement = placeModel(f.pose, cal)
    const led = strips ? strips.lit : f.pose.led
    const placed = `${placement.headX.toFixed(5)},${placement.headZ.toFixed(5)},${placement.z.toFixed(5)},${led}`
    if (placed !== lastPlacement) {
      lastPlacement = placed
      Object.assign(state, placement, { led })
      model.userData.apply()
    }
    if (print && toolpath) print.geometry.setDrawRange(0, Math.min(f.printDone, toolpath.count) * 2)
    nib.visible = !!f.nib
    if (f.nib) {
      nibPositions.set([...f.nib[0], ...f.nib[1]])
      nibGeometry.attributes.position.needsUpdate = true
    }
    showTrace()
    return f.moving
  }

  /** Sizes the marks: a new one swells and settles. Whether one still is. */
  function pulseTaps (now: number): boolean {
    let pulsing = false
    taps.forEach((t, i) => {
      const age = now - (tapSeen.get(tapKey(t)) ?? 0)
      const swell = age < PULSE_MS ? 1 + 1.4 * Math.sin(Math.PI * age / PULSE_MS) : 1
      if (age < PULSE_MS) pulsing = true
      tapMatrix.makeScale(swell, swell, swell).setPosition(t.x, t.y, 0)
      tapMarks.setMatrixAt(i, tapMatrix)
    })
    tapMarks.instanceMatrix.needsUpdate = true
    return pulsing
  }

  function draw () {
    raf = 0
    if (disposed || !active || !ready || !width || !height) return
    const now = performance.now()
    if (!dragging && now - lastDraw < FRAME_MS - 4) {
      raf = requestAnimationFrame(draw)
      return
    }
    const d = 0.25
    view.theta += (view.goalTheta - view.theta) * d
    view.phi += (view.goalPhi - view.phi) * d
    const moving = follow(now)
    const pulsing = pulseTaps(now)
    // Fitted afresh each frame, so the machine keeps filling the stage as it turns.
    refit()
    frame()
    const first = !lastDraw
    renderer.render(scene, camera)
    if (first) performance.mark('m1:first-frame')
    lastDraw = now
    viewer.onFrame?.()
    const turning = Math.abs(view.goalTheta - view.theta) > 1e-3 || Math.abs(view.goalPhi - view.phi) > 1e-3
    if (moving || pulsing || turning) invalidate()
  }

  /** Asks for a frame. */
  function invalidate () {
    if (raf || disposed) return
    raf = requestAnimationFrame(draw)
  }

  const viewer: M1Viewer = {
    onFrame: null,
    follow (next) {
      sync = next
      traceShown.trace = null
      traceAttribute = null
      invalidate()
    },
    wake: invalidate,
    setPrint (path, colour) {
      partMaterial.color.setHex(colour)
      if (print) {
        bedLift.remove(print)
        print.geometry.dispose()
        print = null
      }
      toolpath = path && path.count ? path : null
      if (toolpath) {
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(toolpath.positions, 3))
        geometry.setDrawRange(0, 0)
        print = onPlate(new THREE.LineSegments(geometry, partMaterial))
      }
      invalidate()
    },
    setScreen (screen) {
      // As the model compares them: whole degrees, whole percent.
      const shown = [screen.status, Math.round(screen.progress), Math.round(screen.nozzleTemp), Math.round(screen.nozzleTarget),
        Math.round(screen.bedTemp), Math.round(screen.bedTarget), screen.jobName, screen.connected].join('|')
      if (shown === lastScreen) return
      lastScreen = shown
      Object.assign(state, screen)
      model.userData.apply()
      invalidate()
    },
    setLeds (left, right) {
      const shown = JSON.stringify([left, right])
      if (shown === lastLeds) return
      lastLeds = shown
      strips = left || right ? { lit: stripsLit(left, right) } : null
      Object.assign(state, { ledLeft: left, ledRight: right })
      lastPlacement = ''
      invalidate()
    },
    setTaps (next) {
      const now = performance.now()
      taps = next.slice(-MAX_TAPS)
      const keys = new Set(taps.map(tapKey))
      for (const k of [...tapSeen.keys()]) if (!keys.has(k)) tapSeen.delete(k)
      for (const t of taps) if (!tapSeen.has(tapKey(t))) tapSeen.set(tapKey(t), now)
      const middle = middleHeight(taps)
      taps.forEach((t, i) => tapMarks.setColorAt(i, tapColourOf.setHex(tapColour(t, middle))))
      if (tapMarks.instanceColor) tapMarks.instanceColor.needsUpdate = true
      tapMarks.count = taps.length
      invalidate()
    },
    setActive (on) {
      active = on
      if (on) invalidate()
    },
    restyle () {
      restyle()
      invalidate()
    },
    setShift (share) {
      shift = share
      invalidate()
    },
    dispose () {
      disposed = true
      cancelAnimationFrame(raf)
      resize.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('dblclick', onReset)
      // The trace's array is the printer's sync's, kept for the next view; only its GPU copy goes.
      scene.traverse(o => {
        const mesh = o as THREE.Mesh
        mesh.geometry?.dispose()
        for (const m of ([] as THREE.Material[]).concat(mesh.material ?? [])) {
          for (const value of Object.values(m)) if (value instanceof THREE.Texture) value.dispose()
          m.dispose()
        }
      })
      env.dispose()
      ;(scene.background as THREE.Texture | null)?.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
    }
  }

  const resize = new ResizeObserver(() => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h || (w === width && h === height)) return
    width = w
    height = h
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 600 ? 1.5 : 2))
    renderer.setSize(w, h, false)
    restyle()
    invalidate()
  })
  resize.observe(canvas)

  // Every shader is built before the first frame, off the main thread where
  // the browser can, so the page doesn't freeze while they compile: each
  // material twice, as the screen draws it and as the glass's transmission
  // pass does (into a target, so without tone mapping, in linear colour),
  // and the backdrop's. Only the shadow pass's few are left to the first frame.
  scene.background = stageBackdrop(64, 64, stageColours(canvas))
  refit()
  frame()
  const compiling = [renderer.compileAsync(scene, camera)]
  const offscreen = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType })
  renderer.setRenderTarget(offscreen)
  compiling.push(renderer.compileAsync(scene, camera))
  renderer.setRenderTarget(null)
  Promise.all(compiling)
    .catch(() => undefined)
    .then(() => {
      offscreen.dispose()
      performance.mark('m1:compiled')
      ready = true
      invalidate()
    })

  // A mouse drag turns the machine; a double click puts it back.
  let drag: { x: number, y: number } | null = null
  function onDown (e: PointerEvent) {
    if (e.pointerType === 'touch' || e.button !== 0) return
    drag = { x: e.clientX, y: e.clientY }
    dragging = true
    canvas.setPointerCapture(e.pointerId)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp, { once: true })
    canvas.addEventListener('pointercancel', onUp, { once: true })
  }
  function onMove (e: PointerEvent) {
    if (!drag) return
    view.goalTheta -= (e.clientX - drag.x) * 0.0062
    view.goalPhi = Math.min(PHI_RANGE[1], Math.max(PHI_RANGE[0], view.goalPhi - (e.clientY - drag.y) * 0.0056))
    drag = { x: e.clientX, y: e.clientY }
    invalidate()
  }
  function onUp () {
    drag = null
    dragging = false
    canvas.removeEventListener('pointermove', onMove)
  }
  function onReset () {
    view.goalTheta = VIEW.theta
    view.goalPhi = VIEW.phi
    invalidate()
  }
  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('dblclick', onReset)

  return viewer
}
