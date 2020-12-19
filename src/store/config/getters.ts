import { GetterTree } from 'vuex'
import { ConfigState } from './types'
import { RootState } from '../types'

export const getters: GetterTree<ConfigState, RootState> = {
  getCurrentInstance: (state) => {
    return state.instances.find(instance => instance.active)
  },

  getInstances: (state) => {
    const instances = [...state.instances]
    instances.sort((a, b) => {
      return (a.active) ? -1 : (b.active) ? 1 : 0
    })
    return instances
  }
}
