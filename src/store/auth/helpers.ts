import store from '@/store'
import md5 from 'md5'

/**
 * Determines the token key based on a given api configuration.
 */
export const getTokenKeys = () => {
  const url = store.state.config.apiUrl
  const hash = (url) ? md5(url) : ''
  return {
    'user-token': `user-token-${hash}`,
    'refresh-token': `refresh-token-${hash}`
  }
}
