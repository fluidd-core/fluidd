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

  partUpdate (state, payload) {
    console.log('In partUpdate')
    console.log(payload)

    if ('excluded_objects' in payload) {
      Vue.set(state, 'excludedParts', JSON.parse(payload.excluded_objects))
    }

    if ('objects' in payload) {
      const partMap: { [key: string]: Part} = {}
      JSON.parse(payload.objects).forEach(obj => {
        const name = obj.name
        let xmin = 100000
        let ymin = 100000
        let xmax = 0
        let ymax = 0
        obj.outline.forEach(p => {
          const x = p[0]
          const y = p[1]
          xmin = Math.min(xmin, x)
          ymin = Math.min(ymin, y)
          xmax = Math.max(xmax, x)
          ymax = Math.max(ymax, y)
        })
        const part: Part = {
          name: name,
          xmin: xmin,
          ymin: ymin,
          xmax: xmax,
          ymax: ymax,
          xtarget: obj.center[0],
          ytarget: obj.center[1]
        }
        console.log(obj)
        partMap[name] = part
      })
      Vue.set(state, 'parts', Object.freeze(partMap))
    }
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
  },

  resetExcludedPartList (state) {
    Vue.set(state, 'excludedParts', [])
    Vue.set(state, 'excludedParts', [])
  },

  addExcludedPart (state, partName: string) {
    const newList = [...state.excludedParts]
    newList.push(partName)
    Vue.set(state, 'excludedParts', Object.freeze(newList))
  }
}
