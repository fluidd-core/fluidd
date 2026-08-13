import { consola } from 'consola'
import { getStores } from './storesPlugins'

// Unmatched namespace/action logs and no-ops — WebSocketClient has no way to
// surface a dispatch failure back to the caller.
export function usePiniaStore (piniaAction: string, result: unknown) {
  const [namespace, action] = piniaAction.split('/')

  for (const piniaStore of getStores()) {
    if (piniaStore.$id === namespace) {
      piniaStore[action](result)
      return
    }
  }
  consola.error('pinia request failed')
}
