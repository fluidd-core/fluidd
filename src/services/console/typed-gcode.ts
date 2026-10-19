import { sensorCommand, type SensorConfigFile } from '@/services/control/model'

export interface TypedBatch {
  refusal: string | null;
  restarts: boolean;
  onlyRestarts: boolean;
  savesConfig: boolean;
}

/** Klipper gcode.py command detection, including numbered lines. Not macro expansion. */
function commandOf (line: string): string {
  const parts = line.split(';', 1)[0].toUpperCase().split(/([A-Z_]+|[A-Z*])/)
  return (parts.slice(0, 2).join('') === 'N' ? parts.slice(3, 5) : parts.slice(0, 3)).join('').trim()
}

/** POSIX-style quotes/comments for sensor arguments. Escapes are refused conservatively. */
function parameters (raw: string): Record<string, string> | null {
  const tokens: string[] = []
  let token = ''
  let quote = ''
  for (const char of raw) {
    if (char === '\\') return null
    if (quote) {
      if (char === quote) quote = ''
      else token += char
    } else if (char === '"' || char === "'") quote = char
    else if (char === '#' || char === ';') break
    else if (/\s/.test(char)) {
      if (token) tokens.push(token)
      token = ''
    } else token += char
  }
  if (quote) return null
  if (token) tokens.push(token)
  const result: Record<string, string> = {}
  for (const token of tokens) {
    const equal = token.indexOf('=')
    if (equal < 1) return null
    // Klipper uses the last duplicate key, with case-insensitive parameter names.
    result[token.slice(0, equal).toUpperCase()] = token.slice(equal + 1)
  }
  return result
}

/** Preflight the entire submission before sending a single line. */
export function inspectTypedGcode (script: string, configfile?: SensorConfigFile): TypedBatch {
  let restarts = false
  let onlyRestarts = true
  let savesConfig = false
  for (const original of script.split('\n')) {
    const line = original.trim()
    const command = commandOf(line)
    if (!command) continue
    if (['RESTART', 'FIRMWARE_RESTART'].includes(command)) {
      restarts = true
      continue
    }
    if (command === 'SAVE_CONFIG') {
      restarts = true
      savesConfig = true
      onlyRestarts = false
      continue
    }
    onlyRestarts = false
    if (command !== 'SET_FILAMENT_SENSOR') continue
    let start = command.length
    let end = line.length
    if (!line.toUpperCase().startsWith(command)) {
      start += line.toUpperCase().indexOf(command)
      const checksum = line.lastIndexOf('*')
      if (checksum >= 0 && /^\d+$/.test(line.slice(checksum + 1))) end = checksum
    }
    const args = parameters(line.slice(start, end))
    if (!args?.SENSOR || !/^[+-]?\d+$/.test(args.ENABLE ?? '')) {
      return { refusal: 'Not sent. Check the sensor name and ENABLE value. Control cannot safely check this sensor command.', restarts, onlyRestarts, savesConfig }
    }
    if (!sensorCommand(args.SENSOR, Number(args.ENABLE) !== 0, configfile)) {
      return { refusal: 'Not sent. This sensor starts the automatic filament load, or its settings have not loaded yet. Control keeps it on.', restarts, onlyRestarts, savesConfig }
    }
  }
  return { refusal: null, restarts, onlyRestarts, savesConfig }
}
