import type { BBox, Layer, MoveStore, Part, ValueRange } from '@/store/gcodePreview/types'
import { ExtrusionRole, MoveFlags } from '@/store/gcodePreview/types'
import decimalRound from '@/util/decimal-round'
import { parseExtrusionRoleComment } from './gcode-extrusion-roles'
import { split } from 'shlex'

type PositioningMode = 'relative' | 'absolute'

type ArcPlane = 'xy' | 'xz' | 'yz'

// axes named by a single G-code line, before positioning mode is applied; every
// field is required so each construction site keeps the same shape
interface GcodeMove {
  x: number | undefined;
  y: number | undefined;
  z: number | undefined;
  e: number | undefined;
  i: number | undefined;
  j: number | undefined;
  r: number | undefined;
}

const MAX_TOOL = 255

// guards against a corrupt or hostile file exhausting memory
const MAX_MOVES = 20_000_000
const MAX_PARTS = 10_000
const MAX_POLYGON_POINTS = 10_000

// file positions are stored in a Uint32Array
const MAX_FILE_POSITION = 0xffffffff

const MAX_SPEED = 0xffff

// counts like PrusaSlicer's ColorRange: exact up to 2 distinct values
const updateRange = (range: ValueRange | null, value: number): ValueRange => {
  if (!range) {
    return { min: value, max: value, count: 1 }
  }

  if (value !== range.min && value !== range.max) {
    range.count++
  }

  range.min = Math.min(range.min, value)
  range.max = Math.max(range.max, value)

  return range
}

const INITIAL_MOVE_CAPACITY = 1 << 14
const MOVE_GROWTH_FACTOR = 1.5

const growFloat32Array = (source: Float32Array<ArrayBuffer>, capacity: number) => {
  const result = new Float32Array(capacity)

  result.set(source)

  return result
}

const growUint32Array = (source: Uint32Array<ArrayBuffer>, capacity: number) => {
  const result = new Uint32Array(capacity)

  result.set(source)

  return result
}

const growUint16Array = (source: Uint16Array<ArrayBuffer>, capacity: number) => {
  const result = new Uint16Array(capacity)

  result.set(source)

  return result
}

const growUint8Array = (source: Uint8Array<ArrayBuffer>, capacity: number) => {
  const result = new Uint8Array(capacity)

  result.set(source)

  return result
}

// [a-z] is required, so no match is zero-length and the exec loop cannot spin
const gcodeCommandArgsRegExp = /([a-z])[ \t]*([-+]?\d*\.?\d+)?/gi

const getArgsFromGcodeCommandArgs = (gcodeCommandArgs: string) => {
  const args: Record<string, number | undefined> = {}

  gcodeCommandArgsRegExp.lastIndex = 0

  let match: RegExpExecArray | null

  while ((match = gcodeCommandArgsRegExp.exec(gcodeCommandArgs)) !== null) {
    const [, key, value] = match

    args[key.toLowerCase()] = value ? +value : undefined
  }

  return args
}

const getArgsFromMacroCommandArgs = (macroCommandArgs: string) => {
  const args: Record<string, string> = {}

  for (const entry of split(macroCommandArgs)) {
    const eqIndex = entry.indexOf('=')
    const key = entry.substring(0, eqIndex)
    const value = entry.substring(eqIndex + 1)
    args[key.toLowerCase()] = value
  }

  return args
}

const parseLine = (line: string) => {
  const trimmedLine = line.trim()

  if (trimmedLine.startsWith(';')) {
    return {
      type: 'comment' as const,
      comment: trimmedLine.substring(1).trim()
    }
  }

  const clearedLine = trimmedLine
    .split(';', 1)[0]

  if (clearedLine) {
    const [, gcodeCommand, gcodeCommandArgs = ''] = clearedLine
      .split(/^([gmt]\d+)\s*/i)

    if (gcodeCommand) {
      return {
        type: 'gcode' as const,
        command: gcodeCommand.toUpperCase(),
        args: getArgsFromGcodeCommandArgs(gcodeCommandArgs)
      }
    }

    const [, macroCommand, macroCommandArgs = ''] = clearedLine
      .split(/^(SET_PRINT_STATS_INFO|EXCLUDE_OBJECT_DEFINE|SET_RETRACTION)\s+/i)

    if (macroCommand) {
      return {
        type: 'macro' as const,
        command: macroCommand.toUpperCase(),
        args: getArgsFromMacroCommandArgs(macroCommandArgs)
      }
    }
  }

  return {
    type: 'other' as const
  }
}

