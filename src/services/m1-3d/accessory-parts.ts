import { THREE, type M1Root } from './load'
import { PLATE_RETURN_PRINT_MS, type AccessoryFrame, type PlateClip } from './accessory-motion'

/**
 * What comes and goes on the M1, drawn on the live model: the glass plate
 * taken off (turned face up onto the table beside the printer, carrying the
 * print) and put back, the umbilical hose's end out of the toolhead's boot
 * and back in, and the filament from the spool on the mast, in through the
 * inlet by the screen, down the hose and into the toolhead. The timeline is
 * the printer's (accessory-motion.ts); this places the parts for a frame of
 * it, in the model's millimetres.
 *
 * The M1 prints upside down: on the printer the print hangs under the plate,
 * on the face toward the toolhead, and gravity points away from the plate.
 * So the plate is turned over to set it down face up, and turned back to go
 * on, which is when a print still on it falls off.
 */

export interface AccessoryParts {
  /** The plate and everything drawn on it (the print, loose lines, touches); moves as the plate does. */
  carrier: THREE.Group;
  /** Inside the carrier: the print and what else hangs from the plate, which falls off on its own. */
  cargo: THREE.Group;
  /** Places everything for `frame`; `partGone` is the sync's (the last print went with the plate). */
  apply: (frame: AccessoryFrame, partGone: boolean) => void;
  /** How far the plate is off the printer now, 0 on to 1 on the table, for the stage to fit. */
  plateOff: () => number;
  /** The box round the plate set down beside the printer, in world space. */
  plateOffBox: THREE.Box3;
  /** The filament's colour: the strand, the tail, the spool's wound filament and the ring in the hose. */
  setColour: (colour: number) => void;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** Progress through a part of a clip, 0 before it and 1 after. */
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a))
/** The model's own ease (01-core.js easeInOut), and its halves. */
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const easeOut = (t: number) => 1 - (1 - t) * (1 - t)
const easeIn = (t: number) => t * t

/** On the table beside the printer: off the front-right wall, its long side along the wall. */
const OFF_CLEARANCE = 16
/** Off the clamp: the plate slides toward the front before it is lifted away. */
const SLIDE_MM = 58
/** A print falls this fast, stylised (mm/s²): real gravity drops it out of sight in a tenth of a second. */
const FALL_MM_S2 = 700
/** A falling print is gone after this long. */
const FADE_MS = 650
/** Where the falling print lets go, in the return-with-print clip: as the plate turns past the vertical. */
const DROP_AT = 0.33
/** The hose's end, out of its boot: pulled this far, then let fall over the deck's edge to the table, this far out from the base's front-left wall. */
const PULL_MM = 18
const REST_OUT_MM = 105
/** How far it rises over the deck's edge on the way. */
const OVER_MM = 28
/** The unlock button held: the hose's end eases out this much. */
const UNLOCK_MM = 3
/** The filament's radius (1.75 mm), and the spool's wound radius and flange (03-model.js buildMast). */
const FILAMENT_R = 0.875
const WOUND_R = 79
const HOLE_R = 86
const FLANGE_Z = 28

/**
 * The return clips' phases are put the other way round of the removal's: a
 * reversal mid-clip (accessory-motion starts it at 1 − t) carries on from
 * about where the plate was.
 */
