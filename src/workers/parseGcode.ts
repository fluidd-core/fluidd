/* eslint-disable no-fallthrough */
import { ArcMove, LinearMove, Move, PositioningMode, Rotation } from '@/store/gcodePreview/types'
import { pick } from 'lodash-es'
import { Subject } from 'threads/observable'

function parseLine (line: string) {
  const [, command, args = ''] = line
    .trim()
    .split(';', 2)[0]
    .split(/^([a-z][0-9]+)\s+/i)

  if (!/^(G|M)\d+$/.test(command)) {
    return null
  }

  const argMap: any = {}

  for (const [, key, value] of args.matchAll(/([a-z])[ \t]*(-?\d+(?:\.\d+)?)/ig)) {
    argMap[key.toLowerCase()] = Number(value)
  }

  return {
    command: command.toUpperCase(),
    args: argMap
  }
}

export default function parseGcode (gcode: string, subject: Subject<unknown>) {
  const moves: Move[] = []
  const lines = gcode.split('\n')

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
            ? Rotation.Clockwise : Rotation.CounterClockwise
        } as ArcMove
        break
      case 'G10':
        move = {
          e: -fwretraction.length
        }

        if (fwretraction.z !== 0) {
          move.z = toolhead.z + fwretraction.z
        }
        break
      case 'G11':
        move = {
          e: fwretraction.length + fwretraction.extrudeExtra
        }

        if (fwretraction.z !== 0) {
          move.z = toolhead.z - fwretraction.z
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
        const extrusionLength = move.e - toolhead.e

        toolhead.e = move.e
        move.e = extrusionLength
      }

      if (positioningMode === PositioningMode.Relative) {
        if (move.x !== undefined) {
          move.x += toolhead.x
        }

        if (move.y !== undefined) {
          move.y += toolhead.y
        }

        if (move.z !== undefined) {
          move.z += toolhead.z
        }
      }

      toolhead.x = move.x ?? toolhead.x
      toolhead.y = move.y ?? toolhead.y
      toolhead.z = move.z ?? toolhead.z

      move.filePosition = toolhead.filePosition

      moves.push(Object.freeze(move))
    }

    if (i % Math.floor(lines.length / 100) === 0) {
      subject.next(toolhead.filePosition)
    }

    toolhead.filePosition += lines[i].length + 1 // + 1 for newline
  }

  subject.next(toolhead.filePosition)

  return moves
}
