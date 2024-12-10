import isKeyOf from './is-key-of'

const basicGcodeCommandRegexp = /^[gm]\d+$/i
const quotableCharsRegexp = /[ '"#;=\\]/

export type GcodeParamValueType = number | string | false | null | undefined
export type GcodeParamValue = GcodeParamValueType | { value: GcodeParamValueType }

export const rawGcodeCommands = {
  M117: 'Message',
  M118: 'Message',
  M23: 'Filename'
}

export const getParamNameForRawGcodeCommand = (commandName: string) => {
  return (
    isKeyOf(commandName, rawGcodeCommands) &&
    rawGcodeCommands[commandName]
  )
}

export const isBasicGcodeCommand = (commandName: string) => {
  return basicGcodeCommandRegexp.test(commandName)
}

export const getParamValueAsString = (param: GcodeParamValue) => {
  if (param && typeof param === 'object') {
    param = param.value
  }

  if (
    !param &&
    param !== 0
  ) {
    return ''
  }

  return param.toString()
}

export const encodeGcodeParamValue = (value: string) => {
  if (quotableCharsRegexp.test(value)) {
    return `"${value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')}"`
  }

  return value
}

export const gcodeCommandBuilder = (commandName: string, params: Record<string, GcodeParamValue>) => {
  commandName = commandName.toUpperCase()

  const basicGcodeCommand = isBasicGcodeCommand(commandName)
  const paramNameForRawGcodeCommand = getParamNameForRawGcodeCommand(commandName)

  const paramsString = paramNameForRawGcodeCommand
    ? getParamValueAsString(params[paramNameForRawGcodeCommand])
    : Object.entries(params)
      .map(([key, param]) => {
        key = key.toUpperCase()

        const value = getParamValueAsString(param)

        if (!value) {
          return null
        }

        if (basicGcodeCommand) {
          return `${key}${value}`
        }

        return `${key}=${encodeGcodeParamValue(value)}`
      })
      .filter(x => x != null)
      .join(' ')

  if (paramsString) {
    return `${commandName} ${paramsString}`
  }

  return commandName
}