/** Converts an R-form (radius) G2/G3 arc to I/J form, or `null` if the radius cannot span the two points. */
const arcRadiusToCenterOffset = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  r: number | undefined,
  clockwise: boolean
): { i: number, j: number } | null => {
  if (r === undefined) {
    return null
  }

  const deltaX = toX - fromX
  const deltaY = toY - fromY
  const chord = Math.hypot(deltaX, deltaY)

  if (chord === 0 || chord > 2 * Math.abs(r)) {
    return null
  }

  const h = Math.sqrt(r * r - (chord * chord) / 4)
  const sign = ((r < 0) !== clockwise) ? -1 : 1

  return {
    i: deltaX / 2 + (sign * h * -deltaY) / chord,
    j: deltaY / 2 + (sign * h * deltaX) / chord
  }
}

const createBounds = (): BBox => ({
  x: {
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY
  },
  y: {
    min: Number.POSITIVE_INFINITY,
    max: Number.NEGATIVE_INFINITY
  }
})

const nonAsciiRegExp = /[^\x20-\x7e]/

const utf8ByteLength = (str: string) => {
  if (!nonAsciiRegExp.test(str)) {
    return str.length
  }

  let bytes = 0

  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)

    if (code < 0x80) {
      bytes += 1
    } else if (code < 0x800) {
      bytes += 2
    } else if (code >= 0xd800 && code <= 0xdbff) {
      bytes += 4 // high surrogate + its low surrogate = one 4-byte sequence
      i++
    } else {
      bytes += 3
    }
  }

  return bytes
}

const isPolygonData = (data: unknown): data is [number, number][] => (
  Array.isArray(data) &&
  data
    .every(x => (
      Array.isArray(x) &&
      x.length === 2 &&
      x.every(y => typeof y === 'number')
    ))
)

