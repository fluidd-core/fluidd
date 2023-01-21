const numberArrayCompare = (versionA: number[], versionB: number[]) => {
  const count = Math.max(versionA.length, versionB.length)

  for (let index = 0; index < count; index++) {
    const a = versionA[index] ?? 0
    const b = versionB[index] ?? 0

    if (a > b) {
      return -1
    } else if (a < b) {
      return 1
    }
  }

  return 0
}

export default numberArrayCompare
