import {
  type PiniaPluginContext,
  type StoreGeneric,
} from 'pinia'

const stores = new Set<StoreGeneric>()

// Hooks into defineStore and registers stores
export const storeRegistryPlugin = ({ store }: PiniaPluginContext) => {
  stores.add(store)
}

export const getStores = () => stores
