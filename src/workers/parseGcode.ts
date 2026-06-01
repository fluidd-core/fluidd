import type { ArcMove, ArcPlane, BBox, Layer, LinearMove, Move, Part, PositioningMode } from '@/store/gcodePreview/types'
import isKeyOf from '@/util/is-key-of'
import { pick } from 'lodash-es'
import { split } from 'shlex'

const getArgsFromGcodeCommandArgs = (gcodeCommandArgs: string) => {
  const args: Record<string, number | undefined> = {}

  for (const [, key, value] of gcodeCommandArgs.matchAll(/([a-z])[ \t]*(-?(?:\d+(?:\.\d+)?|\.\d+))?/gi)) {
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
  const clearedLine = line
    .trim()
    .split(';', 2)[0]

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

  return {
    type: 'other' as const
  }
}

const linearMoveParams: (keyof LinearMove)[] = [
  'x', 'y', 'z', 'e'
]

const arcMoveParams: (keyof ArcMove)[] = [
  'x', 'y', 'z', 'e',
  'i', 'j', 'k', 'r'
]

const decimalRound = (a: number) => {
  return Math.round(a * 10000) / 10000
}

const utf8ByteLength = (str: string) => {
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

  const moves: Move[] = []
  const layers: Layer[] = []
  const parts: Part[] = []
  const tools = new Set<number>()

  let newLayerForNextMove = false
  let extrusionMode: PositioningMode = 'relative'
  let positioningMode: PositioningMode = 'absolute'
  let plane: ArcPlane = 'xy'
  const toolhead = {
    x: 0,
    y: 0,
    z: 0,
    e: 0,
  }
  let tool = 0
  let filePosition = 0
  const bounds: BBox = {
    x: {
      min: Number.POSITIVE_INFINITY,
      max: Number.NEGATIVE_INFINITY
    },
    y: {
      min: Number.POSITIVE_INFINITY,
      max: Number.NEGATIVE_INFINITY
    }
  }

  // todo get from firmware
  // store path: printer.printer.configFile.settings.firmware_retraction
  // { retract_length: number; unretract_extra_length: number }
  const fwretraction = {
    length: 1,
    extrudeExtra: 0,
    z: 0
  }

  const handleLine = (line: string) => {
    const { type, command, args } = parseLine(line) ?? {}

    let move: Move | null = null

    if (type === 'macro') {
      switch (command) {
        case 'SET_PRINT_STATS_INFO':
          if ('current_layer' in args) {
            newLayerForNextMove = true
          }
          break
        case 'EXCLUDE_OBJECT_DEFINE':
          if ('polygon' in args && args.polygon) {
            try {
              const data = JSON.parse(args.polygon)

              if (isPolygonData(data)) {
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
          if (linearMoveParams.some(param => param in args)) {
            move = {
              ...pick(args, linearMoveParams),
              tool,
              filePosition
            } satisfies LinearMove
          }
          break
        }
        case 'G2':
        case 'G3': {
          if (arcMoveParams.some(param => param in args)) {
            move = {
              ...pick(args, arcMoveParams),
              d: command === 'G2'
                ? 'clockwise'
                : 'counter-clockwise',
              plane,
              tool,
              filePosition
            } satisfies ArcMove
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
            e: -fwretraction.length,
            tool,
            filePosition
          } satisfies LinearMove

          if (fwretraction.z !== 0) {
            move.z = decimalRound(toolhead.z + fwretraction.z)
          }
          break
        case 'G11':
          move = {
            e: decimalRound(fwretraction.length + fwretraction.extrudeExtra),
            tool,
            filePosition
          } satisfies LinearMove

          if (fwretraction.z !== 0) {
            move.z = decimalRound(toolhead.z - fwretraction.z)
          }
          break
        case 'G28': {
          const hasX = 'x' in args
          const hasY = 'y' in args
          const hasZ = 'z' in args
          const noXYZ = !hasX && !hasY && !hasZ

          move = {
            tool,
            filePosition
          } satisfies LinearMove

          if (hasX || noXYZ) {
            move.x = 0
          }
          if (hasY || noXYZ) {
            move.y = 0
          }
          if (hasZ || noXYZ) {
            move.z = 0
          }
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
          if (extrusionMode === 'absolute') {
            toolhead.e = args.e ?? toolhead.e
          }

          if (positioningMode === 'absolute') {
            toolhead.x = args.x ?? toolhead.x
            toolhead.y = args.y ?? toolhead.y
            toolhead.z = args.z ?? toolhead.z
          }
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
            tool = +command.substring(1)
            tools.add(tool)
          }
          break
      }

      if (move) {
        if (extrusionMode === 'absolute' && move.e !== undefined) {
          const extrusionLength = decimalRound(move.e - toolhead.e)

          toolhead.e = move.e
          move.e = extrusionLength
        }

        if (positioningMode === 'relative') {
          if (move.x !== undefined) {
            move.x = decimalRound(move.x + toolhead.x)
          }

          if (move.y !== undefined) {
            move.y = decimalRound(move.y + toolhead.y)
          }

          if (move.z !== undefined) {
            move.z = decimalRound(move.z + toolhead.z)
          }
        }

        if (newLayerForNextMove && move.e && move.e > 0) {
          const m = move
          if (['x', 'y', 'i', 'j'].some(x => isKeyOf(x, m) && m[x] !== 0)) {
            const layer: Layer = {
              z: toolhead.z,
              move: moves.length - 1,
              filePosition
            }

            layers.push(layer)

            newLayerForNextMove = false
          }
        }

        toolhead.x = move.x ?? toolhead.x
        toolhead.y = move.y ?? toolhead.y
        toolhead.z = move.z ?? toolhead.z

        moves.push(move)

        if (layers.length > 0) {
          bounds.x.min = Math.min(bounds.x.min, toolhead.x)
          bounds.x.max = Math.max(bounds.x.max, toolhead.x)
          bounds.y.min = Math.min(bounds.y.min, toolhead.y)
          bounds.y.max = Math.max(bounds.y.max, toolhead.y)
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
    }
  } finally {
    reader.releaseLock()
  }

  sendProgress(filePosition)

  return {
    moves,
    layers,
    parts,
    bounds: layers.length > 0
      ? bounds
      : null,
    tools: [...tools]
      .sort((a, b) => a - b)
  }
}

export default parseGcode
