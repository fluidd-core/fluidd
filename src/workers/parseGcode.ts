/* eslint-disable no-fallthrough */
import type { ArcMove, Layer, LinearMove, Move, Part, Point, PositioningMode } from '@/store/gcodePreview/types'
import isKeyOf from '@/util/is-key-of'
import { pick } from 'lodash-es'
import shlex from 'shlex'

const getArgsFromGcodeCommandArgs = (gcodeCommandArgs: string) => {
  const args: Record<string, number> = {}

  for (const [, key, value] of gcodeCommandArgs.matchAll(/([a-z])[ \t]*(-?(?:\d+(?:\.\d+)?|\.\d+))/gi)) {
    args[key.toLowerCase()] = +value
  }

  return args
}

const getArgsFromMacroCommandArgs = (macroCommandArgs: string) => {
  const args: Record<string, string> = {}

  for (const entry of shlex.split(macroCommandArgs)) {
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
    .split(/^([gm]\d+)\s*/i)

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

const decimalRound = (a: number) => {
  return Math.round(a * 10000) / 10000
}

const parseGcode = (gcode: string, sendProgress: (filePosition: number) => void) => {
  const moves: Move[] = []
  const layers: Layer[] = []
  const parts: Part[] = []
  const lines = gcode.split('\n')

  let newLayerForNextMove = false
  let extrusionMode: PositioningMode = 'relative'
  let positioningMode: PositioningMode = 'absolute'
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
    const { type, command, args } = parseLine(lines[i]) ?? {}

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
            const polygonData = JSON.parse(args.polygon) as [number, number][]

            const part: Part = {
              polygon: polygonData
                .map(([x, y]): Point => ({
                  x,
                  y
                }))
            }

            parts.push(Object.freeze(part))
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
          const params = [
            'x', 'y', 'z', 'e'
          ]

          if (params.some(param => param in args)) {
            move = {
              ...pick(args, params),
              filePosition: toolhead.filePosition
            } satisfies LinearMove
          }
          break
        }
        case 'G2':
        case 'G3': {
          const params = [
            'x', 'y', 'z', 'e',
            'i', 'j', 'k', 'r'
          ]

          if (params.some(param => param in args)) {
            move = {
              ...pick(args, params),
              direction: command === 'G2'
                ? 'clockwise'
                : 'counter-clockwise',
              filePosition: toolhead.filePosition
            } satisfies ArcMove
          }
          break
        }
        case 'G10':
          move = {
            e: -fwretraction.length,
            filePosition: toolhead.filePosition
          } satisfies LinearMove

          if (fwretraction.z !== 0) {
            move.z = decimalRound(toolhead.z + fwretraction.z)
          }
          break
        case 'G11':
          move = {
            e: decimalRound(fwretraction.length + fwretraction.extrudeExtra),
            filePosition: toolhead.filePosition
          } satisfies LinearMove

          if (fwretraction.z !== 0) {
            move.z = decimalRound(toolhead.z - fwretraction.z)
          }
          break
        case 'G90':
          positioningMode = 'absolute'
        case 'M82':
          extrusionMode = 'absolute'
          toolhead.e = 0
          break
        case 'G91':
          positioningMode = 'relative'
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
              filePosition: toolhead.filePosition
            }

            layers.push(Object.freeze(layer))

            newLayerForNextMove = false
          }
        }

        toolhead.x = move.x ?? toolhead.x
        toolhead.y = move.y ?? toolhead.y
        toolhead.z = move.z ?? toolhead.z

        moves.push(Object.freeze(move))
      }
    }

    if (i % Math.floor(lines.length / 100) === 0) {
      sendProgress(toolhead.filePosition)
    }

    toolhead.filePosition += lines[i].length + 1 // + 1 for newline
  }

  sendProgress(toolhead.filePosition)

  return { moves, layers, parts }
}

export default parseGcode
