import isKeyOf from './is-key-of'

const quotableCharsRegexp = /[ '"#;=\\]/

export type ParamValue = number | string | { value: string | number }

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
  return /^[gm]\d+$/i.test(commandName)
}

export const gcodeCommandBuilder = (commandName: string, params: Record<string, ParamValue>) => {
  commandName = commandName.toUpperCase()

  const basicGcodeCommand = isBasicGcodeCommand(commandName)
  const paramNameForRawGcodeCommand = getParamNameForRawGcodeCommand(commandName)

  const paramsString = paramNameForRawGcodeCommand
    ? getParamValue(params[paramNameForRawGcodeCommand])
    : Object.entries(params)
      .map(([key, param]) => {
        key = key.toUpperCase()

        const value = getParamValue(param)

        if (!value) {
          return null
        }

        if (basicGcodeCommand) {
          return `${key}${value}`
        }

        if (quotableCharsRegexp.test(value)) {
          const encodedValue = value
            .replace(/\\/g, '\\\\')
            .replace(/"/g, '\\"')

          return `${key}="${encodedValue}"`
        }

        return `${key}=${value}`
      })
      .filter(x => x != null)
      .join(' ')

  if (paramsString) {
    return `${commandName} ${paramsString}`
  }

  return commandName
}

export const getParamValue = (param: ParamValue) => {
  return typeof param === 'object'
    ? param.value.toString()
    : param.toString()
}
