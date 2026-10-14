/** Direct printers use explicit local IPs or mDNS names, including on HTTPS pages. */
export function localHost (address: string): string {
  const value = address.trim().replace(/^http:\/\//i, '').replace(/\/$/, '')
  if (!value || /[\s/@?#\\]/.test(value)) throw new Error('Use a local IP address or a .local name, with an optional port.')
  let url: URL
  try { url = new URL(`http://${value}`) } catch { throw new Error('That is not a printer address.') }
  const host = url.hostname.toLowerCase()
  const parts = host.split('.').map(Number)
  const ipv4 = parts.length === 4 && parts.every(n => Number.isInteger(n) && n >= 0 && n <= 255)
  const privateIpv4 = ipv4 && (parts[0] === 10 || parts[0] === 127 ||
    (parts[0] === 192 && parts[1] === 168) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 169 && parts[1] === 254))
  const privateIpv6 = host === '[::1]' || /^\[(?:f[cd][0-9a-f]{2}:|fe[89ab][0-9a-f]:)/i.test(host)
  const mdns = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.local$/.test(host)
  if (!privateIpv4 && !privateIpv6 && !mdns && host !== 'localhost') throw new Error('This printer must be on your local network. Use its local IP address or .local name.')
  return url.host
}

export function localCameraUrl (value: unknown, host: string): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    const url = new URL(value, `http://${host}`)
    if (!['http:', 'https:', 'rtsp:'].includes(url.protocol) || url.username || url.password) return null
    localHost(url.host)
    return url.href
  } catch { return null }
}
