import { consola } from 'consola'

const sanitizeEndpoint = (endpoint?: string) => {
  if (endpoint) {
    try {
      const url = new URL(endpoint)
      const path = url.pathname.endsWith('/')
        ? url.pathname.slice(0, -1)
        : url.pathname
      return `${url.protocol}//${url.host}${path}`
    } catch (e) {
      consola.debug('Error parsing endpoint url in config.json', e)
    }
  }
}

export default sanitizeEndpoint