const parseGcode = async (
  url: string,
  fileSize: number,
  sendProgress: (filePosition: number) => void
) => {
  const response = await fetch(url)

  if (!response.ok || !response.body) {
    throw new Error(`Failed to download gcode (${response.status} ${response.statusText})`)
  }

  const progressStep = Math.max(1, Math.floor(fileSize / 100))
  let nextProgressByte = 0

  let moveCapacity = INITIAL_MOVE_CAPACITY
  let moveX = new Float32Array(moveCapacity)
  let moveY = new Float32Array(moveCapacity)
  let moveZ = new Float32Array(moveCapacity)
  let moveI = new Float32Array(moveCapacity)
  let moveJ = new Float32Array(moveCapacity)
  let moveTool = new Uint8Array(moveCapacity)
  let moveFlags = new Uint8Array(moveCapacity)
  let moveRole = new Uint8Array(moveCapacity)
  let moveSpeed = new Uint16Array(moveCapacity)
  let moveFan = new Uint8Array(moveCapacity)
  let moveFilePosition = new Uint32Array(moveCapacity)
  let moveCount = 0
  let lastArcMoveIndex = -1

  const layers: Layer[] = []
  const parts: Part[] = []
  const tools = new Set<number>()
  const roles = new Set<ExtrusionRole>()
  let speedRange: ValueRange | null = null
  let fanRange: ValueRange | null = null

  let truncated = false
  let newLayerForNextMove = false
  let extrusionMode: PositioningMode = 'absolute'
  let positioningMode: PositioningMode = 'absolute'
  let plane: ArcPlane = 'xy'
  const toolhead = {
    x: 0,
    y: 0,
    z: 0,
    e: 0,
  }
  let tool = 0
  let role: ExtrusionRole = ExtrusionRole.None
  let feedrate = 0
  let fan = 0
  let filePosition = 0
  let bounds = createBounds()
  let lastBounds: BBox | null = null

  // todo get from firmware
  // store path: printer.printer.configFile.settings.firmware_retraction
  // { retract_length: number; unretract_extra_length: number }
  const fwretraction = {
    length: 1,
    extrudeExtra: 0,
    z: 0
  }

  const updateFeedrate = (f: number | undefined) => {
    if (f !== undefined && f > 0) {
      feedrate = Math.min(MAX_SPEED, Math.round(f))
    }
  }

  const handleLine = (line: string) => {
    const { type, command, args, comment } = parseLine(line)

    let move: GcodeMove | undefined
    let isArcMove = false
    let isClockwise = false
    let isSynthesizedMove = false

    if (type === 'comment') {
      role = parseExtrusionRoleComment(comment) ?? role
    } else if (type === 'macro') {
      switch (command) {
        case 'SET_PRINT_STATS_INFO':
          if ('current_layer' in args) {
            newLayerForNextMove = true
          }
          break
        case 'EXCLUDE_OBJECT_DEFINE':
          if ('polygon' in args && args.polygon && parts.length < MAX_PARTS) {
            try {
              const data = JSON.parse(args.polygon)

              if (isPolygonData(data) && data.length <= MAX_POLYGON_POINTS) {
                const part: Part = {
                  polygon: data
                    .map(([x, y]) => ({ x, y }))
                }

                parts.push(part)
              }
            } catch {
              // ignore invalid JSON
            }
          }
          break
        case 'SET_RETRACTION':
          if ('retract_length' in args) {
            fwretraction.length = +args.retract_length
          }
          if ('unretract_extra_length' in args) {
            fwretraction.extrudeExtra = +args.unretract_extra_length
          }
          break
      }
    } else if (type === 'gcode') {
      switch (command) {
        case 'G0':
        case 'G1': {
          const { x, y, z, e, f } = args

          updateFeedrate(f)

          if (x !== undefined || y !== undefined || z !== undefined || e !== undefined) {
            move = { x, y, z, e, i: undefined, j: undefined, r: undefined }
          }
          break
        }
        case 'G2':
        case 'G3': {
          const { x, y, z, e, i, j, r, f } = args

          updateFeedrate(f)

          if (
            x !== undefined || y !== undefined || z !== undefined || e !== undefined ||
            i !== undefined || j !== undefined || r !== undefined
          ) {
            move = { x, y, z, e, i, j, r }

            isArcMove = true
            isClockwise = command === 'G2'
          }
          break
        }
        case 'G17':
          plane = 'xy'
          break
        case 'G18':
          plane = 'xz'
          break
        case 'G19':
          plane = 'yz'
          break
        case 'G10':
          move = {
            x: undefined,
            y: undefined,
            z: fwretraction.z !== 0 ? decimalRound(toolhead.z + fwretraction.z, 4) : undefined,
            e: -fwretraction.length,
            i: undefined,
            j: undefined,
            r: undefined
          }

          isSynthesizedMove = true
          break
        case 'G11':
          move = {
            x: undefined,
            y: undefined,
            z: fwretraction.z !== 0 ? decimalRound(toolhead.z - fwretraction.z, 4) : undefined,
            e: decimalRound(fwretraction.length + fwretraction.extrudeExtra, 4),
            i: undefined,
            j: undefined,
            r: undefined
          }

          isSynthesizedMove = true
          break
        case 'G28': {
          const hasX = 'x' in args
          const hasY = 'y' in args
          const hasZ = 'z' in args
          const noXYZ = !hasX && !hasY && !hasZ

          move = {
            x: hasX || noXYZ ? 0 : undefined,
            y: hasY || noXYZ ? 0 : undefined,
            z: hasZ || noXYZ ? 0 : undefined,
            e: undefined,
            i: undefined,
            j: undefined,
            r: undefined
          }

          isSynthesizedMove = true
          break
        }
        case 'G90':
          positioningMode = 'absolute'
          break
        case 'M82':
          extrusionMode = 'absolute'
          break
        case 'G91':
          positioningMode = 'relative'
          break
        case 'M83':
          extrusionMode = 'relative'
          break
        case 'G92':
          toolhead.e = args.e ?? toolhead.e

          if (positioningMode === 'absolute') {
            toolhead.x = args.x ?? toolhead.x
            toolhead.y = args.y ?? toolhead.y
            toolhead.z = args.z ?? toolhead.z
          }
          break
        case 'M106': {
          // same as Klipper: a missing S is full speed, P is ignored
          const s = args.s ?? 255

          if (s >= 0) {
            fan = Math.min(255, Math.round(s))
          }
          break
        }
        case 'M107':
          fan = 0
          break
        case 'M207':
          fwretraction.length = args.s ?? fwretraction.length
          fwretraction.z = args.z ?? fwretraction.z
          break
        case 'M600':
          tools.add(0)
          tool = (tool + 1) % 10
          tools.add(tool)
          break
        default:
          if (command.startsWith('T')) {
            const requestedTool = +command.substring(1)

            if (
              Number.isInteger(requestedTool) &&
              requestedTool >= 0 &&
              requestedTool <= MAX_TOOL
            ) {
              tool = requestedTool
              tools.add(tool)
            }
          }
          break
      }

      if (move) {
        if (moveCount >= MAX_MOVES || filePosition > MAX_FILE_POSITION) {
          truncated = true
        } else {
          if (move.e !== undefined) {
            if (positioningMode === 'absolute' && extrusionMode === 'absolute' && !isSynthesizedMove) {
              const extrusionLength = decimalRound(move.e - toolhead.e, 4)

              toolhead.e = move.e
              move.e = extrusionLength
            } else {
              toolhead.e = decimalRound(toolhead.e + move.e, 4)
            }
          }

          const extrusion = move.e ?? 0

          if (positioningMode === 'relative' && !isSynthesizedMove) {
            if (move.x !== undefined) {
              move.x = decimalRound(move.x + toolhead.x, 4)
            }

            if (move.y !== undefined) {
              move.y = decimalRound(move.y + toolhead.y, 4)
            }

            if (move.z !== undefined) {
              move.z = decimalRound(move.z + toolhead.z, 4)
            }
          }

          if (newLayerForNextMove && extrusion > 0) {
            if (
              (move.x !== undefined && move.x !== toolhead.x) ||
              (move.y !== undefined && move.y !== toolhead.y) ||
              (move.i !== undefined && move.i !== 0) ||
              (move.j !== undefined && move.j !== 0)
            ) {
              if (layers.length > 0) {
                lastBounds = {
                  x: { ...bounds.x },
                  y: { ...bounds.y }
                }

                if (layers.length === 1) {
                  bounds = createBounds()
                }
              }

              const layerMove = Math.max(0, moveCount - 1)

              const layer: Layer = {
                z: toolhead.z,
                move: layerMove,
                // move `moveCount` is only written below
                filePosition: moveCount > 0 ? moveFilePosition[layerMove] : filePosition
              }

              layers.push(layer)

              newLayerForNextMove = false
            }
          }

          // only record arcs that can actually be drawn as one; everything else
          // falls back to a straight line at render time
          let arcI = 0
          let arcJ = 0

          if (isArcMove && plane === 'xy') {
            if (move.i !== undefined || move.j !== undefined) {
              arcI = move.i ?? 0
              arcJ = move.j ?? 0
            } else {
              const offset = arcRadiusToCenterOffset(
                toolhead.x,
                toolhead.y,
                move.x ?? toolhead.x,
                move.y ?? toolhead.y,
                move.r,
                isClockwise
              )

              if (offset) {
                arcI = offset.i
                arcJ = offset.j
              } else {
                isArcMove = false
              }
            }
          } else {
            isArcMove = false
          }

          toolhead.x = move.x ?? toolhead.x
          toolhead.y = move.y ?? toolhead.y
          toolhead.z = move.z ?? toolhead.z

          if (moveCount === moveCapacity) {
            moveCapacity = Math.min(MAX_MOVES, Math.ceil(moveCapacity * MOVE_GROWTH_FACTOR))

            moveX = growFloat32Array(moveX, moveCapacity)
            moveY = growFloat32Array(moveY, moveCapacity)
            moveZ = growFloat32Array(moveZ, moveCapacity)
            moveI = growFloat32Array(moveI, moveCapacity)
            moveJ = growFloat32Array(moveJ, moveCapacity)
            moveTool = growUint8Array(moveTool, moveCapacity)
            moveFlags = growUint8Array(moveFlags, moveCapacity)
            moveRole = growUint8Array(moveRole, moveCapacity)
            moveSpeed = growUint16Array(moveSpeed, moveCapacity)
            moveFan = growUint8Array(moveFan, moveCapacity)
            moveFilePosition = growUint32Array(moveFilePosition, moveCapacity)
          }

          moveX[moveCount] = toolhead.x
          moveY[moveCount] = toolhead.y
          moveZ[moveCount] = toolhead.z
          moveI[moveCount] = arcI
          moveJ[moveCount] = arcJ
          moveTool[moveCount] = tool
          moveFilePosition[moveCount] = filePosition
          moveRole[moveCount] = role
          moveSpeed[moveCount] = feedrate
          moveFan[moveCount] = fan
          moveFlags[moveCount] = (
            (extrusion > 0 ? MoveFlags.Extruding : 0) |
            (extrusion < 0 ? MoveFlags.Retracting : 0) |
            (isArcMove ? MoveFlags.Arc : 0) |
            (isArcMove && isClockwise ? MoveFlags.Clockwise : 0)
          )

          if (isArcMove) {
            lastArcMoveIndex = moveCount
          }

          if (extrusion > 0) {
            roles.add(role)

            speedRange = updateRange(speedRange, feedrate)
            fanRange = updateRange(fanRange, fan)
          }

          moveCount++

          if (layers.length > 0) {
            bounds.x.min = Math.min(bounds.x.min, toolhead.x)
            bounds.x.max = Math.max(bounds.x.max, toolhead.x)
            bounds.y.min = Math.min(bounds.y.min, toolhead.y)
            bounds.y.max = Math.max(bounds.y.max, toolhead.y)
          }
        }
      }
    }

    if (filePosition >= nextProgressByte) {
      sendProgress(filePosition)
      nextProgressByte = filePosition + progressStep
    }

    filePosition += utf8ByteLength(line) + 1 // + 1 for the '\n' (1 byte)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let cursor = 0

  const drainLines = () => {
    while (true) {
      const nl = buffer.indexOf('\n', cursor)

      if (nl === -1) {
        break
      }

      handleLine(buffer.slice(cursor, nl))

      cursor = nl + 1

      if (truncated) {
        break
      }
    }

    if (cursor > 0) {
      buffer = buffer.slice(cursor)
      cursor = 0
    }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        buffer += decoder.decode()
        drainLines()
        break
      }

      buffer += decoder.decode(value, { stream: true })
      drainLines()

      if (truncated) {
        break
      }
    }

    if (truncated) {
      try {
        await reader.cancel()
      } catch {
        // the moves parsed so far are still usable
      }
    }
  } finally {
    reader.releaseLock()
  }

  sendProgress(filePosition)

  const moves: MoveStore = {
    // sliced to length so the transferred buffers carry no slack
    x: moveX.slice(0, moveCount),
    y: moveY.slice(0, moveCount),
    z: moveZ.slice(0, moveCount),
    i: moveI.slice(0, lastArcMoveIndex + 1),
    j: moveJ.slice(0, lastArcMoveIndex + 1),
    tool: moveTool.slice(0, moveCount),
    flags: moveFlags.slice(0, moveCount),
    role: moveRole.slice(0, moveCount),
    speed: moveSpeed.slice(0, moveCount),
    fan: moveFan.slice(0, moveCount),
    filePosition: moveFilePosition.slice(0, moveCount),
    length: moveCount
  }

  return {
    moves,
    layers,
    parts,
    bounds: layers.length > 0
      ? lastBounds ?? bounds
      : null,
    tools: [...tools]
      .sort((a, b) => a - b),
    roles: [...roles]
      .sort((a, b) => a - b),
    speedRange,
    fanRange,
    truncated
  }
}

export default parseGcode
