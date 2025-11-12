import { IPv4, IPv6 } from 'ipaddr.js'

const isLoopback = (hostname: string) => {
  hostname = hostname.trim().toLowerCase()

  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    hostname = hostname.slice(1, -1)
  }

  if (hostname === 'localhost') {
    return true
  }

  if (IPv4.isValid(hostname)) {
    return IPv4.parse(hostname).range() === 'loopback'
  }

  if (IPv6.isValid(hostname)) {
    const ipAddress = IPv6.parse(hostname)

    switch (ipAddress.range()) {
      case 'loopback':
        return true

      case 'ipv4Mapped':
        return (
          ipAddress.toIPv4Address().range() === 'loopback'
        )
    }
  }

  return false
}

export default isLoopback
