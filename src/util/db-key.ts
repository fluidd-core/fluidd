const dbKey = (strings: TemplateStringsArray, ...values: string[]) => {
  const result: string[] = []

  for (let index = 0; index < strings.length; index++) {
    const parts = strings[index]
      .split('.')
      .filter(Boolean)

    result.push(...parts)

    if (index < values.length) {
      result.push(values[index])
    }
  }

  return result
}

export default dbKey
