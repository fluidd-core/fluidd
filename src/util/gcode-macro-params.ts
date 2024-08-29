const paramRegExp = /params\.(\w+)(.*)/gi
const defaultValueRegExp = /\|\s*default\s*\(\s*((["'])(?:\\\2|.)*?\2|-?\d[^,)]*)/i

export const gcodeMacroParamDefault = (param: string) => {
  const valueMatch = defaultValueRegExp.exec(param)

  if (!valueMatch) {
    return ''
  }

  const value = (valueMatch[1] || '').trim()

  return valueMatch[2]
    ? value.substring(1, value.length - 1)
    : value
}

const gcodeMacroParams = (gcode: string) => {
  return [...gcode.matchAll(paramRegExp)].map(([, name, rest]) => ({
    name,
    value: gcodeMacroParamDefault(rest)
  }))
}

export default gcodeMacroParams
