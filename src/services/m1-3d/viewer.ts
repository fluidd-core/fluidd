import { THREE, m1, type M1Root } from './load'
import type { ModelPose } from './pose'

/**
 * The live M1 on a stage: the photoreal model, lit as its product shots
 * are, in front of the stage's own backdrop. It draws only when something changes (the pose, its size, a drag), so
 * an idle printer costs nothing. A mouse drag turns it; touch is left to
 * the page, so a phone still scrolls past it.
 *
 * The lighting and the studio environment follow the model's own viewer
 * (m1-model/src/04-viewer.js), which measured them against the photographs.
 */
export interface M1Viewer {
  setPose: (pose: ModelPose) => void;
  /** Moves the machine left by this share of the stage's width, to clear something on the right. */
  setShift: (share: number) => void;
  /** Called after each frame drawn; the first means it can be shown. */
  onFrame: (() => void) | null;
  dispose: () => void;
}

/** Seen from the mast side and a little above, as the s1_1 product shot is. */
const VIEW = { theta: -0.366, phi: 1.033 }
const PHI_RANGE = [0.72, 1.38]
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

/**
 * The stage's own light backdrop (PrinterStage's radial gradient), drawn
 * into the scene. The glass plate refracts what's behind it, so the scene
 * needs an opaque background to see through; on a transparent one the
 * plate turns milky white.
 */
function stageBackdrop (width: number, height: number): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = Math.max(2, Math.round(width / 4))
  c.height = Math.max(2, Math.round(height / 4))
  const x = c.getContext('2d') as CanvasRenderingContext2D
  // radial-gradient(120% 90% at 50% 40%, #fbfbfc 0%, #e4e4e8 62%, #cfcfd4 100%)
  x.translate(c.width * 0.5, c.height * 0.4)
  x.scale(1.2 * c.width, 0.9 * c.height)
  const g = x.createRadialGradient(0, 0, 0, 0, 0, 1)
  g.addColorStop(0, '#fbfbfc')
  g.addColorStop(0.62, '#e4e4e8')
  g.addColorStop(1, '#cfcfd4')
  x.fillStyle = g
  x.fillRect(-1, -1, 2, 2)
  const texture = new THREE.CanvasTexture(c)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** Puts the live M1 on `canvas`. Throws when the browser can't draw WebGL; the stage then keeps its picture. */
export function createViewer (canvas: HTMLCanvasElement): M1Viewer {
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
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.ShadowMaterial({ opacity: 0.16 }))
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.4
  ground.receiveShadow = true
  scene.add(ground)

  const model: M1Root = m1().build(m1().buildMaterials())
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
  model.userData.state.showPrint = false
  model.userData.state.showSpool = false
  model.userData.apply()

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

  let raf = 0
  let disposed = false
  const viewer: M1Viewer = {
    onFrame: null,
    setPose (pose) {
      Object.assign(model.userData.state, { headX: pose.headX, headZ: pose.headZ, z: pose.z, led: pose.led, progress: pose.progress })
      model.userData.apply()
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

  function draw () {
    raf = 0
    if (disposed || !width || !height) return
    const d = 0.25
    view.theta += (view.goalTheta - view.theta) * d
    view.phi += (view.goalPhi - view.phi) * d
    // Fitted afresh each frame, so the machine keeps filling the stage as it turns.
    refit()
    frame()
    renderer.render(scene, camera)
    viewer.onFrame?.()
    if (Math.abs(view.goalTheta - view.theta) > 1e-3 || Math.abs(view.goalPhi - view.phi) > 1e-3) invalidate()
  }

  function invalidate () {
    if (!raf && !disposed) raf = requestAnimationFrame(draw)
  }

  const resize = new ResizeObserver(() => {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h || (w === width && h === height)) return
    width = w
    height = h
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 600 ? 1.5 : 2))
    renderer.setSize(w, h, false)
    ;(scene.background as THREE.Texture | null)?.dispose()
    scene.background = stageBackdrop(w, h)
    invalidate()
  })
  resize.observe(canvas)

  // A mouse drag turns the machine; a double click puts it back.
  let drag: { x: number, y: number } | null = null
  function onDown (e: PointerEvent) {
    if (e.pointerType === 'touch' || e.button !== 0) return
    drag = { x: e.clientX, y: e.clientY }
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
