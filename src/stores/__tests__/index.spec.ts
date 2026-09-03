import { ref } from 'vue'
import { defineStore, setActivePinia } from 'pinia'
import pinia, { resetPiniaStores } from '@/stores'

const useOptionsStore = defineStore('test-options', {
  state: () => ({
    items: [] as string[],
    nested: { count: 0 }
  })
})

const useSetupStore = defineStore('test-setup', () => {
  const count = ref(0)

  const $reset = () => {
    count.value = 0
  }

  return { count, $reset }
})

describe('resetPiniaStores', () => {
  beforeEach(() => {
    setActivePinia(pinia)
  })

  it('resets an options store', () => {
    const store = useOptionsStore()

    store.items.push('a')
    store.nested.count = 5

    resetPiniaStores()

    expect(store.items).toEqual([])
    expect(store.nested.count).toBe(0)
  })

  it('resets a setup store through its own $reset', () => {
    const store = useSetupStore()

    store.count = 5

    resetPiniaStores()

    expect(store.count).toBe(0)
  })
})
