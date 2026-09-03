import Vue from 'vue'
import { createPinia, type PiniaPluginContext, PiniaVuePlugin, type StoreGeneric } from 'pinia'

Vue.use(PiniaVuePlugin)

const stores = new Set<StoreGeneric>()

const pinia = createPinia()

pinia.use(({ store }: PiniaPluginContext) => {
  stores.add(store)
})

// A store that was never instantiated still holds its initial state.
export const resetPiniaStores = () => {
  for (const store of stores) {
    store.$reset()
  }
}

export default pinia
