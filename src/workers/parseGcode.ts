/* eslint-disable no-fallthrough */
import { ArcMove, Layer, LinearMove, Move, PositioningMode, Rotation } from '@/store/gcodePreview/types'
import { pick } from 'lodash-es'

function parseLine (line: string) {
  const clearedLine = line
    .trim()
    .split(';', 2)[0]

  const clearedLineUpperCase = clearedLine.toUpperCase()

  if (clearedLineUpperCase.startsWith('SET_PRINT_STATS_INFO ') && clearedLineUpperCase.includes(' CURRENT_LAYER=')) {
    return {
      command: ';LAYER',
      args: {}
    }
  }

  const [, command, args = ''] = clearedLine
    .split(/^([a-z][0-9]+)\s+/i)

  if (!/^(G|M)\d+$/.test(command)) {
    return null
  }

  const argMap: any = {}

  for (const [, key, value] of args.matchAll(/([a-z])[ \t]*(-?(?:\d+(?:\.\d+)?|\.\d+))/ig)) {
    argMap[key.toLowerCase()] = Number(value)
  }

  return {
    command: command.toUpperCase(),
    args: argMap
  }
}

function decimalRount (a: number) {
  return Math.round(a * 10000) / 10000
}

export default function parseGcode (gcode: string, sendProgress: (filePosition: number) => void) {
  const moves: Move[] = []
  const layers: Layer[] = []
  const lines = gcode.split('\n')

  let newLayerForNextMove = false
  let extrusionMode = PositioningMode.Relative
  let positioningMode = PositioningMode.Absolute
  const toolhead = {
    x: 0,
    y: 0,
    z: 0,
    e: 0,
    filePosition: 0
  }

  // todo get from firmware
  // store path: printer.printer.configFile.settings.firmware_retraction
  // { retract_length: number; unretract_extra_length: number }
  const fwretraction = {
    length: 1,
    extrudeExtra: 0,
    z: 0
  }

  for (let i = 0; i < lines.length; i++) {
    const {
      command,
      args
    } = parseLine(lines[i]) ?? {}

    if (!command) {
      toolhead.filePosition += lines[i].length + 1 // + 1 for newline

      continue
    } else if (command === ';LAYER') {
      newLayerForNextMove = true

      toolhead.filePosition += lines[i].length + 1 // + 1 for newline

      continue
    }

    let move: Move | null = null

    switch (command) {
      case 'G0':
      case 'G1':
        move = pick(args, [
          'x', 'y', 'z', 'e'
        ]) as LinearMove
        break
      case 'G2':
      case 'G3':
        move = {
          ...pick(args, [
            'x', 'y', 'z', 'e',
            'i', 'j', 'r'
          ]),
          direction: command === 'G2'
            ? Rotation.Clockwise
            : Rotation.CounterClockwise
        } as ArcMove
        break
      case 'G10':
        move = {
          e: -fwretraction.length
        }

        if (fwretraction.z !== 0) {
          move.z = decimalRount(toolhead.z + fwretraction.z)
        }
        break
      case 'G11':
        move = {
          e: decimalRount(fwretraction.length + fwretraction.extrudeExtra)
        }

        if (fwretraction.z !== 0) {
          move.z = decimalRount(toolhead.z - fwretraction.z)
        }
        break
      case 'G90':
        positioningMode = PositioningMode.Absolute
      case 'M82':
        extrusionMode = PositioningMode.Absolute
        toolhead.e = 0
        break
      case 'G91':
        positioningMode = PositioningMode.Relative
      case 'M83':
        extrusionMode = PositioningMode.Relative
        break
      case 'G92':
        if (extrusionMode === PositioningMode.Absolute) {
          toolhead.e = args.e ?? toolhead.e
        }

        if (positioningMode === PositioningMode.Absolute) {
          toolhead.x = args.x ?? toolhead.x
          toolhead.y = args.y ?? toolhead.y
          toolhead.z = args.z ?? toolhead.z
        }
        break
      case 'M207':
        fwretraction.length = args.s ?? fwretraction.length
        fwretraction.extrudeExtra = args.s ?? fwretraction.extrudeExtra
        fwretraction.z = args.z ?? fwretraction.z
        break
    }

    if (move) {
      if (extrusionMode === PositioningMode.Absolute && move.e !== undefined) {
        const extrusionLength = decimalRount(move.e - toolhead.e)

        toolhead.e = move.e
        move.e = extrusionLength
      }

      if (positioningMode === PositioningMode.Relative) {
        if (move.x !== undefined) {
          move.x = decimalRount(move.x + toolhead.x)
        }

        if (move.y !== undefined) {
          move.y = decimalRount(move.y + toolhead.y)
        }

        if (move.z !== undefined) {
          move.z = decimalRount(move.z + toolhead.z)
        }
      }

      if (newLayerForNextMove && move.e && move.e > 0) {
        const layer = {
          z: toolhead.z,
          move: moves.length - 1,
          filePosition: toolhead.filePosition
        }

        layers.push(Object.freeze(layer))

        newLayerForNextMove = false
      }

      toolhead.x = move.x ?? toolhead.x
      toolhead.y = move.y ?? toolhead.y
      toolhead.z = move.z ?? toolhead.z

      move.filePosition = toolhead.filePosition

      moves.push(Object.freeze(move))
    }

    if (i % Math.floor(lines.length / 100) === 0) {
      sendProgress(toolhead.filePosition)
    }

    toolhead.filePosition += lines[i].length + 1 // + 1 for newline
  }

  sendProgress(toolhead.filePosition)

  return { moves, layers }
}
