import Vue from 'vue'
import { createPinia, PiniaVuePlugin } from 'pinia'
import { storeRegistryPlugin, getStores } from './helpers/storesPlugins'

Vue.use(PiniaVuePlugin)

const pinia = createPinia()
pinia.use(storeRegistryPlugin)

// Eagerly instantiate every store so it registers with `storeRegistryPlugin`
// (and can receive dispatched socket actions) even if no component ever uses it.
const modules = import.meta.glob<Record<string, unknown>>(
  ['./*.ts', '!./index.ts'], { eager: true }
)
for (const mod of Object.values(modules)) {
  for (const useStore of Object.values(mod)) {
    if (typeof useStore === 'function' && '$id' in useStore) {
      useStore(pinia)
    }
  }
}

// Mirrors Vuex reset's `keys` filtering; returns reset ids so callers can reconcile modules.
export function resetPiniaStores (keys?: string[]) {
  const resetIds: string[] = []

  for (const store of getStores()) {
    if (!keys || keys.includes(store.$id)) {
      store.$reset()
      resetIds.push(store.$id)
    }
  }

  return resetIds
}

export default pinia
