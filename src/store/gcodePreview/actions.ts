import { ActionTree } from 'vuex'
import { ArcMove, GcodePreviewState, LinearMove, Move, PositioningMode, Rotation } from './types'
import { RootState } from '../types'
import { parseGcode } from '@/store/helpers'
import { pick } from 'lodash-es'
import { AppFile } from '@/store/files/types'

/* eslint no-fallthrough: 0 */
export const actions: ActionTree<GcodePreviewState, RootState> = {
  /**
   * Reset our store
   */
  async reset ({ commit }) {
    commit('setReset')
  },

  async loadGcode ({ commit }, payload: { file: AppFile; gcode: string }) {
    const moves: Move[] = []

    let extrusionMode = PositioningMode.Relative
    let positioningMode = PositioningMode.Absolute
    const toolhead = {
      x: 0,
      y: 0,
      z: 0,
      e: 0,
      filePosition: 0
    }

    for (const line of payload.gcode.split('\n')) {
      const {
        command,
        args
      } = parseGcode(line) ?? {}

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

      toolhead.filePosition += line.length + 1
    }

    commit('setFile', payload.file)
    commit('setMoves', moves)
  }
}
