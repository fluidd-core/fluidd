const mcuKeys = [
  'i2c_mcu',
  'sensor_mcu',
]

const getMcusFromMcuKeyInConfig = (config: Record<string, any>): string[] | undefined => {
  for (const key of mcuKeys) {
    if (key in config) {
      const value = config[key]

      if (
        typeof value === 'string' &&
        value
      ) {
        return [value]
      }
    }
  }
}

const getMcusFromPinKeyInConfig = (config: Record<string, any>): string[] | undefined => {
  const mcus = new Set<string>()

  const pinKeys = Object.keys(config)
    .filter(key => (
      key === 'pin' ||
      key.endsWith('_pin')
    ))

  for (const key of pinKeys) {
    const value = config[key]

    if (
      typeof value === 'string' &&
      value.includes(':')
    ) {
      const mcu = value.split(':')[0]?.replace(/^[!~^]+/, '')

      if (mcu) {
        mcus.add(mcu)
      }
    }
  }

  return [...mcus]
}

const getMcusFromConfig = (config: Record<string, any>): string[] | undefined => (
  getMcusFromMcuKeyInConfig(config) ||
  getMcusFromPinKeyInConfig(config)
)

export default getMcusFromConfig
