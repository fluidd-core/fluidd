const sanitizeEndpoint = (endpoint: string|undefined) : string|undefined => {
  if (endpoint) {
    try {
      const url = new URL(endpoint)
      const path = url.pathname.endsWith('/')
        ? url.pathname.slice(0, url.pathname.length - 1)
        : url.pathname
      return `${url.protocol}//${url.host}${path}`
    } catch (e) {
      console.debug('error parsing url', e)
    }
  }
  return undefined
}

export default sanitizeEndpoint
