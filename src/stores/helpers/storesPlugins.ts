import type { PiniaPluginContext, StoreGeneric } from 'pinia'

const stores = new Set<StoreGeneric>()

export const storeRegistryPlugin = ({ store }: PiniaPluginContext) => {
  stores.add(store)
}

export const getStores = () => stores