export function buildAccessories (
  model: M1Root,
  mats: Record<string, THREE.Material>,
  fadeCargo: (opacity: number) => void
): AccessoryParts {
  const ud = model.userData as Record<string, any>
  const dim = (window as unknown as { M1: { DIM: Record<string, number> } }).M1.DIM
  const bedLift = ud.bedLift as THREE.Object3D
  const bed = ud.bed as THREE.Object3D
  model.updateMatrixWorld(true)

  // -- the plate ---------------------------------------------------------------
  const carrier = new THREE.Group()
  carrier.name = 'plateCarrier'
  carrier.matrixAutoUpdate = false
  bedLift.add(carrier)
  const cargo = new THREE.Group()
  cargo.name = 'plateCargo'
  cargo.matrixAutoUpdate = false
  carrier.add(cargo)
  // The bed hangs in bedLift with no transform of its own, so the glass keeps its place in the carrier.
  for (const part of [bed.userData.glass, bed.userData.rim, bed.userData.glassDecal] as THREE.Object3D[]) {
    if (part) carrier.add(part)
  }
  const glass = bed.userData.glass as THREE.Mesh
  glass.geometry.computeBoundingBox()
  const plateLocal = (glass.geometry.boundingBox as THREE.Box3).clone().translate(glass.position)
  /** The plate's middle in bedLift's frame. */
  const centre = plateLocal.getCenter(new THREE.Vector3())
  const thickness = plateLocal.max.y - plateLocal.min.y

  const up = new THREE.Vector3(0, 1, 0)
  const wall = new THREE.Vector3(Math.SQRT1_2, 0, Math.SQRT1_2)
  const wallDistance = dim.R / Math.SQRT2
  const plateDepth = plateLocal.max.z - plateLocal.min.z
  const offPos = wall.clone().multiplyScalar(wallDistance + OFF_CLEARANCE + plateDepth / 2)
  offPos.y = thickness / 2
  // Turned over (its print face up), and round so its long side runs along the front-right wall.
  const yaw = new THREE.Quaternion().setFromAxisAngle(up, Math.PI / 4)
  const faceUp = yaw.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI))
  const faceDown = yaw.clone()
  const level = new THREE.Quaternion()

  const bedWorld = new THREE.Vector3()
  const onPos = () => bedLift.getWorldPosition(bedWorld).add(centre)
  const pos = new THREE.Vector3()
  const rot = new THREE.Quaternion()
  const tmpA = new THREE.Vector3()
  const tmpB = new THREE.Vector3()

  /** A quadratic arc from `a` to `b`, `lift` above the higher of them at its middle. */
  function arc (a: THREE.Vector3, b: THREE.Vector3, lift: number, k: number, out: THREE.Vector3) {
    const cx = (a.x + b.x) / 2
    const cy = Math.max(a.y, b.y) + lift
    const cz = (a.z + b.z) / 2
    const s = 1 - k
    return out.set(
      s * s * a.x + 2 * s * k * cx + k * k * b.x,
      s * s * a.y + 2 * s * k * cy + k * k * b.y,
      s * s * a.z + 2 * s * k * cz + k * k * b.z)
  }

  /** Where the plate's middle is and how it is turned, `t` through `clip`. */
  function platePose (clip: PlateClip | null, on: boolean, t: number) {
    const home = onPos()
    const slid = tmpA.copy(home).add(new THREE.Vector3(0, 0, SLIDE_MM))
    if (!clip) {
      if (on) pos.copy(home)
      else pos.copy(offPos)
      rot.copy(on ? level : faceUp)
      return
    }
    if (clip === 'remove') {
      // Off the clamp toward the front, up and over to the table, turning face up on the way, and set down.
      const above = tmpB.copy(offPos).add(new THREE.Vector3(0, 14, 0))
      if (t < 0.22) {
        pos.lerpVectors(home, slid, easeInOut(seg(t, 0, 0.22)))
      } else if (t < 0.86) {
        arc(slid, above, 70, easeInOut(seg(t, 0.22, 0.86)), pos)
      } else {
        pos.lerpVectors(above, offPos, easeOut(seg(t, 0.86, 1)))
      }
      rot.slerpQuaternions(level, faceUp, easeInOut(seg(t, 0.3, 0.8)))
    } else if (clip === 'return-print') {
      // Lifted off the table, turned face down in the air (the print lets go), then over and slid on.
      const lifted = tmpB.copy(offPos).add(new THREE.Vector3(0, 110, 0))
      if (t < 0.14) {
        pos.lerpVectors(offPos, lifted, easeOut(seg(t, 0, 0.14)))
        rot.copy(faceUp)
      } else if (t < 0.5) {
        pos.copy(lifted)
        rot.slerpQuaternions(faceUp, faceDown, easeInOut(seg(t, 0.14, 0.5)))
      } else if (t < 0.84) {
        const k = easeInOut(seg(t, 0.5, 0.84))
        arc(lifted, slid, 30, k, pos)
        rot.slerpQuaternions(faceDown, level, k)
      } else {
        pos.lerpVectors(slid, home, easeInOut(seg(t, 0.84, 1)))
        rot.copy(level)
      }
    } else {
      // Empty: one sweep, turning as it goes, and slid on.
      const lifted = tmpB.copy(offPos).add(new THREE.Vector3(0, 30, 0))
      if (t < 0.18) {
        pos.lerpVectors(offPos, lifted, easeOut(seg(t, 0, 0.18)))
        rot.copy(faceUp)
      } else if (t < 0.8) {
        const k = easeInOut(seg(t, 0.18, 0.8))
        arc(lifted, slid, 80, k, pos)
        rot.slerpQuaternions(faceUp, level, k)
      } else {
        pos.lerpVectors(slid, home, easeInOut(seg(t, 0.8, 1)))
        rot.copy(level)
      }
    }
  }

  const toCentre = new THREE.Matrix4().makeTranslation(-centre.x, -centre.y, -centre.z)
  const posed = new THREE.Matrix4()
  /** The carrier's matrix in bedLift's frame for the pose in `pos` and `rot`. */
  function carrierMatrix (out: THREE.Matrix4) {
    bedLift.getWorldPosition(bedWorld)
    posed.compose(tmpA.copy(pos).sub(bedWorld), rot, new THREE.Vector3(1, 1, 1))
    return out.multiplyMatrices(posed, toCentre)
  }

  // The box round the plate on the table, for the stage to make room for it.
  platePose(null, false, 1)
  const offMatrix = carrierMatrix(new THREE.Matrix4())
  const plateOffBox = plateLocal.clone().applyMatrix4(offMatrix).applyMatrix4(bedLift.matrixWorld)
  // The print stands on the plate there, up to about the height the printer can build.
  plateOffBox.max.y += Math.min(160, dim.bedTravel ?? 160)

  const dropFrom = new THREE.Matrix4()
  const fall = new THREE.Matrix4()
  const inverse = new THREE.Matrix4()
  const tilt = new THREE.Matrix4()
  const back = new THREE.Matrix4()
  let offAmount = 0

  function applyPlate (frame: AccessoryFrame, partGone: boolean) {
    const { clip, on, t } = frame.plate
    platePose(clip, on, t)
    carrierMatrix(carrier.matrix)
    carrier.matrixWorldNeedsUpdate = true
    offAmount = !clip ? (on ? 0 : 1) : clip === 'remove' ? easeInOut(t) : 1 - easeInOut(t)

    cargo.matrix.identity()
    let opacity = 1
    if (clip === 'return-print' && t > DROP_AT) {
      // Let go as the plate turned past the vertical: falling (away from the plate, as gravity points), tumbling a little, and fading.
      const seconds = (t - DROP_AT) * PLATE_RETURN_PRINT_MS / 1000
      platePose(clip, on, DROP_AT)
      carrierMatrix(dropFrom)
      const pivot = tmpB.copy(pos).sub(bedLift.getWorldPosition(bedWorld))
      fall.makeTranslation(pivot.x, pivot.y - 0.5 * FALL_MM_S2 * seconds * seconds, pivot.z)
        .multiply(tilt.makeRotationZ(-0.45 * seconds))
        .multiply(back.makeTranslation(-pivot.x, -pivot.y, -pivot.z))
        .multiply(dropFrom)
      inverse.copy(carrier.matrix).invert()
      cargo.matrix.multiplyMatrices(inverse, fall)
      opacity = 1 - clamp01(seconds * 1000 / FADE_MS)
      platePose(clip, on, t)
    }
    cargo.matrixWorldNeedsUpdate = true
    cargo.visible = clip === 'return-print' ? opacity > 0 : !partGone
    fadeCargo(opacity)
  }

  // -- the hose's end ------------------------------------------------------------
  const conduit = ud.conduit as THREE.Mesh
  const pod = ud.pod as THREE.Object3D
  const base = ud.base as THREE.Object3D
  const solve = conduit.userData.update as (A: THREE.Vector3, dA: THREE.Vector3, B: THREE.Vector3, dB: THREE.Vector3) => void
  const tube = { out: 0, rest: 0, settle: 0 }
  const endAt = new THREE.Vector3()
  const endDir = new THREE.Vector3()
  const restAt = new THREE.Vector3()
  const restDir = new THREE.Vector3()
  /** Where the hose's head end is, from the boot's mouth (A, dA) and how far out it is. */
  function hoseEnd (A: THREE.Vector3, dA: THREE.Vector3) {
    const pulled = tmpB.copy(A).addScaledVector(dA, tube.out)
    if (tube.rest <= 0) {
      endAt.copy(pulled)
      endDir.copy(dA)
      return
    }
    // Resting: on the table in front of the base's front-left wall, where the hose comes out of the base, pointing away from it.
    restAt.copy(socket).addScaledVector(frontLeft, REST_OUT_MM).addScaledVector(alongWall, 30)
    restAt.y = hoseR + 0.4
    const k = tube.rest
    // Swung out over the deck's edge (eased out), dropping faster as it goes (eased in), then a small settle on the table.
    endAt.set(
      pulled.x + (restAt.x - pulled.x) * easeOut(k),
      pulled.y + (restAt.y - pulled.y) * easeIn(k) + OVER_MM * Math.sin(Math.PI * Math.min(1, k * 1.4)) * (1 - k) + tube.settle,
      pulled.z + (restAt.z - pulled.z) * easeOut(k))
    endDir.copy(dA).lerp(restDir, easeInOut(k)).normalize()
  }
  // The model solves the hose for the boot's mouth whenever the head moves; it gets the end's place instead.
  conduit.userData.update = (A: THREE.Vector3, dA: THREE.Vector3, B: THREE.Vector3, dB: THREE.Vector3) => {
    hoseEnd(A, dA)
    solve(endAt, endDir, B, dB)
  }
  const bootMouth = new THREE.Vector3()
  const socket = (base.userData.socketAnchor as THREE.Vector3).clone()
  const frontLeft = new THREE.Vector3(-Math.SQRT1_2, 0, Math.SQRT1_2)
  const alongWall = new THREE.Vector3(Math.SQRT1_2, 0, Math.SQRT1_2)
  const hoseR = 8.3
  // The hose leaves its end back toward the cuff in the wall.
  restDir.copy(frontLeft).negate().addScaledVector(alongWall, -0.35).normalize()
  function solveHose () {
    const podU = pod.userData as { bootAnchor: THREE.Vector3, bootDir: THREE.Vector3 }
    bootMouth.copy(podU.bootAnchor).add(pod.position)
    conduit.userData.update(bootMouth, podU.bootDir, base.userData.socketAnchor, base.userData.socketDir)
  }

  // The connector on the hose's end, seen only once it is out of the boot.
  const connector = new THREE.Mesh(new THREE.CylinderGeometry(9.6, 9.0, 15, 32), mats.rubber ?? mats.dark)
  connector.castShadow = true
  connector.visible = false
  model.add(connector)
  const cylUp = new THREE.Vector3(0, 1, 0)

  let lastTube = ''
  function applyTube (frame: AccessoryFrame) {
    const { clip, attached, t, unlocking } = frame.tube
    let out = 0
    let rest = 0
    let settle = 0
    if (!clip) {
      out = attached ? (unlocking ? UNLOCK_MM : 0) : PULL_MM
      rest = attached ? 0 : 1
    } else if (clip === 'detach') {
      out = PULL_MM * easeInOut(seg(t, 0, 0.3))
      rest = seg(t, 0.3, 0.92)
      settle = t > 0.92 ? Math.sin(Math.PI * seg(t, 0.92, 1)) * 2.5 : 0
    } else {
      rest = 1 - easeInOut(seg(t, 0, 0.62))
      out = PULL_MM * (1 - easeInOut(seg(t, 0.68, 1)))
    }
    Object.assign(tube, { out, rest, settle })
    const key = `${out.toFixed(3)},${rest.toFixed(4)},${settle.toFixed(3)}`
    if (key !== lastTube) {
      lastTube = key
      solveHose()
    }
    // Past the boot's mouth by more than the hose's 4 mm inside it, the end shows.
    connector.visible = out > 4 || rest > 0
    if (connector.visible) {
      connector.position.copy(endAt).addScaledVector(endDir, -3.5)
      connector.quaternion.setFromUnitVectors(cylUp, endDir)
    }
  }

  // -- the spool and the filament -------------------------------------------------
  const spool = ud.spool as THREE.Group
  const display = ud.display as THREE.Object3D
  const strandMaterial = new THREE.MeshPhysicalMaterial({ color: 0xc00a66, roughness: 0.35, clearcoat: 0.3, clearcoatRoughness: 0.4 })
  // The reel turns as filament comes off or goes back; its wound filament is round, so only the tail and its hole show it.
  const reel = new THREE.Group()
  reel.name = 'reel'
  spool.add(reel)
  const holeAngle = -Math.PI * 0.62
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 4.6, 16), mats.dark)
  hole.rotation.x = Math.PI / 2
  hole.position.set(HOLE_R * Math.cos(holeAngle), HOLE_R * Math.sin(holeAngle), FLANGE_Z)
  reel.add(hole)
  // Unloaded, the end is held in a hole in the front flange, as a spool's own is.
  const a0 = holeAngle - 0.42
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(WOUND_R * Math.cos(a0), WOUND_R * Math.sin(a0), 14),
    new THREE.Vector3((WOUND_R + 3) * Math.cos(a0 + 0.22), (WOUND_R + 3) * Math.sin(a0 + 0.22), 22),
    new THREE.Vector3(HOLE_R * Math.cos(holeAngle), HOLE_R * Math.sin(holeAngle), FLANGE_Z - 3),
    new THREE.Vector3(HOLE_R * Math.cos(holeAngle), HOLE_R * Math.sin(holeAngle), FLANGE_Z + 3.2)
  ])
  const TAIL_SEGS = 24
  const RADIAL = 8
  const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, TAIL_SEGS, FILAMENT_R, RADIAL, false), strandMaterial)
  reel.add(tail)

  // From the bottom of the wound filament, over the back-left wall, down into the inlet by the screen.
  model.updateMatrixWorld(true)
  const spoolCentre = spool.getWorldPosition(new THREE.Vector3())
  const screen = display.getWorldPosition(new THREE.Vector3())
  const inlet = new THREE.Vector3(screen.x + 12, dim.deckY, screen.z - (dim.screenR ?? 26) - 12)
  const leave = spoolCentre.clone().add(new THREE.Vector3(-WOUND_R * 0.42, -WOUND_R * 0.9, 12))
  const strandCurve = new THREE.CatmullRomCurve3([
    leave,
    leave.clone().lerp(inlet, 0.3).add(new THREE.Vector3(0, -6, 0)),
    leave.clone().lerp(inlet, 0.7).add(new THREE.Vector3(0, 8, 0)),
    inlet.clone().add(new THREE.Vector3(0, 22, 0)),
    inlet.clone().add(new THREE.Vector3(0, 4, 0)),
    inlet.clone().add(new THREE.Vector3(0, -10, 0))
  ], false, 'centripetal')
  const STRAND_SEGS = 160
  const strandGeometry = new THREE.TubeGeometry(strandCurve, STRAND_SEGS, FILAMENT_R, RADIAL, false)
  const strand = new THREE.Mesh(strandGeometry, strandMaterial)
  strand.castShadow = true
  model.add(strand)
  const strandTurn = strandCurve.getLength() / WOUND_R

  // The inlet: a small black grommet in the deck.
  const grommet = new THREE.Mesh(new THREE.TorusGeometry(3.1, 1.1, 10, 28), mats.rubber ?? mats.dark)
  grommet.rotation.x = Math.PI / 2
  grommet.position.copy(inlet).add(new THREE.Vector3(0, 0.4, 0))
  model.add(grommet)
  const bore = new THREE.Mesh(new THREE.CircleGeometry(2.2, 20), mats.dark)
  bore.rotation.x = -Math.PI / 2
  bore.position.copy(inlet).add(new THREE.Vector3(0, 0.15, 0))
  model.add(bore)

  // The filament inside the hose can't be seen, so a ring round the hose shows where its tip is.
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xc00a66, transparent: true, toneMapped: false, depthWrite: false })
  const ring = new THREE.Mesh(new THREE.TorusGeometry(10.6, 1.7, 10, 40), ringMaterial)
  ring.visible = false
  ring.renderOrder = 5
  model.add(ring)
  const ringUp = new THREE.Vector3(0, 0, 1)
  const frames = (conduit.material as THREE.Material & { hoseFrames: THREE.DataTexture }).hoseFrames
  const frameCount = frames.image.height
  /** A point along the hose, 0 at the head's end and 1 at the base's, and the way it runs there. */
  function alongHose (s: number, at: THREE.Vector3, dir: THREE.Vector3) {
    const data = frames.image.data as unknown as Float32Array
    const f = clamp01(s) * (frameCount - 1)
    const i = Math.min(frameCount - 2, Math.floor(f))
    const k = f - i
    at.set(data[i * 12], data[i * 12 + 1], data[i * 12 + 2])
      .lerp(tmpA.set(data[(i + 1) * 12], data[(i + 1) * 12 + 1], data[(i + 1) * 12 + 2]), k)
    dir.set(data[i * 12 + 4], data[i * 12 + 5], data[i * 12 + 6]).normalize()
  }
  /** The hose runs 4 mm inside the boot: the ring stops this far along, just out of it. */
  const AT_HEAD = 0.11
  const ringAt = new THREE.Vector3()
  const ringDir = new THREE.Vector3()
  const ACCENT_FAIL = new THREE.Color(0xf06b61)
  const filamentColour = new THREE.Color(0xc00a66)

  function showRing (s: number | null, opacity: number, scale = 1, colour = filamentColour) {
    ring.visible = s !== null && opacity > 0.01
    if (!ring.visible || s === null) return
    alongHose(AT_HEAD + s * (1 - 2 * AT_HEAD), ringAt, ringDir)
    ring.position.copy(ringAt)
    ring.quaternion.setFromUnitVectors(ringUp, ringDir)
    ring.scale.setScalar(scale)
    ringMaterial.opacity = opacity
    ringMaterial.color.copy(colour)
  }

  function drawn (mesh: THREE.Mesh, segments: number, share: number) {
    const n = Math.round(clamp01(share) * segments)
    mesh.geometry.setDrawRange(0, n * RADIAL * 6)
    mesh.visible = n > 0
  }

  function applyFilament (frame: AccessoryFrame) {
    spool.visible = frame.spool
    const { clip, loaded, t, autoLoad, autoLoadAge } = frame.filament
    let strandShare = loaded ? 1 : 0
    let tailShare = loaded ? 0 : 1
    let ringS: number | null = null
    let ringOpacity = 0.9
    if (clip === 'load') {
      // The end out of its hole, the strand off the reel to the inlet, then the tip down the hose.
      tailShare = 1 - easeInOut(seg(t, 0, 0.12))
      strandShare = easeInOut(seg(t, 0.12, 0.6))
      if (t > 0.6) {
        ringS = 1 - easeInOut(seg(t, 0.6, 1))
        ringOpacity = 0.9 * seg(t, 0.6, 0.66)
      }
    } else if (clip === 'unload') {
      // Back up the hose, the strand back onto the reel, and the end into its hole.
      if (t < 0.36) {
        ringS = easeInOut(seg(t, 0, 0.36))
        ringOpacity = 0.9 * (1 - seg(t, 0.3, 0.36))
      }
      strandShare = 1 - easeInOut(seg(t, 0.36, 0.85))
      tailShare = easeInOut(seg(t, 0.85, 1))
    }
    reel.rotation.z = -strandTurn * strandShare
    // Loaded: the tail is the strand now, so it is never drawn with it.
    drawn(strand, STRAND_SEGS, strandShare)
    drawn(tail, TAIL_SEGS, tailShare)

    if (!clip && loaded) {
      // The toolhead taking it (the auto-load): the ring at the boot pulses while it grabs, sinks in when it has, and flashes when it couldn't.
      if (autoLoad === 'loading') {
        showRing(0, 0.9, 1 + 0.18 * Math.sin(autoLoadAge / 140))
        return
      }
      if (autoLoad === 'grabbed' && autoLoadAge < 900) {
        const k = autoLoadAge / 900
        showRing(0, 0.9 * (1 - k), 1 - 0.35 * k)
        return
      }
      if (autoLoad === 'failed' && autoLoadAge < 900) {
        const k = autoLoadAge / 900
        showRing(0, 0.9 * (1 - k * k), 1 + 0.15 * Math.abs(Math.sin(k * Math.PI * 2)), ACCENT_FAIL)
        return
      }
    }
    showRing(ringS, ringOpacity)
  }

  return {
    carrier,
    cargo,
    plateOffBox,
    plateOff: () => offAmount,
    apply (frame, partGone) {
      applyPlate(frame, partGone)
      applyTube(frame)
      applyFilament(frame)
    },
    setColour (colour) {
      filamentColour.setHex(colour)
      strandMaterial.color.setHex(colour)
      ringMaterial.color.setHex(colour)
      const wound = mats.filament as THREE.MeshPhysicalMaterial | undefined
      wound?.color.setHex(colour)
    }
  }
}
