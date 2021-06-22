/**
 * Map object prefixes and names to their generic types.
 * I.e., temperature_fans and heater_fans are both fans.
 */
export default (name: string) => {
  const fans = [
    'temperature_fan',
    'controller_fan',
    'heater_fan',
    'fan_generic',
    'fan'
  ]

  const sensors = [
    'temperature_sensor',
    'temperature_probe'
  ]

  const heaters = [
    'heater_generic',
    'extruder'
  ]

  const beds = [
    'heater_bed'
  ]

  if (fans.some(s => name.startsWith(s))) return 'fan'
  if (sensors.some(s => name.startsWith(s))) return 'sensor'
  if (heaters.some(s => name.startsWith(s))) return 'heater'
  if (beds.some(s => name.startsWith(s))) return 'bed'
  return ''
}
