import { MutationTree } from 'vuex'
import { defaultState } from '.'
import { Part, PartsState } from './types'
import Vue from 'vue'

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
        const outline = obj.outline.map(p => {
          return { x: p[0], y: p[1] }
        })
        const part: Part = {
          name: name,
          outline: outline,
          target: { x: obj.center[0], y: obj.center[1] }
        }
        console.log(obj)
        partMap[name] = part
      })
      Vue.set(state, 'parts', Object.freeze(partMap))
    }
  }
}
