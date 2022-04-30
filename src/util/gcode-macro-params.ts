const paramRegExp = /params\.(\w+)(.*)/gi
const defaultValueRegExp = /\|\s*default\s*\(\s*((["'])(?:\\.|[^\2])*\2|-?[0-9][^,)]*)/i

export const gcodeMacroParamDefault = (param: string) => {
  const valueMatch = defaultValueRegExp.exec(param)

  return ((valueMatch && valueMatch[1]) || '').trim()
}

const gcodeMacroParams = (gcode: string) => {
  return [...gcode.matchAll(paramRegExp)].map(([, name, rest]) => ({
    name,
    value: gcodeMacroParamDefault(rest)
  }))
}

export default gcodeMacroParams
