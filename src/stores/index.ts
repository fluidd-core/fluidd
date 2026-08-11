import Vue from 'vue'
import { createPinia, PiniaVuePlugin } from 'pinia'
import { storeRegistryPlugin, getStores } from './helpers/storesPlugins'

Vue.use(PiniaVuePlugin)

const pinia = createPinia()
pinia.use(storeRegistryPlugin)

// Eagerly instantiate every store so it registers with `storeRegistryPlugin`
// (and can receive dispatched socket actions) even if no component ever uses it.
const modules = import.meta.glob<Record<string, unknown>>(['./*.ts', '!./index.ts'], { eager: true })
for (const mod of Object.values(modules)) {
  for (const useStore of Object.values(mod)) {
    if (typeof useStore === 'function' && '$id' in useStore) {
      useStore(pinia)
    }
  }
}

/**
 * Resets pinia stores. Mirrors the Vuex `reset` action's `keys` filtering,
 * so a scoped reset (e.g. resetKlippy) only touches the stores it names.
 * Returns the ids of the stores that were reset, so callers can reconcile
 * against Vuex modules and flag keys that matched neither.
 */
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
