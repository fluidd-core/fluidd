import type { MutationTree } from 'vuex'
import { defaultState } from './state'
import type { Part, PartObject, PartsState } from './types'
import Vue from 'vue'

export const mutations: MutationTree<PartsState> = {
  /**
   * Reset state
   */
  setReset (state) {
    Object.assign(state, defaultState())
  },

  partUpdate (state, payload) {
    if ('current_object' in payload) {
      Vue.set(state, 'currentPart', payload.current_object)
    }

    if ('excluded_objects' in payload) {
      Vue.set(state, 'excludedParts', payload.excluded_objects)
    }

    if ('objects' in payload) {
      const partMap: { [key: string]: Part} = {}
      payload.objects.forEach((obj: PartObject) => {
        const name = obj.name
        const part: Part = {
          name,
          outline: [],
          target: null
        }

        if ('center' in obj && obj.center.length === 2) {
          part.target = { x: obj.center[0], y: obj.center[1] }
        }

        if ('polygon' in obj) {
          part.outline = obj.polygon.map(p => {
            return { x: p[0], y: p[1] }
          })
        }

        partMap[name] = part
      })
      Vue.set(state, 'parts', Object.freeze(partMap))
    }
  },

  printStatsUpdate (state, payload) {
    if ('state' in payload) {
      Vue.set(state, 'printState', payload.state)
    }
  }
}
