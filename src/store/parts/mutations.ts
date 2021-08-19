import { MutationTree } from 'vuex'
import { defaultState } from '.'
import { Part, PartsState } from './types'
import { Move } from '../gcodePreview/types'
import Vue from 'vue'

function workingPart (name: string, parts: {[key: string]: Part}) {
  let part = parts[name]
  if (!part) {
    part = {
      name: name,
      xmin: 1000000,
      ymin: 1000000,
      xmax: 0,
      ymax: 0,
      ytarget: 0,
      xtarget: 1000000
    }
    parts[name] = part
    return part
  }
  return part
}

export const mutations: MutationTree<PartsState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  setParts (state, moves: Move[]) {
    const partMap: { [key: string]: Part} = {}

    moves.forEach(move => {
      if (move.part) {
        const part = workingPart(move.part, partMap)

        if (part && move.y && move.x) {
          part.xmin = Math.min(part.xmin, move.x)
          part.ymin = Math.min(part.ymin, move.y)
          part.xmax = Math.max(part.xmax, move.x)
          part.ymax = Math.max(part.ymax, move.y)

          if (move.y > part.ytarget || (move.y === part?.ytarget && move.x < part.xtarget)) {
            part.xtarget = move.x
            part.ytarget = move.y
          }
        }
      }
    })
    Vue.set(state, 'parts', Object.freeze(partMap))
    Vue.set(state, 'excludedParts', [])
  },

  resetExcludedPartList (state) {
    Vue.set(state, 'excludedParts', [])
  },

  addExcludedPart (state, partName: string) {
    const newList = [...state.excludedParts]
    newList.push(partName)
    Vue.set(state, 'excludedParts', Object.freeze(newList))
  }
}
